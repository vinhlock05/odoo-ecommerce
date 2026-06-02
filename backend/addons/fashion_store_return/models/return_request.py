"""KF-1: Customer return request model."""
import logging

from odoo import api, fields, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

_RETURN_WINDOW_DAYS = 30  # customer can request return within 30 days of delivery

RETURN_REASONS = [
    ('wrong_size',   'Sai size'),
    ('defective',    'Hàng lỗi/hỏng'),
    ('wrong_item',   'Sai sản phẩm'),
    ('not_as_desc',  'Không đúng mô tả'),
    ('changed_mind', 'Đổi ý'),
    ('other',        'Lý do khác'),
]


class FashionReturnRequest(models.Model):
    _name = 'fashion.return.request'
    _description = 'Customer Return Request'
    _order = 'id desc'

    # ------------------------------------------------------------------
    # Fields
    # ------------------------------------------------------------------
    name = fields.Char(string='Reference', readonly=True, default='New')
    order_id = fields.Many2one(
        'sale.order', required=True, ondelete='restrict', index=True,
        string='Original Order',
    )
    partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='restrict',
        string='Customer',
    )
    state = fields.Selection(
        selection=[
            ('draft',    'Chờ duyệt'),
            ('approved', 'Đã duyệt'),
            ('shipped',  'Đang hoàn hàng'),
            ('done',     'Hoàn tất'),
            ('rejected', 'Từ chối'),
        ],
        default='draft', string='Trạng thái', tracking=True,
    )
    reason = fields.Selection(
        selection=RETURN_REASONS,
        required=True, string='Lý do đổi trả',
    )
    note = fields.Text(string='Ghi chú thêm')
    return_lines = fields.One2many(
        'fashion.return.line', 'request_id',
        string='Sản phẩm đổi trả',
    )
    refund_amount = fields.Float(
        string='Số tiền hoàn (VND)', digits=(16, 0),
        compute='_compute_refund_amount', store=True,
    )
    refund_method = fields.Selection(
        selection=[
            ('coolcash', 'CoolCash'),
            ('bank',     'Chuyển khoản'),
        ],
        default='coolcash', string='Hình thức hoàn tiền',
    )
    create_date = fields.Datetime(readonly=True)
    approved_date = fields.Datetime(string='Ngày duyệt', readonly=True)
    done_date = fields.Datetime(string='Ngày hoàn tất', readonly=True)

    @api.depends('return_lines.subtotal')
    def _compute_refund_amount(self):
        for rec in self:
            rec.refund_amount = sum(rec.return_lines.mapped('subtotal'))

    # ------------------------------------------------------------------
    # Sequence
    # ------------------------------------------------------------------

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'fashion.return.request'
                ) or 'RET-NEW'
        return super().create(vals_list)

    # ------------------------------------------------------------------
    # State transitions
    # ------------------------------------------------------------------

    def action_approve(self) -> None:
        """Approve the return request."""
        for rec in self:
            if rec.state != 'draft':
                raise UserError('Chỉ có thể duyệt yêu cầu ở trạng thái Chờ duyệt.')
            rec.write({'state': 'approved', 'approved_date': fields.Datetime.now()})
            _logger.info('Return %s approved', rec.name)

    def action_mark_shipped(self) -> None:
        """Customer shipped the items back."""
        for rec in self:
            if rec.state != 'approved':
                raise UserError('Yêu cầu phải ở trạng thái Đã duyệt.')
            rec.write({'state': 'shipped'})

    def action_done(self) -> None:
        """Finalize return: issue CoolCash refund if method=coolcash."""
        for rec in self:
            if rec.state != 'shipped':
                raise UserError('Yêu cầu phải ở trạng thái Đang hoàn hàng.')

            if rec.refund_method == 'coolcash' and rec.refund_amount > 0:
                try:
                    LoyaltyTxn = rec.env['loyalty.transaction']
                    LoyaltyTxn._create_txn(
                        partner=rec.partner_id,
                        txn_type='adjustment',
                        amount=rec.refund_amount,
                        description=f'Hoàn tiền đổi trả đơn {rec.order_id.name} — {rec.name}',
                        order=rec.order_id,
                    )
                except Exception:
                    _logger.exception('CoolCash refund failed for return %s', rec.name)

            rec.write({'state': 'done', 'done_date': fields.Datetime.now()})
            _logger.info('Return %s done, refund %.0f VND via %s', rec.name, rec.refund_amount, rec.refund_method)

    def action_reject(self) -> None:
        """Reject the return request."""
        for rec in self:
            rec.write({'state': 'rejected'})


class FashionReturnLine(models.Model):
    _name = 'fashion.return.line'
    _description = 'Return Request Line'

    request_id = fields.Many2one(
        'fashion.return.request', required=True, ondelete='cascade', index=True,
    )
    order_line_id = fields.Many2one(
        'sale.order.line', required=True, ondelete='restrict',
        string='Order Line',
    )
    product_id = fields.Many2one(
        'product.product', related='order_line_id.product_id', readonly=True,
        string='Product',
    )
    return_qty = fields.Float(string='Return Qty', default=1.0)
    price_unit = fields.Float(
        related='order_line_id.price_unit', readonly=True,
        string='Unit Price',
    )
    subtotal = fields.Float(
        string='Subtotal', compute='_compute_subtotal', store=True,
        digits=(16, 0),
    )

    @api.depends('return_qty', 'price_unit')
    def _compute_subtotal(self):
        for line in self:
            line.subtotal = line.return_qty * line.price_unit
