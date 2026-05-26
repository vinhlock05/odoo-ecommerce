"""FashionOS Settings — feature flags FF-01..FF-20 + business config params."""

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class FashionOSConfigSettings(models.TransientModel):
    """Extends res.config.settings with FashionOS feature flags and business params.

    All values are persisted in ir.config_parameter via the
    config_parameter= attribute, so they survive module upgrades and can be
    read anywhere in the codebase with env['ir.config_parameter'].get_param().
    """

    _inherit = 'res.config.settings'

    # -------------------------------------------------------------------------
    # Feature Flags FF-01..FF-20
    # -------------------------------------------------------------------------

    # FF-01 — CoolCash (loyalty points)
    ff_coolcash = fields.Boolean(
        string='FF-01 Enable CoolCash (Điểm tích luỹ)',
        config_parameter='fashionos.ff.coolcash',
        default=False,
    )

    # FF-02 — CoolClub (membership tiers)
    ff_coolclub = fields.Boolean(
        string='FF-02 Enable CoolClub (Hạng thành viên)',
        config_parameter='fashionos.ff.coolclub',
        default=False,
    )

    # FF-03 — Referral system
    ff_referral = fields.Boolean(
        string='FF-03 Enable Referral (Giới thiệu bạn bè)',
        config_parameter='fashionos.ff.referral',
        default=False,
    )

    # FF-04 — Combo / bundle products
    ff_combo = fields.Boolean(
        string='FF-04 Enable Combo Products (Sản phẩm combo)',
        config_parameter='fashionos.ff.combo',
        default=False,
    )

    # FF-05 — Smart order routing (multi-warehouse)
    ff_smart_routing = fields.Boolean(
        string='FF-05 Enable Smart Order Routing (Phân phối kho thông minh)',
        config_parameter='fashionos.ff.smart_routing',
        default=False,
    )

    # FF-06 — Alternate receiver on order
    ff_alternate_receiver = fields.Boolean(
        string='FF-06 Enable Alternate Receiver (Người nhận khác)',
        config_parameter='fashionos.ff.alternate_receiver',
        default=True,
    )

    # FF-07 — Return / exchange requests
    ff_return_request = fields.Boolean(
        string='FF-07 Enable Return Request (Yêu cầu đổi trả)',
        config_parameter='fashionos.ff.return_request',
        default=False,
    )

    # FF-08 — Zalo OA push notifications
    ff_zalo_notification = fields.Boolean(
        string='FF-08 Enable Zalo OA Notification',
        config_parameter='fashionos.ff.zalo_notification',
        default=False,
    )

    # FF-09 — JWT-based API authentication
    ff_jwt_auth = fields.Boolean(
        string='FF-09 Enable JWT Authentication',
        config_parameter='fashionos.ff.jwt_auth',
        default=False,
    )

    # FF-10 — Free-shipping threshold calculation
    ff_free_shipping = fields.Boolean(
        string='FF-10 Enable Free Shipping Threshold (Miễn phí vận chuyển)',
        config_parameter='fashionos.ff.free_shipping',
        default=True,
    )

    # FF-11 — Product reviews / ratings
    ff_product_reviews = fields.Boolean(
        string='FF-11 Enable Product Reviews (Đánh giá sản phẩm)',
        config_parameter='fashionos.ff.product_reviews',
        default=False,
    )

    # FF-12 — Wishlist / saved items
    ff_wishlist = fields.Boolean(
        string='FF-12 Enable Wishlist (Sản phẩm yêu thích)',
        config_parameter='fashionos.ff.wishlist',
        default=False,
    )

    # FF-13 — Flash sale / limited-time discounts
    ff_flash_sale = fields.Boolean(
        string='FF-13 Enable Flash Sale (Khuyến mãi giờ chót)',
        config_parameter='fashionos.ff.flash_sale',
        default=False,
    )

    # FF-14 — Bundle pricing (buy-X-get-Y)
    ff_bundle_price = fields.Boolean(
        string='FF-14 Enable Bundle Price (Giá combo)',
        config_parameter='fashionos.ff.bundle_price',
        default=False,
    )

    # FF-15 — Auto order split (oversized / mixed warehouse)
    ff_order_split = fields.Boolean(
        string='FF-15 Enable Order Split (Tách đơn hàng)',
        config_parameter='fashionos.ff.order_split',
        default=False,
    )

    # FF-16 — Multi-warehouse fulfilment
    ff_multi_warehouse = fields.Boolean(
        string='FF-16 Enable Multi-Warehouse (Đa kho)',
        config_parameter='fashionos.ff.multi_warehouse',
        default=False,
    )

    # FF-17 — Email / SMS newsletter subscription
    ff_newsletter = fields.Boolean(
        string='FF-17 Enable Newsletter Subscription (Đăng ký bản tin)',
        config_parameter='fashionos.ff.newsletter',
        default=False,
    )

    # FF-18 — Live chat / support widget
    ff_live_chat = fields.Boolean(
        string='FF-18 Enable Live Chat Support',
        config_parameter='fashionos.ff.live_chat',
        default=False,
    )

    # FF-19 — Analytics / event tracking
    ff_analytics = fields.Boolean(
        string='FF-19 Enable Analytics Tracking',
        config_parameter='fashionos.ff.analytics',
        default=False,
    )

    # FF-20 — Headless / API-only mode (disables Odoo website frontend)
    ff_headless_mode = fields.Boolean(
        string='FF-20 Enable Headless Mode (API-only)',
        config_parameter='fashionos.ff.headless_mode',
        default=True,
    )

    # -------------------------------------------------------------------------
    # Business Config Params
    # -------------------------------------------------------------------------

    coolcash_earn_rate = fields.Float(
        string='CoolCash Earn Rate (%)',
        config_parameter='fashionos.coolcash.earn_rate',
        default=7.0,
        help='Percentage of order value awarded as CoolCash points (default 7%)',
    )

    free_shipping_threshold = fields.Float(
        string='Free Shipping Threshold (VND)',
        config_parameter='fashionos.shipping.free_threshold',
        default=350000.0,
        help='Order subtotal above which shipping is free (default 350,000 VND)',
    )

    coolclub_silver_threshold = fields.Float(
        string='CoolClub Silver Threshold (VND)',
        config_parameter='fashionos.coolclub.silver_threshold',
        default=1000000.0,
        help='Cumulative spend to reach Silver tier (default 1,000,000 VND)',
    )

    coolclub_gold_threshold = fields.Float(
        string='CoolClub Gold Threshold (VND)',
        config_parameter='fashionos.coolclub.gold_threshold',
        default=3000000.0,
        help='Cumulative spend to reach Gold tier (default 3,000,000 VND)',
    )

    coolclub_diamond_threshold = fields.Float(
        string='CoolClub Diamond Threshold (VND)',
        config_parameter='fashionos.coolclub.diamond_threshold',
        default=10000000.0,
        help='Cumulative spend to reach Diamond tier (default 10,000,000 VND)',
    )

    jwt_secret_key = fields.Char(
        string='JWT Secret Key',
        config_parameter='fashionos.jwt.secret_key',
        help='Secret key used to sign JWT tokens. Rotate this key to invalidate all sessions.',
    )

    jwt_expiry_hours = fields.Integer(
        string='JWT Token Expiry (hours)',
        config_parameter='fashionos.jwt.expiry_hours',
        default=24,
    )

    zalo_oa_token = fields.Char(
        string='Zalo OA Access Token',
        config_parameter='fashionos.zalo.oa_token',
        help='Official Account access token from Zalo Developer Portal',
    )

    zalo_oa_secret = fields.Char(
        string='Zalo OA App Secret',
        config_parameter='fashionos.zalo.oa_secret',
    )

    # -------------------------------------------------------------------------
    # Validation
    # -------------------------------------------------------------------------

    @api.constrains('ff_jwt_auth', 'jwt_secret_key')
    def _check_jwt_secret_key(self):
        """Require a minimum-entropy JWT secret when FF-09 is enabled.

        A short or empty secret makes token forgery trivial.
        Minimum: 32 characters (256-bit key space for alphanumeric secrets).
        """
        for rec in self:
            if rec.ff_jwt_auth and (not rec.jwt_secret_key or len(rec.jwt_secret_key) < 32):
                raise ValidationError(_(
                    "JWT Authentication (FF-09) is enabled but the JWT Secret Key "
                    "is too short or empty. Please set a key of at least 32 characters "
                    "to ensure token security."
                ))
