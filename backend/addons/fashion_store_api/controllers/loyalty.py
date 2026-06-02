"""Loyalty / CoolCash endpoints.

GET  /fashionos/api/v1/account/loyalty         — current balance, tier, stats
GET  /fashionos/api/v1/account/loyalty/history — transaction ledger (paginated)
"""
import logging

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, paginated

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/account/loyalty'
_REFERRAL_BASE = '/fashionos/api/v1/account/referral'

# Tier thresholds for FE display (must match res_partner.py values)
_TIER_THRESHOLDS = {
    'member': 0,
    'silver': 5_000_000,
    'gold':   15_000_000,
}
_TIER_NEXT = {
    'member': ('silver', 5_000_000),
    'silver': ('gold',  15_000_000),
    'gold':   None,
}


class LoyaltyController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS
    # ------------------------------------------------------------------

    @http.route(
        [_BASE, f'{_BASE}/history', _REFERRAL_BASE],
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
    # GET /account/loyalty
    # ------------------------------------------------------------------

    @http.route(_BASE, type='http', auth='none', methods=['GET'], csrf=False)
    def get_loyalty(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        su_partner = request.env(user=1)['res.partner'].browse(partner.id)
        return ok(_loyalty_status_dict(su_partner))

    # ------------------------------------------------------------------
    # GET /account/loyalty/history?page=1&limit=20
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # GET /account/referral
    # ------------------------------------------------------------------

    @http.route(_REFERRAL_BASE, type='http', auth='none', methods=['GET'], csrf=False)
    def get_referral(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        su = request.env(user=1)
        rc = su['referral.code'].get_or_create(su['res.partner'].browse(partner.id))
        total_referred, total_earned = rc.get_stats()

        return ok({
            'code': rc.code,
            'is_active': rc.is_active,
            'total_referred': total_referred,
            'total_earned_coolcash': int(total_earned),
        })

    # ------------------------------------------------------------------
    # GET /account/loyalty/history?page=1&limit=20
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/history', type='http', auth='none', methods=['GET'], csrf=False)
    def get_loyalty_history(self, page='1', limit='20', **_kw):
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

        domain = [('partner_id', '=', partner.id)]
        total = env['loyalty.transaction'].search_count(domain)
        txns = env['loyalty.transaction'].search(domain, limit=limit_n, offset=offset)

        total_pages = (total + limit_n - 1) // limit_n if total else 1

        return paginated(
            items=[_txn_dict(t) for t in txns],
            total=total,
            page=page_n,
            limit=limit_n,
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _loyalty_status_dict(partner) -> dict:
    tier = partner.x_loyalty_tier or 'member'
    lifetime = partner.x_lifetime_spend or 0.0
    balance = partner.x_coolcash_balance or 0.0

    # Next tier progress
    next_info = _TIER_NEXT.get(tier)
    if next_info:
        next_tier, next_threshold = next_info
        progress_pct = min(100, int(lifetime / next_threshold * 100))
        spend_remaining = max(0.0, next_threshold - lifetime)
        next_tier_data = {
            'tier': next_tier,
            'threshold': next_threshold,
            'progress_pct': progress_pct,
            'spend_remaining': spend_remaining,
        }
    else:
        next_tier_data = None  # already at Gold

    return {
        'coolcash_balance': int(balance),
        'tier': tier,
        'tier_label': dict(partner._fields['x_loyalty_tier'].selection).get(tier, tier),
        'lifetime_spend': lifetime,
        'next_tier': next_tier_data,
    }


def _txn_dict(txn) -> dict:
    return {
        'id': txn.id,
        'type': txn.transaction_type,
        'amount': int(txn.amount),
        'balance_after': int(txn.balance_after),
        'description': txn.description,
        'date': txn.date.isoformat() if txn.date else None,
        'order_id': txn.order_id.id if txn.order_id else None,
        'order_name': txn.order_id.name if txn.order_id else None,
    }
