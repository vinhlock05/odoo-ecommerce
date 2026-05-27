from odoo import api, fields, models

# ---------------------------------------------------------------------------
# Tier thresholds (VND lifetime spend)
# ---------------------------------------------------------------------------
TIER_THRESHOLDS = [
    ('gold',   15_000_000),
    ('silver',  5_000_000),
    ('member',          0),
]

TIER_LABELS = [
    ('member', 'Member'),
    ('silver', 'Silver'),
    ('gold',   'Gold'),
]

# Earn rates per tier (fraction of net order value)
EARN_RATES = {
    'gold':   0.03,
    'silver': 0.02,
    'member': 0.01,
}


class ResPartnerLoyalty(models.Model):
    _inherit = 'res.partner'

    # ------------------------------------------------------------------
    # Loyalty fields
    # ------------------------------------------------------------------
    x_coolcash_balance = fields.Float(
        string='CoolCash Balance',
        digits=(16, 0),
        default=0.0,
        help='Current spendable CoolCash balance (1 unit = 1 VND).',
    )

    x_loyalty_tier = fields.Selection(
        selection=TIER_LABELS,
        string='Loyalty Tier',
        default='member',
        help='Tier is determined by lifetime confirmed-order spend.',
    )

    x_lifetime_spend = fields.Float(
        string='Lifetime Spend',
        digits=(16, 0),
        default=0.0,
        help='Cumulative total of confirmed sale-order amounts (VND).',
    )

    # ------------------------------------------------------------------
    # Tier helpers
    # ------------------------------------------------------------------
    @api.model
    def _tier_for_spend(self, lifetime_spend: float) -> str:
        """Return the correct tier label for a given lifetime spend."""
        for tier, threshold in TIER_THRESHOLDS:
            if lifetime_spend >= threshold:
                return tier
        return 'member'

    def action_recalculate_tier(self) -> None:
        """Recalculate x_loyalty_tier for each partner in self."""
        for partner in self:
            new_tier = self._tier_for_spend(partner.x_lifetime_spend)
            if partner.x_loyalty_tier != new_tier:
                partner.write({'x_loyalty_tier': new_tier})

    def recompute_lifetime_spend(self) -> None:
        """
        Recompute x_lifetime_spend by summing all confirmed sale orders.
        Also recalculates tier afterwards.

        Use for mass recalculation (cron / admin action) — not called on
        every checkout (checkout updates incrementally instead).
        """
        SaleOrder = self.env['sale.order']
        for partner in self:
            confirmed = SaleOrder.search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['sale', 'done']),
            ])
            total = sum(confirmed.mapped('amount_total'))
            partner.write({'x_lifetime_spend': total})
        self.action_recalculate_tier()

    # ------------------------------------------------------------------
    # Convenience: earn rate for current tier
    # ------------------------------------------------------------------
    def coolcash_earn_rate(self) -> float:
        """Return the CoolCash earn rate fraction for this partner's tier."""
        self.ensure_one()
        return EARN_RATES.get(self.x_loyalty_tier or 'member', 0.01)
