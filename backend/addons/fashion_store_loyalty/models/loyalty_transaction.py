import logging

from odoo import api, fields, models
from odoo.exceptions import UserError

from odoo.addons.fashion_store_config.utils.feature_flags import (
    FF_COOLCASH,
    is_enabled,
)

_logger = logging.getLogger(__name__)

TRANSACTION_TYPES = [
    ('earn',       'Earn'),
    ('redeem',     'Redeem'),
    ('expire',     'Expire'),
    ('adjustment', 'Adjustment'),
]


class LoyaltyTransaction(models.Model):
    _name = 'loyalty.transaction'
    _description = 'CoolCash Loyalty Transaction'
    _order = 'date desc, id desc'

    # ------------------------------------------------------------------
    # Fields
    # ------------------------------------------------------------------
    partner_id = fields.Many2one(
        'res.partner',
        string='Customer',
        required=True,
        ondelete='cascade',
        index=True,
    )
    transaction_type = fields.Selection(
        selection=TRANSACTION_TYPES,
        string='Type',
        required=True,
    )
    amount = fields.Float(
        string='Amount',
        digits=(16, 0),
        help='Positive = earn/adjust-up.  Negative = redeem/expire.',
    )
    balance_after = fields.Float(
        string='Balance After',
        digits=(16, 0),
        help='Partner CoolCash balance immediately after this transaction.',
    )
    order_id = fields.Many2one(
        'sale.order',
        string='Order',
        ondelete='set null',
        index=True,
    )
    description = fields.Char(string='Description', required=True)
    date = fields.Datetime(
        string='Date',
        default=fields.Datetime.now,
        readonly=True,
        index=True,
    )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @api.model
    def _create_txn(
        self,
        partner,
        txn_type: str,
        amount: float,
        description: str,
        order=None,
    ) -> 'LoyaltyTransaction':
        """
        Create a loyalty transaction and atomically update partner balance.

        Args:
            partner   : res.partner record (ensure_one enforced)
            txn_type  : one of 'earn', 'redeem', 'expire', 'adjustment'
            amount    : positive = add to balance, negative = subtract
            description: human-readable reason
            order     : optional sale.order record

        Returns:
            loyalty.transaction record
        """
        partner.ensure_one()

        new_balance = partner.x_coolcash_balance + amount
        if new_balance < 0:
            raise UserError(
                f'Insufficient CoolCash balance. '
                f'Available: {partner.x_coolcash_balance:.0f}, '
                f'requested: {abs(amount):.0f}'
            )

        # Write balance first so the row captures the correct balance_after
        partner.write({'x_coolcash_balance': new_balance})

        vals = {
            'partner_id': partner.id,
            'transaction_type': txn_type,
            'amount': amount,
            'balance_after': new_balance,
            'description': description,
        }
        if order:
            vals['order_id'] = order.id

        txn = self.create(vals)
        _logger.info(
            'CoolCash [%s] partner=%s amount=%+.0f balance_after=%.0f order=%s',
            txn_type, partner.id, amount, new_balance,
            order.name if order else '-',
        )
        return txn

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    @api.model
    def award_order_coolcash(self, partner, order) -> None:
        """
        Award CoolCash earned from a confirmed order.

        Earn amount = order.amount_untaxed * partner.coolcash_earn_rate()
        Rounded to integer (1 unit = 1 VND).

        No-op if FF_COOLCASH is disabled.
        """
        if not is_enabled(self.env, FF_COOLCASH):
            return

        rate = partner.coolcash_earn_rate()
        earn_amount = round(order.amount_untaxed * rate)
        if earn_amount <= 0:
            return

        self._create_txn(
            partner=partner,
            txn_type='earn',
            amount=earn_amount,
            description=f'Tích điểm từ đơn hàng {order.name}',
            order=order,
        )

    @api.model
    def redeem_for_order(self, partner, order) -> None:
        """
        Deduct CoolCash that the customer applied to this cart/order.

        The amount to redeem is stored on order.x_coolcash_amount_used.
        No-op if x_coolcash_amount_used == 0 or FF_COOLCASH is disabled.
        """
        if not is_enabled(self.env, FF_COOLCASH):
            return

        redeem_amount = order.x_coolcash_amount_used or 0.0
        if redeem_amount <= 0:
            return

        self._create_txn(
            partner=partner,
            txn_type='redeem',
            amount=-redeem_amount,
            description=f'Dùng CoolCash cho đơn hàng {order.name}',
            order=order,
        )
