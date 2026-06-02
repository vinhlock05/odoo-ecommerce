"""Cart endpoints backed by sale.order draft with x_is_cart=True."""
import logging

from odoo import http
from odoo.exceptions import ValidationError
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/cart'

# Free-shipping threshold (VND) — mirrors the feature-flag default
_FREE_SHIPPING_THRESHOLD = 500_000


class CartController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS pre-flight
    # ------------------------------------------------------------------

    @http.route(
        [
            _BASE,
            f'{_BASE}/items',
            f'{_BASE}/items/<int:line_id>',
            f'{_BASE}/apply-coolcash',
        ],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # GET /cart
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['GET'], csrf=False)
    def get_cart(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')
        su = request.env(user=1)
        cart = su['sale.order'].search(
            [('partner_id', '=', partner.id), ('x_is_cart', '=', True), ('state', '=', 'draft')],
            limit=1,
        )
        if not cart:
            ICP = su['ir.config_parameter']
            threshold = float(ICP.get_param('fashionos.ff.free_shipping_threshold', str(_FREE_SHIPPING_THRESHOLD)) or _FREE_SHIPPING_THRESHOLD)
            return ok({
                'id': None,
                'partner_id': partner.id,
                'currency': 'VND',
                'items': [],
                'item_count': 0,
                'subtotal': 0.0,
                'subtotal_after_coolcash': 0.0,
                'coolcash_applied': {'amount': 0, 'is_applied': False},
                'free_shipping_progress': {
                    'threshold': threshold,
                    'subtotal': 0.0,
                    'remaining': threshold,
                    'unlocked': False,
                },
            })
        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # POST /cart/items   {"product_id": int, "quantity": float}
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/items', type='http', auth='none', methods=['POST'], csrf=False)
    def add_item(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        product_id = body.get('product_id')
        quantity = body.get('quantity', 1)

        if not product_id:
            return error('product_id is required', 400, 'VALIDATION_ERROR')
        try:
            product_id_int = int(product_id)
        except (ValueError, TypeError):
            return error('product_id must be a valid integer', 400, 'VALIDATION_ERROR')
        try:
            quantity = float(quantity)
            if quantity <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return error('quantity must be a positive number', 400, 'VALIDATION_ERROR')

        env = request.env
        su = env(user=1)
        product = su['product.product'].browse(product_id_int)
        if not product.exists():
            # product_id might be a product.template ID — resolve to first active variant
            tmpl = su['product.template'].browse(product_id_int)
            if tmpl.exists() and tmpl.product_variant_ids:
                product = tmpl.product_variant_ids[0]
            else:
                _logger.warning('add_item: product_id=%s not found', product_id_int)
                return error('Product not found', 404, 'NOT_FOUND')

        cart = _get_or_create_cart(env, partner)

        # Find existing line or create new one
        existing_line = cart.order_line.filtered(
            lambda l: l.product_id.id == product.id
        )
        try:
            if existing_line:
                existing_line[0].write({'product_uom_qty': existing_line[0].product_uom_qty + quantity})
            else:
                su['sale.order.line'].create({
                    'order_id': cart.id,
                    'product_id': product.id,
                    'product_uom_qty': quantity,
                    'price_unit': product.lst_price,
                })
        except Exception:
            _logger.exception('Failed to add item product_id=%s to cart', product_id_int)
            return error('Failed to add item to cart', 500, 'SERVER_ERROR')

        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # PUT /cart/items/<line_id>   {"quantity": float}
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/items/<int:line_id>',
        type='http', auth='none', methods=['PUT'], csrf=False,
    )
    def update_item(self, line_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        quantity = body.get('quantity')
        if quantity is None:
            return error('quantity is required', 400, 'VALIDATION_ERROR')
        try:
            quantity = float(quantity)
            if quantity < 0:
                raise ValueError
        except (ValueError, TypeError):
            return error('quantity must be a non-negative number', 400, 'VALIDATION_ERROR')

        env = request.env
        line = env(user=1)['sale.order.line'].browse(line_id)
        if not line.exists() or line.order_id.partner_id.id != partner.id:
            return error('Cart line not found', 404, 'NOT_FOUND')
        if not line.order_id.x_is_cart:
            return error('Cart line not found', 404, 'NOT_FOUND')

        if quantity == 0:
            line.unlink()
        else:
            line.write({'product_uom_qty': quantity})

        cart = _get_or_create_cart(env, partner)
        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # DELETE /cart/items/<line_id>
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/items/<int:line_id>',
        type='http', auth='none', methods=['DELETE'], csrf=False,
    )
    def remove_item(self, line_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        line = env(user=1)['sale.order.line'].browse(line_id)
        if not line.exists() or line.order_id.partner_id.id != partner.id:
            return error('Cart line not found', 404, 'NOT_FOUND')
        if not line.order_id.x_is_cart:
            return error('Cart line not found', 404, 'NOT_FOUND')

        cart = line.order_id
        line.unlink()
        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # POST /cart/apply-coolcash   {"amount": int}
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/apply-coolcash', type='http', auth='none', methods=['POST'], csrf=False)
    def apply_coolcash(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')

        amount = body.get('amount')
        if amount is None:
            return error('amount is required', 400, 'VALIDATION_ERROR')
        try:
            amount = int(float(amount))
            if amount <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return error('amount must be a positive integer', 400, 'VALIDATION_ERROR')

        # Check sufficient balance
        su_partner = request.env(user=1)['res.partner'].browse(partner.id)
        if su_partner.x_coolcash_balance < amount:
            return error(
                f'Insufficient CoolCash balance. '
                f'Available: {int(su_partner.x_coolcash_balance)}',
                400,
                'INSUFFICIENT_COOLCASH',
            )

        cart = _get_or_create_cart(request.env, partner)
        if not cart.order_line:
            return error('Cart is empty', 400, 'CART_EMPTY')

        # Cap applied amount at cart subtotal
        subtotal = sum(cart.order_line.mapped('price_subtotal'))
        capped = min(amount, int(subtotal))

        cart.write({'x_coolcash_amount_used': capped})
        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # DELETE /cart/apply-coolcash  (remove applied CoolCash)
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/apply-coolcash', type='http', auth='none', methods=['DELETE'], csrf=False)
    def remove_coolcash(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        cart = env(user=1)['sale.order'].search(
            [('partner_id', '=', partner.id), ('x_is_cart', '=', True),
             ('state', '=', 'draft')],
            limit=1,
        )
        if cart:
            cart.write({'x_coolcash_amount_used': 0.0})
        return ok({'message': 'CoolCash removed from cart'})

    # ------------------------------------------------------------------
    # DELETE /cart  (clear all items)
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['DELETE'], csrf=False)
    def clear_cart(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        cart = env(user=1)['sale.order'].search(
            [('partner_id', '=', partner.id), ('x_is_cart', '=', True),
             ('state', '=', 'draft')],
            limit=1,
        )
        if cart:
            cart.order_line.unlink()
        return ok({'message': 'Cart cleared'})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_create_cart(env, partner):
    """Return the active draft cart for the partner, creating one if needed.

    Uses with_user(1) (SUPERUSER_ID) instead of sudo() because in Odoo 19
    auth='none' routes leave env.uid anonymous/empty. sudo() only sets su=True
    but does NOT change uid, so env.user stays an empty recordset and
    sale.order._compute_user_id → has_group() → ensure_one() raises ValueError.
    with_user(1) sets env.uid=1 so env.user is the admin singleton.
    """
    su = env(user=1)
    cart = su['sale.order'].search(
        [('partner_id', '=', partner.id), ('x_is_cart', '=', True),
         ('state', '=', 'draft')],
        limit=1,
    )
    if not cart:
        cart = su['sale.order'].create({
            'partner_id': partner.id,
            'x_is_cart': True,
        })
    return cart


def _cart_dict(cart) -> dict:
    lines = []
    subtotal = 0.0
    for line in cart.order_line:
        line_total = line.price_subtotal
        subtotal += line_total
        lines.append({
            'id': line.id,
            'product_id': line.product_id.id,
            'product_name': line.product_id.product_tmpl_id.name,
            'variant_name': ', '.join(
                line.product_id.product_template_attribute_value_ids
                .mapped('product_attribute_value_id.name')
            ),
            'default_code': line.product_id.default_code or '',
            'quantity': line.product_uom_qty,
            'price_unit': line.price_unit,
            'price_subtotal': line_total,
            'image_url': f'/web/image/product.product/{line.product_id.id}/image_128',
        })

    # Free-shipping progress
    ICP = cart.env['ir.config_parameter'].sudo()
    threshold = float(ICP.get_param('fashionos.ff.free_shipping_threshold', str(_FREE_SHIPPING_THRESHOLD)) or _FREE_SHIPPING_THRESHOLD)
    remaining = max(0.0, threshold - subtotal)
    free_shipping_progress = {
        'threshold': threshold,
        'subtotal': subtotal,
        'remaining': remaining,
        'unlocked': remaining == 0.0,
    }

    # CoolCash applied
    coolcash_used = cart.x_coolcash_amount_used or 0.0
    coolcash_applied = {
        'amount': int(coolcash_used),
        'is_applied': coolcash_used > 0,
    }

    return {
        'id': cart.id,
        'partner_id': cart.partner_id.id,
        'currency': cart.currency_id.name if cart.currency_id else 'VND',
        'items': lines,
        'item_count': len(lines),
        'subtotal': subtotal,
        'subtotal_after_coolcash': max(0.0, subtotal - coolcash_used),
        'coolcash_applied': coolcash_applied,
        'free_shipping_progress': free_shipping_progress,
    }
