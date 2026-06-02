"""FashionOS payment transaction model."""
import logging
import uuid

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class FashionPaymentTransaction(models.Model):
    _name = 'fashion.payment.transaction'
    _description = 'FashionOS Payment Transaction'
    _order = 'id desc'

    order_id = fields.Many2one(
        'sale.order', required=True, ondelete='restrict', index=True,
        string='Order',
    )
    partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='restrict',
        string='Customer',
    )
    amount = fields.Float(required=True, digits=(16, 0), string='Amount (VND)')
    currency = fields.Char(default='VND', required=True)
    provider = fields.Selection(
        selection=[
            ('vnpay', 'VNPay'),
            ('momo', 'MoMo'),
            ('cod', 'COD'),
        ],
        required=True, default='vnpay',
        string='Provider',
    )
    state = fields.Selection(
        selection=[
            ('pending',   'Pending'),
            ('done',      'Done'),
            ('failed',    'Failed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending', required=True,
        string='State',
    )
    txn_ref = fields.Char(
        string='Internal Txn Ref', index=True, copy=False,
        help='Unique reference sent to the payment provider (vnp_TxnRef).',
    )
    provider_txn_ref = fields.Char(
        string='Provider Txn Ref',
        help='Transaction reference returned by the payment provider.',
    )
    error_message = fields.Char(string='Error Message')
    payment_date = fields.Datetime(string='Payment Date')
    create_date = fields.Datetime(readonly=True, string='Created At')

    @api.model
    def create_for_order(self, order, provider: str = 'vnpay') -> 'FashionPaymentTransaction':
        """Create a pending payment transaction for the given sale.order."""
        txn_ref = f'FS-{order.id}-{uuid.uuid4().hex[:8].upper()}'
        return self.create({
            'order_id': order.id,
            'partner_id': order.partner_id.id,
            'amount': order.amount_total,
            'currency': 'VND',
            'provider': provider,
            'state': 'pending',
            'txn_ref': txn_ref,
        })

    def mark_done(self, provider_txn_ref: str = '') -> None:
        """Mark transaction as done and update the linked sale order."""
        self.ensure_one()
        self.write({
            'state': 'done',
            'provider_txn_ref': provider_txn_ref,
            'payment_date': fields.Datetime.now(),
        })
        self.order_id.write({
            'x_payment_status': 'paid',
            'x_payment_provider': self.provider,
            'x_payment_ref': provider_txn_ref or self.txn_ref,
        })
        _logger.info(
            'Payment [%s] done — order=%s provider_ref=%s',
            self.provider, self.order_id.name, provider_txn_ref,
        )

    def mark_failed(self, error_message: str = '') -> None:
        """Mark transaction as failed."""
        self.ensure_one()
        self.write({
            'state': 'failed',
            'error_message': error_message,
        })
        _logger.warning(
            'Payment [%s] failed — order=%s error=%s',
            self.provider, self.order_id.name, error_message,
        )
