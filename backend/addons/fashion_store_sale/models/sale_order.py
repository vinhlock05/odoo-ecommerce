"""Fashion-specific extensions to sale.order."""

import logging

from odoo import api, fields, models

_logger = logging.getLogger(__name__)
from odoo.addons.fashion_store_config.utils.feature_flags import (
    FF_COOLCASH,
    get_float_param,
    is_enabled,
)


class SaleOrder(models.Model):
    """Extends sale.order with fashion eCommerce fields."""

    _inherit = 'sale.order'

    # -------------------------------------------------------------------------
    # Customer / Recipient
    # -------------------------------------------------------------------------

    x_gender_title = fields.Selection(
        selection=[
            ('anh', 'Anh'),
            ('chi', 'Chị'),
        ],
        string='Xưng hô',
        help='Gender title used in order confirmation messages',
    )

    # Alternate receiver — enabled by FF-06
    x_alt_receiver_name = fields.Char(
        string='Tên người nhận khác',
        help='If the recipient differs from the customer, enter their name here.',
    )

    x_alt_receiver_phone = fields.Char(
        string='Số điện thoại người nhận',
    )

    x_alt_receiver_address = fields.Text(
        string='Địa chỉ người nhận',
    )

    # -------------------------------------------------------------------------
    # CoolCash (Loyalty Points) — FF-01
    # -------------------------------------------------------------------------

    x_coolcash_amount_used = fields.Float(
        string='CoolCash sử dụng (VND)',
        default=0.0,
        help='Amount of CoolCash points the customer chose to redeem on this order.',
    )

    x_coolcash_earned = fields.Float(
        string='CoolCash tích luỹ (VND)',
        compute='_compute_coolcash_earned',
        store=True,
        help='CoolCash points earned from this order (applied after delivery).',
    )

    @api.depends('order_line.price_subtotal', 'x_coolcash_amount_used')
    def _compute_coolcash_earned(self):
        for order in self:
            if not is_enabled(order.env, FF_COOLCASH):
                order.x_coolcash_earned = 0.0
                continue

            rate = get_float_param(
                order.env,
                'fashionos.coolcash.earn_rate',
                default=7.0,
            )
            # Earn on net subtotal (after redeeming existing CoolCash)
            net = max(order.amount_untaxed - order.x_coolcash_amount_used, 0.0)
            order.x_coolcash_earned = round(net * rate / 100.0, 0)

    # -------------------------------------------------------------------------
    # Referral
    # -------------------------------------------------------------------------

    x_referral_code = fields.Char(
        string='Mã giới thiệu',
        help='Referral code entered by the customer at checkout (FF-03)',
    )

    # -------------------------------------------------------------------------
    # Smart Order Routing — FF-05 / FF-15 / FF-16
    # -------------------------------------------------------------------------

    x_is_split_order = fields.Boolean(
        string='Đơn hàng tách (Split)',
        default=False,
        help='True when this order was auto-split from a parent order.',
    )

    x_routed_warehouse_id = fields.Many2one(
        comodel_name='stock.warehouse',
        string='Kho phân phối',
        ondelete='set null',
        help='Warehouse assigned by smart routing logic.',
    )

    # -------------------------------------------------------------------------
    # Return / Exchange — FF-07
    # -------------------------------------------------------------------------

    x_return_request_ids = fields.One2many(
        comodel_name='sale.order',
        inverse_name='x_origin_order_id',
        string='Yêu cầu đổi trả',
        help='Return/exchange orders linked to this original order.',
    )

    x_origin_order_id = fields.Many2one(
        comodel_name='sale.order',
        string='Đơn gốc',
        ondelete='set null',
        help='Original order this return request is based on.',
    )
