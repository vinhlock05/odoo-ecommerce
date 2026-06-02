"""Add payment + delivery tracking fields to sale.order."""
from odoo import fields, models


class SaleOrderPayment(models.Model):
    _inherit = 'sale.order'

    # ------------------------------------------------------------------
    # Payment status
    # ------------------------------------------------------------------
    x_payment_status = fields.Selection(
        selection=[
            ('unpaid',   'Chưa thanh toán'),
            ('pending',  'Đang xử lý'),
            ('paid',     'Đã thanh toán'),
            ('refunded', 'Đã hoàn tiền'),
        ],
        default='unpaid',
        string='Trạng thái thanh toán',
        index=True,
    )
    x_payment_provider = fields.Char(
        string='Phương thức thanh toán',
        help='e.g. vnpay, momo, cod',
    )
    x_payment_ref = fields.Char(
        string='Mã giao dịch thanh toán',
    )

    # ------------------------------------------------------------------
    # Delivery tracking
    # ------------------------------------------------------------------
    x_delivery_ref = fields.Char(
        string='Mã vận đơn',
        help='GHN / GHTK shipment code',
    )
    x_delivery_status = fields.Char(
        string='Trạng thái giao hàng',
        help='Latest status string from GHN/GHTK webhook',
    )
    x_tracking_url = fields.Char(
        string='URL theo dõi đơn hàng',
    )
