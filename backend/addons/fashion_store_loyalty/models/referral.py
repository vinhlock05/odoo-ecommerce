"""Referral code and reward log models."""
import hashlib
import logging
import time

from odoo import api, fields, models

_logger = logging.getLogger(__name__)

_REFEREE_DISCOUNT = 50_000.0   # VND off the referee's first order
_REFERRER_REWARD  = 100_000.0  # CoolCash awarded to the referrer


class ReferralCode(models.Model):
    _name = 'referral.code'
    _description = 'Customer Referral Code'

    partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='cascade', index=True,
        string='Customer',
    )
    code = fields.Char(required=True, index=True, copy=False, string='Code')
    is_active = fields.Boolean(default=True, string='Active')

    _sql_constraints = [
        ('code_uniq', 'unique(code)', 'Referral code must be unique'),
        ('partner_uniq', 'unique(partner_id)', 'Each customer may have only one referral code'),
    ]

    @api.model
    def _generate_code(self, partner_id: int) -> str:
        raw = f'{partner_id}-{time.time()}'
        suffix = hashlib.md5(raw.encode()).hexdigest()[:6].upper()
        return f'REF-{suffix}'

    @api.model
    def get_or_create(self, partner) -> 'ReferralCode':
        """Return the existing referral code for partner, creating one if absent."""
        rec = self.search([('partner_id', '=', partner.id)], limit=1)
        if not rec:
            rec = self.create({
                'partner_id': partner.id,
                'code': self._generate_code(partner.id),
            })
        return rec

    def get_stats(self) -> tuple[int, float]:
        """Return (total_referred, total_earned_coolcash) for this code."""
        self.ensure_one()
        logs = self.env['referral.reward.log'].search([
            ('referral_code_id', '=', self.id),
        ])
        return len(logs), sum(logs.mapped('referrer_reward'))


class ReferralRewardLog(models.Model):
    _name = 'referral.reward.log'
    _description = 'Referral Reward Log'
    _order = 'date desc'

    referral_code_id = fields.Many2one(
        'referral.code', required=True, ondelete='cascade', index=True,
        string='Referral Code',
    )
    referee_partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='cascade',
        string='Referee',
    )
    order_id = fields.Many2one(
        'sale.order', ondelete='set null', index=True,
        string='Order',
    )
    referee_discount = fields.Float(
        string='Referee Discount (VND)', digits=(16, 0),
        default=_REFEREE_DISCOUNT,
    )
    referrer_reward = fields.Float(
        string='Referrer CoolCash Earned', digits=(16, 0),
        default=_REFERRER_REWARD,
    )
    date = fields.Datetime(default=fields.Datetime.now, readonly=True)
