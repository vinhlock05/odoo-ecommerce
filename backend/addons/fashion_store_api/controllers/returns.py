"""KF-1: Returns portal endpoints.

POST /fashionos/api/v1/account/returns              — create return request
GET  /fashionos/api/v1/account/returns              — list my returns
GET  /fashionos/api/v1/account/returns/<request_id> — return detail
"""
import logging

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.mail import send_mail_safe
from ..utils.response import error, ok, paginated, parse_body

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/account/returns'


class ReturnsController(http.Controller):

    @http.route(
        [_BASE, f'{_BASE}/<int:request_id>'],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # POST /account/returns
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['POST'], csrf=False)
    def create_return(self, **_kw):
        """Create a return request.

        Body:
            order_id    (int, required)
            reason      (str, required): one of the selection values
            note        (str, optional)
            refund_method (str, optional): 'coolcash' or 'bank'. Default 'coolcash'.
            lines       (list, required): [{ order_line_id, return_qty }]
        """
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON', 400, 'MALFORMED_JSON')

        order_id = body.get('order_id')
        reason   = body.get('reason', '')
        lines    = body.get('lines', [])

        if not order_id or not reason or not lines:
            return error('order_id, reason, and lines are required', 400, 'VALIDATION_ERROR')

        su = request.env(user=1)
        order = su['sale.order'].browse(int(order_id))
        if not order.exists() or order.partner_id.id != partner.id:
            return error('Order not found', 404, 'NOT_FOUND')
        if order.state not in ('sale', 'done'):
            return error('Order is not confirmed', 400, 'INVALID_ORDER_STATE')
        if order.x_is_cart:
            return error('Order not found', 404, 'NOT_FOUND')

        # Validate reason value
        valid_reasons = [r[0] for r in su['fashion.return.request']._fields['reason'].selection]
        if reason not in valid_reasons:
            return error(f'reason must be one of: {valid_reasons}', 400, 'VALIDATION_ERROR')

        try:
            ret = su['fashion.return.request'].create({
                'order_id': order.id,
                'partner_id': partner.id,
                'reason': reason,
                'note': body.get('note', ''),
                'refund_method': body.get('refund_method', 'coolcash'),
            })
            for line_data in lines:
                line_id  = int(line_data.get('order_line_id', 0))
                qty      = float(line_data.get('return_qty', 1))
                ol = su['sale.order.line'].browse(line_id)
                if not ol.exists() or ol.order_id.id != order.id:
                    continue
                su['fashion.return.line'].create({
                    'request_id': ret.id,
                    'order_line_id': line_id,
                    'return_qty': qty,
                })
        except Exception:
            _logger.exception('Create return failed for partner %s order %s', partner.id, order_id)
            return error('Failed to create return request', 500, 'SERVER_ERROR')

        send_mail_safe('fashion_store_return.mail_template_return_received', ret.id)
        return ok(_return_dict(ret), 201)

    # ------------------------------------------------------------------
    # GET /account/returns
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['GET'], csrf=False)
    def list_returns(self, page='1', limit='10', **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            page_n  = max(1, int(page))
            limit_n = min(50, max(1, int(limit)))
        except (ValueError, TypeError):
            return error('page and limit must be integers', 400, 'VALIDATION_ERROR')

        su = request.env(user=1)
        domain = [('partner_id', '=', partner.id)]
        total = su['fashion.return.request'].search_count(domain)
        recs = su['fashion.return.request'].search(
            domain, limit=limit_n, offset=(page_n - 1) * limit_n,
        )
        return paginated(
            items=[_return_dict(r) for r in recs],
            total=total, page=page_n, limit=limit_n,
        )

    # ------------------------------------------------------------------
    # GET /account/returns/<request_id>
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/<int:request_id>', type='http', auth='none', methods=['GET'], csrf=False)
    def get_return(self, request_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        su = request.env(user=1)
        ret = su['fashion.return.request'].browse(request_id)
        if not ret.exists() or ret.partner_id.id != partner.id:
            return error('Return request not found', 404, 'NOT_FOUND')
        return ok(_return_dict(ret))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _return_dict(ret) -> dict:
    return {
        'id': ret.id,
        'name': ret.name,
        'order_id': ret.order_id.id,
        'order_name': ret.order_id.name,
        'state': ret.state,
        'reason': ret.reason,
        'note': ret.note or '',
        'refund_amount': int(ret.refund_amount),
        'refund_method': ret.refund_method,
        'create_date': ret.create_date.isoformat() if ret.create_date else None,
        'lines': [
            {
                'id': l.id,
                'product_name': l.product_id.product_tmpl_id.name if l.product_id else '',
                'return_qty': l.return_qty,
                'price_unit': l.price_unit,
                'subtotal': int(l.subtotal),
            }
            for l in ret.return_lines
        ],
    }
