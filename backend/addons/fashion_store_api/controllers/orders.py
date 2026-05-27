"""Order history endpoints.

GET  /fashionos/api/v1/account/orders          — order list (paginated)
GET  /fashionos/api/v1/account/orders/<order_id> — order detail
"""
import logging

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, paginated

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/account/orders'

# sale.order states considered "confirmed" for order history
_HISTORY_STATES = ['sale', 'done', 'cancel']


class OrdersController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS
    # ------------------------------------------------------------------

    @http.route(
        [_BASE, f'{_BASE}/<int:order_id>'],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # GET /account/orders?page=1&limit=10
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['GET'], csrf=False)
    def list_orders(self, page='1', limit='10', **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            page_n = max(1, int(page))
            limit_n = min(50, max(1, int(limit)))
        except (ValueError, TypeError):
            return error('page and limit must be positive integers', 400, 'VALIDATION_ERROR')

        offset = (page_n - 1) * limit_n
        env = request.env(user=1)

        domain = [
            ('partner_id', '=', partner.id),
            ('x_is_cart', '=', False),
            ('state', 'in', _HISTORY_STATES),
        ]
        total = env['sale.order'].search_count(domain)
        orders = env['sale.order'].search(
            domain,
            order='date_order desc',
            limit=limit_n,
            offset=offset,
        )

        return paginated(
            items=[_order_summary_dict(o) for o in orders],
            total=total,
            page=page_n,
            limit=limit_n,
        )

    # ------------------------------------------------------------------
    # GET /account/orders/<order_id>
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/<int:order_id>', type='http', auth='none', methods=['GET'], csrf=False)
    def get_order(self, order_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env(user=1)
        order = env['sale.order'].browse(order_id)

        if not order.exists():
            return error('Order not found', 404, 'NOT_FOUND')
        if order.partner_id.id != partner.id:
            return error('Order not found', 404, 'NOT_FOUND')
        if order.x_is_cart or order.state not in _HISTORY_STATES:
            return error('Order not found', 404, 'NOT_FOUND')

        return ok(_order_detail_dict(order))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _order_summary_dict(order) -> dict:
    return {
        'id': order.id,
        'name': order.name,
        'date_order': order.date_order.isoformat() if order.date_order else None,
        'state': order.state,
        'state_label': _state_label(order.state),
        'amount_total': order.amount_total,
        'item_count': int(sum(
            line.product_uom_qty
            for line in order.order_line
            if not line.display_type
        )),
        'coolcash_redeemed': int(order.x_coolcash_amount_used or 0),
        'coolcash_earned': int(order.x_coolcash_earned or 0),
    }


def _order_detail_dict(order) -> dict:
    lines = []
    for line in order.order_line:
        if line.display_type:
            continue  # skip section/note lines
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
            'price_subtotal': line.price_subtotal,
            'image_url': f'/web/image/product.product/{line.product_id.id}/image_128',
        })

    return {
        'id': order.id,
        'name': order.name,
        'date_order': order.date_order.isoformat() if order.date_order else None,
        'state': order.state,
        'state_label': _state_label(order.state),
        'amount_untaxed': order.amount_untaxed,
        'amount_tax': order.amount_tax,
        'amount_total': order.amount_total,
        'note': order.note or '',
        'gender_title': order.x_gender_title or '',
        'alt_receiver_name': order.x_alt_receiver_name or '',
        'alt_receiver_phone': order.x_alt_receiver_phone or '',
        'referral_code': order.x_referral_code or '',
        'coolcash_redeemed': int(order.x_coolcash_amount_used or 0),
        'coolcash_earned': int(order.x_coolcash_earned or 0),
        'shipping_address': _address_dict(order.partner_shipping_id),
        'lines': lines,
    }


def _address_dict(partner) -> dict:
    if not partner:
        return {}
    return {
        'id': partner.id,
        'name': partner.name or '',
        'street': partner.street or '',
        'street2': partner.street2 or '',
        'city': partner.city or '',
        'zip': partner.zip or '',
        'phone': partner.phone or '',
    }


def _state_label(state: str) -> str:
    labels = {
        'draft':    'Nháp',
        'sent':     'Đã gửi báo giá',
        'sale':     'Đang xử lý',
        'done':     'Hoàn thành',
        'cancel':   'Đã huỷ',
    }
    return labels.get(state, state)
