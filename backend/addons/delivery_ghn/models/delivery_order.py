"""GHN delivery order model."""
import logging

from odoo import fields, models

_logger = logging.getLogger(__name__)

# GHN status code → human-readable label
GHN_STATUS_LABELS = {
    'ready_to_pick':    'Chờ lấy hàng',
    'picking':          'Đang lấy hàng',
    'cancel':           'Đã huỷ',
    'money_collect_picking': 'Đang thu tiền khi lấy',
    'picked':           'Đã lấy hàng',
    'storing':          'Đang lưu kho',
    'transporting':     'Đang vận chuyển',
    'sorting':          'Đang phân loại',
    'delivering':       'Đang giao hàng',
    'money_collect_delivering': 'Đang thu tiền khi giao',
    'delivered':        'Đã giao hàng',
    'delivery_fail':    'Giao hàng thất bại',
    'waiting_to_return': 'Chờ hoàn hàng',
    'return':           'Đang hoàn hàng',
    'returned':         'Đã hoàn hàng',
    'exception':        'Ngoại lệ',
    'damage':           'Hàng hỏng',
    'lost':             'Hàng thất lạc',
}


class GhnDeliveryOrder(models.Model):
    _name = 'ghn.delivery.order'
    _description = 'GHN Delivery Order'
    _order = 'id desc'

    order_id = fields.Many2one(
        'sale.order', required=True, ondelete='restrict', index=True,
        string='Sale Order',
    )
    ghn_order_code = fields.Char(string='GHN Order Code', index=True, copy=False)
    expected_delivery_time = fields.Datetime(string='Expected Delivery')
    total_fee = fields.Float(string='Shipping Fee (VND)', digits=(16, 0))
    cod_amount = fields.Float(string='COD Amount (VND)', digits=(16, 0))
    status = fields.Char(string='GHN Status')
    status_label = fields.Char(string='Status Label')
    create_date = fields.Datetime(readonly=True)

    def update_status(self, ghn_status: str) -> None:
        """Update delivery status from a GHN webhook payload."""
        self.ensure_one()
        label = GHN_STATUS_LABELS.get(ghn_status, ghn_status)
        self.write({'status': ghn_status, 'status_label': label})
        self.order_id.write({
            'x_delivery_status': label,
        })
        if ghn_status == 'delivered':
            self.order_id.write({'x_delivery_status': 'Đã giao hàng'})
        _logger.info(
            'GHN tracking update — order=%s code=%s status=%s',
            self.order_id.name, self.ghn_order_code, ghn_status,
        )
