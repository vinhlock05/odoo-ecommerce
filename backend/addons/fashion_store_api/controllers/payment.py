"""Payment endpoints — VNPay gateway.

POST /fashionos/api/v1/payment/vnpay/create   — generate payment URL
GET  /fashionos/api/v1/payment/vnpay/return   — VNPay redirect handler
POST /fashionos/api/v1/payment/vnpay/ipn      — VNPay IPN (server-to-server)
POST /fashionos/api/v1/delivery/ghn/webhook   — GHN tracking updates
POST /fashionos/api/v1/delivery/ghn/create    — create GHN shipment
"""
import json
import logging

import requests

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_PAY_BASE = '/fashionos/api/v1/payment/vnpay'
_GHN_BASE = '/fashionos/api/v1/delivery/ghn'

GHN_SANDBOX_API = 'https://dev-online-gateway.ghn.vn/shiip/public-api'
GHN_LIVE_API    = 'https://online-gateway.ghn.vn/shiip/public-api'


class PaymentController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS pre-flight
    # ------------------------------------------------------------------

    @http.route(
        [
            _PAY_BASE,
            f'{_PAY_BASE}/create',
            f'{_PAY_BASE}/return',
            f'{_PAY_BASE}/ipn',
            f'{_GHN_BASE}/create',
            f'{_GHN_BASE}/webhook',
        ],
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

    # ==================================================================
    # VNPay — create payment URL
    # ==================================================================

    @http.route(f'{_PAY_BASE}/create', type='http', auth='none', methods=['POST'], csrf=False)
    def vnpay_create(self, **_kw):
        """Create a VNPay payment URL for a confirmed order.

        Body: { "order_id": int }
        Returns: { "payment_url": str, "transaction_id": int, "txn_ref": str }
        """
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON', 400, 'MALFORMED_JSON')

        order_id = body.get('order_id')
        if not order_id:
            return error('order_id is required', 400, 'VALIDATION_ERROR')

        try:
            order_id = int(order_id)
        except (TypeError, ValueError):
            return error('order_id must be an integer', 400, 'VALIDATION_ERROR')

        su = request.env(user=1)
        order = su['sale.order'].browse(order_id)
        if not order.exists() or order.partner_id.id != partner.id:
            return error('Order not found', 404, 'NOT_FOUND')
        if order.x_is_cart:
            return error('Order is still a cart', 400, 'INVALID_ORDER_STATE')

        # Load VNPay config
        ICP = su['ir.config_parameter']
        tmn_code   = ICP.get_param('fashionos.vnpay.tmn_code', '')
        hash_secret = ICP.get_param('fashionos.vnpay.hash_secret', '')
        return_url = ICP.get_param('fashionos.vnpay.return_url', 'http://localhost:3000/payment/vnpay/result')
        sandbox    = ICP.get_param('fashionos.vnpay.sandbox', '1') == '1'

        if not tmn_code or tmn_code == 'SANDBOX_TMN_CODE':
            return error('VNPay not configured. Set fashionos.vnpay.tmn_code in system parameters.', 503, 'VNPAY_NOT_CONFIGURED')

        # Create transaction record
        txn = su['fashion.payment.transaction'].create_for_order(order, provider='vnpay')

        # Build signed payment URL
        from odoo.addons.payment_vnpay.utils.vnpay import build_payment_url
        ip_addr = request.httprequest.remote_addr or '127.0.0.1'
        payment_url = build_payment_url(
            tmn_code=tmn_code,
            hash_secret=hash_secret,
            amount_vnd=int(order.amount_total),
            order_info=f'Thanh toan don hang {order.name}',
            txn_ref=txn.txn_ref,
            return_url=return_url,
            ip_addr=ip_addr,
            sandbox=sandbox,
        )

        order.write({'x_payment_status': 'pending', 'x_payment_provider': 'vnpay'})

        return ok({
            'payment_url': payment_url,
            'transaction_id': txn.id,
            'txn_ref': txn.txn_ref,
            'order_id': order.id,
            'order_name': order.name,
            'amount': int(order.amount_total),
        })

    # ==================================================================
    # VNPay — IPN (server-to-server confirmation)
    # ==================================================================

    @http.route(f'{_PAY_BASE}/ipn', type='http', auth='none', methods=['POST'], csrf=False)
    def vnpay_ipn(self, **_kw):
        """VNPay IPN endpoint — called server-to-server by VNPay.

        VNPay sends form-encoded or query params. We verify signature and
        update the payment transaction.
        """
        params = dict(request.httprequest.args)
        params.update(request.httprequest.form)

        txn_ref  = params.get('vnp_TxnRef', '')
        response_code = params.get('vnp_ResponseCode', '')
        bank_txn_ref  = params.get('vnp_BankTranNo', '')
        amount_raw    = params.get('vnp_Amount', '0')

        su = request.env(user=1)
        ICP = su['ir.config_parameter']
        hash_secret = ICP.get_param('fashionos.vnpay.hash_secret', '')

        # Verify signature (modifies params in-place — pop secure hash keys)
        params_copy = dict(params)
        from odoo.addons.payment_vnpay.utils.vnpay import verify_return_params
        sig_valid = verify_return_params(params_copy, hash_secret)

        if not sig_valid:
            _logger.warning('VNPay IPN: invalid signature for txn_ref=%s', txn_ref)
            return request.make_response(
                json.dumps({'RspCode': '97', 'Message': 'Invalid signature'}),
                headers=[('Content-Type', 'application/json')],
            )

        txn = su['fashion.payment.transaction'].search(
            [('txn_ref', '=', txn_ref), ('provider', '=', 'vnpay')], limit=1,
        )
        if not txn:
            return request.make_response(
                json.dumps({'RspCode': '01', 'Message': 'Order not found'}),
                headers=[('Content-Type', 'application/json')],
            )

        if txn.state == 'done':
            return request.make_response(
                json.dumps({'RspCode': '02', 'Message': 'Order already confirmed'}),
                headers=[('Content-Type', 'application/json')],
            )

        # Verify amount matches (VNPay sends amount * 100)
        vnp_amount = int(amount_raw) // 100
        if abs(vnp_amount - int(txn.amount)) > 1:
            _logger.warning(
                'VNPay IPN amount mismatch: expected=%s got=%s txn_ref=%s',
                txn.amount, vnp_amount, txn_ref,
            )
            return request.make_response(
                json.dumps({'RspCode': '04', 'Message': 'Invalid amount'}),
                headers=[('Content-Type', 'application/json')],
            )

        if response_code == '00':
            txn.mark_done(provider_txn_ref=bank_txn_ref)
        else:
            txn.mark_failed(error_message=f'VNPay response code: {response_code}')

        return request.make_response(
            json.dumps({'RspCode': '00', 'Message': 'Confirm success'}),
            headers=[('Content-Type', 'application/json')],
        )

    # ==================================================================
    # VNPay — return redirect (called by frontend to verify result)
    # ==================================================================

    @http.route(f'{_PAY_BASE}/return', type='http', auth='none', methods=['GET'], csrf=False)
    def vnpay_return(self, **kw):
        """Verify VNPay return params and return payment result.

        The frontend page /payment/vnpay/result calls this to get the canonical
        payment result before showing success/failure to the user.

        Query params: all vnp_* params forwarded from the VNPay redirect URL.
        Returns: { success, txn_ref, order_id, amount, message }
        """
        params = dict(kw)
        txn_ref = params.get('vnp_TxnRef', '')
        response_code = params.get('vnp_ResponseCode', '')

        su = request.env(user=1)
        ICP = su['ir.config_parameter']
        hash_secret = ICP.get_param('fashionos.vnpay.hash_secret', '')

        from odoo.addons.payment_vnpay.utils.vnpay import verify_return_params
        params_copy = dict(params)
        sig_valid = verify_return_params(params_copy, hash_secret)

        txn = su['fashion.payment.transaction'].search(
            [('txn_ref', '=', txn_ref), ('provider', '=', 'vnpay')], limit=1,
        )

        if not sig_valid or not txn:
            return ok({'success': False, 'message': 'Xác thực thanh toán thất bại', 'txn_ref': txn_ref})

        if response_code == '00':
            return ok({
                'success': True,
                'txn_ref': txn_ref,
                'order_id': txn.order_id.id,
                'order_name': txn.order_id.name,
                'amount': int(txn.amount),
                'message': 'Thanh toán thành công',
            })
        return ok({
            'success': False,
            'txn_ref': txn_ref,
            'order_id': txn.order_id.id if txn else None,
            'message': f'Thanh toán thất bại (mã: {response_code})',
        })

    # ==================================================================
    # GHN — create shipment
    # ==================================================================

    @http.route(f'{_GHN_BASE}/create', type='http', auth='none', methods=['POST'], csrf=False)
    def ghn_create_shipment(self, **_kw):
        """Create a GHN shipment for a confirmed order.

        Body: {
            "order_id": int,
            "weight": int,        // grams
            "length": int,        // cm
            "width": int,         // cm
            "height": int,        // cm
            "service_type_id": int  // GHN service type (default: 2 = standard)
        }
        """
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON', 400, 'MALFORMED_JSON')

        order_id = body.get('order_id')
        if not order_id:
            return error('order_id is required', 400, 'VALIDATION_ERROR')

        su = request.env(user=1)
        order = su['sale.order'].browse(int(order_id))
        if not order.exists() or order.partner_id.id != partner.id:
            return error('Order not found', 404, 'NOT_FOUND')
        if order.state not in ('sale', 'done'):
            return error('Order is not confirmed', 400, 'INVALID_ORDER_STATE')

        ICP = su['ir.config_parameter']
        token   = ICP.get_param('fashionos.ghn.token', '')
        shop_id = ICP.get_param('fashionos.ghn.shop_id', '0')
        sandbox = ICP.get_param('fashionos.ghn.sandbox', '1') == '1'

        if not token or token == 'GHN_API_TOKEN_HERE':
            return error('GHN not configured. Set fashionos.ghn.token in system parameters.', 503, 'GHN_NOT_CONFIGURED')

        shipping_addr = order.partner_shipping_id
        payload = {
            'payment_type_id': 2,
            'note': order.note or '',
            'required_note': 'KHONGCHOXEMHANG',
            'to_name': shipping_addr.name or order.partner_id.name,
            'to_phone': shipping_addr.phone or order.partner_id.phone or '',
            'to_address': shipping_addr.street or '',
            'to_ward_name': shipping_addr.street2 or '',
            'to_district_name': shipping_addr.city or '',
            'to_province_name': 'Hồ Chí Minh',
            'weight': int(body.get('weight', 500)),
            'length': int(body.get('length', 20)),
            'width': int(body.get('width', 20)),
            'height': int(body.get('height', 10)),
            'service_type_id': int(body.get('service_type_id', 2)),
            'cod_amount': 0,
            'content': f'Đơn hàng {order.name}',
            'items': [
                {
                    'name': line.product_id.product_tmpl_id.name,
                    'code': line.product_id.default_code or '',
                    'quantity': int(line.product_uom_qty),
                    'price': int(line.price_unit),
                    'weight': 200,
                }
                for line in order.order_line
                if not line.display_type and line.product_uom_qty > 0
            ],
        }

        api_base = GHN_SANDBOX_API if sandbox else GHN_LIVE_API
        headers = {'Token': token, 'ShopId': shop_id, 'Content-Type': 'application/json'}

        try:
            resp = requests.post(
                f'{api_base}/v2/shipping-order/create',
                json=payload,
                headers=headers,
                timeout=15,
            )
            data = resp.json()
        except Exception:
            _logger.exception('GHN create shipment failed for order %s', order.name)
            return error('GHN API request failed', 502, 'GHN_API_ERROR')

        if data.get('code') != 200:
            return error(
                data.get('message', 'GHN error'),
                400,
                'GHN_ERROR',
            )

        ghn_data = data.get('data', {})
        ghn_code = ghn_data.get('order_code', '')
        total_fee = ghn_data.get('total_fee', 0)
        expected_delivery = ghn_data.get('expected_delivery_time')

        su['ghn.delivery.order'].create({
            'order_id': order.id,
            'ghn_order_code': ghn_code,
            'total_fee': total_fee,
            'status': 'ready_to_pick',
            'status_label': 'Chờ lấy hàng',
        })

        tracking_url = f'https://donhang.ghn.vn/?id={ghn_code}'
        order.write({
            'x_delivery_ref': ghn_code,
            'x_delivery_status': 'Chờ lấy hàng',
            'x_tracking_url': tracking_url,
        })

        return ok({
            'ghn_order_code': ghn_code,
            'total_fee': total_fee,
            'expected_delivery_time': expected_delivery,
            'tracking_url': tracking_url,
        })

    # ==================================================================
    # GHN — webhook (tracking updates)
    # ==================================================================

    @http.route(f'{_GHN_BASE}/webhook', type='http', auth='none', methods=['POST'], csrf=False)
    def ghn_webhook(self, **_kw):
        """Receive GHN tracking status updates.

        GHN sends POST with JSON body containing order status updates.
        No auth is required by GHN for webhooks (token verification is optional).
        """
        try:
            body = parse_body()
        except ValueError:
            _logger.warning('GHN webhook: malformed JSON body')
            return request.make_response(
                json.dumps({'status': 'error', 'message': 'Invalid JSON'}),
                headers=[('Content-Type', 'application/json')],
            )

        ghn_code = body.get('OrderCode', '')
        status   = body.get('Status', '')

        if not ghn_code or not status:
            return request.make_response(
                json.dumps({'status': 'error', 'message': 'Missing OrderCode or Status'}),
                headers=[('Content-Type', 'application/json')],
            )

        su = request.env(user=1)
        delivery = su['ghn.delivery.order'].search(
            [('ghn_order_code', '=', ghn_code)], limit=1,
        )
        if delivery:
            delivery.update_status(status)
            _logger.info('GHN webhook processed: code=%s status=%s', ghn_code, status)
        else:
            _logger.warning('GHN webhook: unknown order code %s', ghn_code)

        return request.make_response(
            json.dumps({'status': 'ok'}),
            headers=[('Content-Type', 'application/json')],
        )
