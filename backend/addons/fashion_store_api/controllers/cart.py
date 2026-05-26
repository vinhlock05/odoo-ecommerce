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
        [_BASE, f'{_BASE}/items', f'{_BASE}/items/<int:line_id>'],
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
        cart = _get_or_create_cart(request.env, partner)
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
        product = env['product.product'].sudo().browse(product_id_int)
        if not product.exists():
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
                env['sale.order.line'].sudo().create({
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
        line = env['sale.order.line'].sudo().browse(line_id)
        if not line.exists() or line.order_id.partner_id.id != partner.id:
            return error('Cart line not found', 404, 'NOT_FOUND')
        if not line.order_id.x_is_cart:
            return error('Cart line not found', 404, 'NOT_FOUND')

        if quantity == 0:
            line.unlink()
        else:
            line.product_uom_qty = quantity

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
        line = env['sale.order.line'].sudo().browse(line_id)
        if not line.exists() or line.order_id.partner_id.id != partner.id:
            return error('Cart line not found', 404, 'NOT_FOUND')
        if not line.order_id.x_is_cart:
            return error('Cart line not found', 404, 'NOT_FOUND')

        cart = line.order_id
        line.unlink()
        return ok(_cart_dict(cart))

    # ------------------------------------------------------------------
    # DELETE /cart  (clear all items)
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['DELETE'], csrf=False)
    def clear_cart(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        cart = env['sale.order'].sudo().search(
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
    """Return the active draft cart for the partner, creating one if needed."""
    cart = env['sale.order'].sudo().search(
        [('partner_id', '=', partner.id), ('x_is_cart', '=', True),
         ('state', '=', 'draft')],
        limit=1,
    )
    if not cart:
        cart = env['sale.order'].sudo().create({
            'partner_id': partner.id,
            'x_is_cart': True,
            'state': 'draft',
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
            'product_name': line.product_id.name,
            'variant_name': line.product_id.product_tmpl_id.name,
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

    return {
        'id': cart.id,
        'partner_id': cart.partner_id.id,
        'currency': cart.currency_id.name if cart.currency_id else 'VND',
        'items': lines,
        'item_count': len(lines),
        'subtotal': subtotal,
        'free_shipping_progress': free_shipping_progress,
    }
