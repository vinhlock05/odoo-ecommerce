"""Checkout controller — POST /fashionos/api/v1/cart/checkout.

Converts the authenticated customer's draft cart (sale.order with
x_is_cart=True) into a confirmed sale order.
"""

import logging

from odoo import http
from odoo.exceptions import AccessError, UserError, ValidationError

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_CHECKOUT_ROUTE = '/fashionos/api/v1/cart/checkout'


class CheckoutController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS — CORS pre-flight
    # ------------------------------------------------------------------

    @http.route(
        _CHECKOUT_ROUTE,
        type='http',
        auth='none',
        methods=['OPTIONS'],
        csrf=False,
        cors='*',
    )
    def checkout_preflight(self, **_kwargs):
        return http.Response(status=204)

    # ------------------------------------------------------------------
    # POST /fashionos/api/v1/cart/checkout
    # ------------------------------------------------------------------

    @http.route(
        _CHECKOUT_ROUTE,
        type='http',
        auth='none',
        methods=['POST'],
        csrf=False,
    )
    def checkout(self, **_kwargs):
        """Convert draft cart to confirmed sale order.

        Required body fields:
            delivery_address_id (int): ID of a res.partner shipping address
                                       that belongs to the authenticated customer.

        Optional body fields:
            note            (str):   Customer note on the order.
            gender_title    (str):   'anh' or 'chi' — salutation.
            alt_receiver_name  (str): Name of alternative recipient.
            alt_receiver_phone (str): Phone of alternative recipient.
            referral_code   (str):   Referral code to apply.

        Returns:
            200 — { order_id, order_name, amount_total, state }
            400 — validation errors (empty cart, bad address, etc.)
            401 — missing / invalid JWT
            404 — no active cart found
        """
        env = http.request.env

        # ── 1. Auth ────────────────────────────────────────────────────
        partner = get_partner_from_request()
        if not partner:
            return error('Authentication required', 401, 'UNAUTHORIZED')

        # ── 2. Parse body ──────────────────────────────────────────────
        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')

        delivery_address_id = body.get('delivery_address_id')
        if not delivery_address_id:
            return error(
                'delivery_address_id is required',
                400,
                'MISSING_DELIVERY_ADDRESS',
            )

        try:
            delivery_address_id = int(delivery_address_id)
        except (TypeError, ValueError):
            return error(
                'delivery_address_id must be an integer',
                400,
                'INVALID_DELIVERY_ADDRESS',
            )

        # ── 3. Load cart ───────────────────────────────────────────────
        # Use with_user(1) (SUPERUSER_ID) — auth='none' routes leave env.uid
        # as anonymous in Odoo 19, causing sale.order._compute_user_id to call
        # ensure_one() on an empty res.users recordset → ValueError.
        su = env(user=1)
        cart = su['sale.order'].search(
            [
                ('partner_id', '=', partner.id),
                ('x_is_cart', '=', True),
                ('state', '=', 'draft'),
            ],
            limit=1,
        )
        if not cart:
            return error('No active cart found', 404, 'CART_NOT_FOUND')

        # ── 4. Validate cart is not empty ──────────────────────────────
        order_lines = cart.order_line.filtered(
            lambda l: not l.display_type  # exclude section / note lines
        )
        if not order_lines:
            return error('Cart is empty', 400, 'CART_EMPTY')

        # ── 5. Validate delivery address belongs to this partner ───────
        delivery_address = su['res.partner'].browse(delivery_address_id)
        if not delivery_address.exists():
            return error(
                'Delivery address not found',
                400,
                'DELIVERY_ADDRESS_NOT_FOUND',
            )

        # The address must be the partner itself OR one of their children
        allowed_partner_ids = (
            su['res.partner']
            .search([('id', 'child_of', partner.id)])
            .ids
        )
        if delivery_address_id not in allowed_partner_ids:
            return error(
                'Delivery address does not belong to this account',
                403,
                'FORBIDDEN',
            )

        # ── 6. Build write values ──────────────────────────────────────
        write_vals = {
            'x_is_cart': False,
            'partner_shipping_id': delivery_address_id,
        }

        note = body.get('note')
        if note:
            write_vals['note'] = str(note).strip()

        gender_title = body.get('gender_title')
        if gender_title in ('anh', 'chi'):
            write_vals['x_gender_title'] = gender_title

        # alt_receiver fields must be provided together — partial data is useless
        alt_receiver_name = str(body['alt_receiver_name']).strip() if body.get('alt_receiver_name') else ''
        alt_receiver_phone = str(body['alt_receiver_phone']).strip() if body.get('alt_receiver_phone') else ''
        if bool(alt_receiver_name) != bool(alt_receiver_phone):
            return error(
                'alt_receiver_name and alt_receiver_phone must both be provided together',
                400,
                'INCOMPLETE_RECEIVER_INFO',
            )
        if alt_receiver_name:
            write_vals['x_alt_receiver_name'] = alt_receiver_name
            write_vals['x_alt_receiver_phone'] = alt_receiver_phone

        referral_code = body.get('referral_code')
        if referral_code:
            write_vals['x_referral_code'] = str(referral_code).strip()

        # ── 7. Write fields & confirm ──────────────────────────────────
        try:
            cart.write(write_vals)
            cart.action_confirm()
        except (ValidationError, UserError, AccessError) as exc:
            _logger.warning(
                'Checkout rejected for partner %s cart %s: %s',
                partner.id, cart.id, exc,
            )
            return error(str(exc), 400, 'CHECKOUT_REJECTED')
        except Exception:  # noqa: BLE001  — unexpected ORM / DB error
            _logger.exception(
                'Unexpected checkout error for partner %s cart %s',
                partner.id, cart.id,
            )
            return error(
                'Order confirmation failed. Please try again.',
                500,
                'CHECKOUT_ERROR',
            )

        # ── 7b. Loyalty post-processing ────────────────────────────────
        # Run loyalty operations inside a separate try-block so that a loyalty
        # error doesn't roll back the already-confirmed order.
        try:
            LoyaltyTxn = su['loyalty.transaction']
            su_partner = su['res.partner'].browse(partner.id)

            # 1. Deduct any applied CoolCash
            LoyaltyTxn.redeem_for_order(su_partner, cart)

            # 2. Increment lifetime spend and recalculate tier
            su_partner.write({
                'x_lifetime_spend': su_partner.x_lifetime_spend + cart.amount_total
            })
            su_partner.action_recalculate_tier()

            # 3. Award CoolCash earned on this order (tier-based rate)
            LoyaltyTxn.award_order_coolcash(su_partner, cart)
        except Exception:  # noqa: BLE001
            _logger.exception(
                'Loyalty post-processing failed for partner %s order %s '
                '(order is confirmed, loyalty update skipped)',
                partner.id, cart.name,
            )

        # ── 8. Return order summary ────────────────────────────────────
        su_partner = su['res.partner'].browse(partner.id)
        return ok({
            'order_id': cart.id,
            'order_name': cart.name,
            'amount_total': cart.amount_total,
            'amount_untaxed': cart.amount_untaxed,
            'amount_tax': cart.amount_tax,
            'state': cart.state,
            'partner_shipping_id': cart.partner_shipping_id.id,
            'coolcash_earned': int(cart.x_coolcash_earned or 0),
            'coolcash_redeemed': int(cart.x_coolcash_amount_used or 0),
            'new_coolcash_balance': int(su_partner.x_coolcash_balance),
            'loyalty_tier': su_partner.x_loyalty_tier or 'member',
        })
