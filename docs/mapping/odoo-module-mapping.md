# Phase 5 — Odoo Module Mapping
**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Draft  
**Platform:** Odoo v19 Enterprise + OCA FastAPI + ShopInvader  
**Nguồn tham chiếu:** BRD v2.0, API Mapping v1.0, UC01–UC20, US-001–US-028

---

## Tổng quan kiến trúc module

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — KILLER FEATURES (5 modules)                              │
│  fashion_store_return  │  fashion_store_routing  │  fashion_store_combo│
│  fashion_store_dashboard  │  fashion_store_ai_catalog               │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — BUSINESS LOGIC CUSTOM (10 modules)                       │
│  coolcash  │  coolclub  │  referral  │  fastapi_auth_zalo           │
│  payment_vnpay  │  payment_momo  │  payment_zalopay                 │
│  delivery_ghn  │  delivery_ghtk  │  sale_return_api                │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — FOUNDATION CUSTOM (3 modules)                            │
│  fashion_store_config  │  fashion_store_product  │  fashion_store_sale│
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — SHOPINVADER SUITE (8 modules, OCA)                       │
│  shopinvader  │  shopinvader_product  │  shopinvader_category       │
│  shopinvader_cart  │  shopinvader_sale  │  shopinvader_partner      │
│  shopinvader_wishlist  │  shopinvader_delivery                      │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — OCA REST FRAMEWORK (4 modules)                           │
│  fastapi  │  fastapi_auth_jwt  │  fastapi_auth_partner_jwt  │  auth_oauth│
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 0 — ODOO v19 ENTERPRISE CORE (pre-installed)                 │
│  base  │  mail  │  sale  │  stock  │  account  │  delivery          │
│  loyalty  │  website  │  purchase  │  mrp                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. Bảng Dependency Tree — Thứ tự cài đặt (Bottom → Top)

### Layer 0 — Odoo v19 Enterprise Core

> Đã có sẵn, không cần cài thêm. Liệt kê để làm rõ dependency chain.

| Module | Mục đích |
|--------|---------|
| `base` | Foundation: `res.partner`, `res.users`, `res.company` |
| `mail` | Messaging, chatter, notification |
| `sale` | `sale.order`, `sale.order.line`, quotation workflow |
| `stock` | `stock.picking`, `stock.quant`, multi-warehouse |
| `account` | `account.move`, journal entries, COGS |
| `delivery` | `delivery.carrier`, shipping integration base |
| `loyalty` | `loyalty.program`, `loyalty.card`, promotion engine |
| `purchase` | `purchase.order` (restock flow) |
| `mrp` | Bill of Materials (dùng cho Combo decomposition) |

---

### Layer 1 — OCA REST Framework

> Cài trước toàn bộ ShopInvader và Custom modules.

| # | Module | Repository | Phụ thuộc vào |
|---|--------|-----------|--------------|
| 1 | `fastapi` | `OCA/rest-framework` | `base` |
| 2 | `fastapi_auth_jwt` | `OCA/rest-framework` | `fastapi` |
| 3 | `fastapi_auth_partner_jwt` | `OCA/rest-framework` | `fastapi_auth_jwt` |
| 4 | `auth_oauth` | `OCA/server-auth` | `base`, `mail` |

**Lưu ý cài đặt:**
```bash
# Clone OCA rest-framework vào custom_addons hoặc extra-addons path
git clone https://github.com/OCA/rest-framework.git --branch 17.0
# Odoo v19 dùng branch 17.0 của OCA (branch 19.0 chưa release stable tại thời điểm này)
# Kiểm tra compatibility với Odoo v19 trước khi dùng
```

---

### Layer 2 — ShopInvader Suite (OCA)

> Cài theo thứ tự — `shopinvader` base trước, các sub-module sau.

| # | Module | Repository | Phụ thuộc vào |
|---|--------|-----------|--------------|
| 5 | `shopinvader` | `shopinvader/shopinvader` | `fastapi_auth_partner_jwt` |
| 6 | `shopinvader_product` | `shopinvader/shopinvader` | `shopinvader` |
| 7 | `shopinvader_category` | `shopinvader/shopinvader` | `shopinvader_product` |
| 8 | `shopinvader_cart` | `shopinvader/shopinvader` | `shopinvader_product` |
| 9 | `shopinvader_sale` | `shopinvader/shopinvader` | `shopinvader_cart` |
| 10 | `shopinvader_partner` | `shopinvader/shopinvader` | `shopinvader` |
| 11 | `shopinvader_delivery` | `shopinvader/shopinvader` | `shopinvader_sale`, `delivery` |
| 12 | `shopinvader_wishlist` | `shopinvader/shopinvader` | `shopinvader_product`, `shopinvader_partner` |

---

### Layer 3 — Foundation Custom Modules

> **Phải cài trước Layer 4 và 5.** Đây là foundation chứa Feature Flags, custom fields dùng chung cho toàn hệ thống.

| # | Module | Phụ thuộc vào | Mô tả |
|---|--------|--------------|-------|
| 13 | `fashion_store_config` | `base`, `sale`, `delivery`, `loyalty` | Feature Flags FF-01–FF-20 trong `res.config.settings`; global config params (CoolCash rate, tier thresholds, free shipping threshold) |
| 14 | `fashion_store_product` | `fashion_store_config`, `shopinvader_product` | Custom fields trên `product.template`: gender_type, material, technology, care_instruction, combo flag |
| 15 | `fashion_store_sale` | `fashion_store_config`, `shopinvader_sale` | Custom fields trên `sale.order`: gender_title, alternate_receiver, coolcash_amount_used, referral_code, routing metadata |

---

### Layer 4 — Business Logic Custom Modules

> Cài sau Layer 3. Thứ tự trong layer này phụ thuộc inter-module dependencies.

| # | Module | Phụ thuộc vào | Mô tả |
|---|--------|--------------|-------|
| 16 | `coolcash` | `fashion_store_config`, `fashion_store_sale`, `loyalty` | Wallet model, earn/spend/refund logic, automation rules, FastAPI router `/api/coolcash` |
| 17 | `coolclub` | `coolcash`, `fashion_store_config` | Tier model, threshold automation, membership management, FastAPI router `/api/coolclub` |
| 18 | `referral` | `coolcash`, `fashion_store_config`, `fashion_store_sale` | Code generation, validation, reward trigger, FastAPI router `/api/referral` |
| 19 | `fastapi_auth_zalo` | `fastapi_auth_partner_jwt`, `auth_oauth` | Zalo OA OAuth2 login via `/api/auth/zalo` |
| 20 | `payment_vnpay` | `fashion_store_config`, `account` | VNPay payment provider, HMAC-SHA512, webhook handler |
| 21 | `payment_momo` | `fashion_store_config`, `account` | MoMo payment provider, HMAC-SHA256, IPN handler |
| 22 | `payment_zalopay` | `fashion_store_config`, `account` | ZaloPay payment provider, HMAC-SHA256, callback handler |
| 23 | `delivery_ghn` | `delivery`, `fashion_store_config` | GHN carrier API, auto-create shipment, tracking webhook |
| 24 | `delivery_ghtk` | `delivery`, `fashion_store_config` | GHTK carrier API, auto-create shipment, tracking webhook |
| 25 | `sale_return_api` | `coolcash`, `delivery_ghn`, `delivery_ghtk`, `fashion_store_sale` | Base return request model, stock.return.picking creation, CoolCash recovery logic |

---

### Layer 5 — Killer Features

> Cài cuối cùng, sau khi toàn bộ Layer 4 đã hoạt động và tested.

| # | Module | Phụ thuộc vào | Killer Feature |
|---|--------|--------------|----------------|
| 26 | `fashion_store_return` | `sale_return_api`, `delivery_ghn`, `delivery_ghtk`, `coolcash` | **Automated Returns Portal** — Full automation: reverse pickup scheduling + auto CoolCash refund |
| 27 | `fashion_store_routing` | `fashion_store_sale`, `stock`, `delivery_ghn`, `delivery_ghtk` | **Smart Multi-Warehouse Fulfillment** — Nearest warehouse routing + auto order split |
| 28 | `fashion_store_combo` | `fashion_store_product`, `fashion_store_sale`, `account` | **Dynamic Combo Engine** — Frontend combo → backend SKU decomposition + COGS tracking |
| 29 | `fashion_store_dashboard` | `sale`, `account`, `delivery`, `fashion_store_config` | **Real-time Omnichannel P&L Dashboard** — Net revenue, shipping cost, marketing cost per hour |
| 30 | `fashion_store_ai_catalog` | `fashion_store_product`, `shopinvader_product`, `sale` | **AI-Driven Personalized Catalog** — Purchase history → AI recommendation → ranked product feed |

---

## 2. Kiến trúc dữ liệu — Database Schema Customization

### 2.1 Model gốc được `_inherit` — Thêm trường tùy biến

#### `res.partner` — Module: `fashion_store_config` + `coolcash` + `coolclub`

```python
class ResPartner(models.Model):
    _inherit = 'res.partner'

    # fashion_store_config
    x_gender_title = fields.Selection(
        [('anh', 'Anh'), ('chi', 'Chị'), ('ban', 'Bạn')],
        string='Danh xưng',
        default='ban'
    )  # FF-20
    x_birth_date = fields.Date(string='Ngày sinh')

    # Zalo OAuth (fastapi_auth_zalo)
    x_zalo_id = fields.Char(string='Zalo ID', index=True)

    # coolcash (computed từ coolcash.wallet)
    x_coolcash_balance = fields.Float(
        string='Số dư CoolCash',
        compute='_compute_coolcash_balance',
        store=True
    )
    x_coolcash_wallet_id = fields.Many2one(
        'coolcash.wallet',
        string='CoolCash Wallet'
    )

    # coolclub
    x_coolclub_membership_id = fields.Many2one(
        'coolclub.membership',
        string='CoolClub Membership'
    )
    x_coolclub_tier_id = fields.Many2one(
        'coolclub.tier',
        string='Hạng thành viên',
        related='x_coolclub_membership_id.tier_id',
        store=True
    )
    x_coolclub_cumulative_spend = fields.Float(
        string='Tổng chi tiêu tích lũy',
        related='x_coolclub_membership_id.cumulative_spend',
        store=True
    )

    # referral
    x_referral_code_id = fields.Many2one(
        'referral.code',
        string='Mã giới thiệu của tôi'
    )
```

---

#### `sale.order` — Module: `fashion_store_sale` + `coolcash` + `referral` + `fashion_store_routing`

```python
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # fashion_store_sale — FF-19, FF-20
    x_gender_title = fields.Selection(
        [('anh', 'Anh'), ('chi', 'Chị'), ('ban', 'Bạn')],
        string='Danh xưng người nhận'
    )
    x_alternate_receiver_name = fields.Char(string='Tên người nhận thay')
    x_alternate_receiver_phone = fields.Char(string='SĐT người nhận thay')

    # coolcash
    x_coolcash_amount_used = fields.Float(
        string='CoolCash đã dùng',
        default=0.0
    )
    x_coolcash_earned = fields.Float(
        string='CoolCash tích lũy',
        default=0.0
    )

    # referral
    x_referral_code = fields.Char(string='Mã giới thiệu áp dụng')
    x_referral_code_id = fields.Many2one(
        'referral.code',
        string='Referral Code Object'
    )
    x_referral_discount = fields.Float(
        string='Giảm giá từ Referral',
        default=0.0
    )

    # fashion_store_routing (Killer Feature)
    x_is_split_order = fields.Boolean(string='Đơn tách từ đơn gốc', default=False)
    x_parent_order_id = fields.Many2one('sale.order', string='Đơn gốc')
    x_child_order_ids = fields.One2many('sale.order', 'x_parent_order_id', string='Đơn con')
    x_routed_warehouse_id = fields.Many2one('stock.warehouse', string='Kho định tuyến')
    x_routing_score = fields.Float(string='Routing Score', digits=(6, 2))

    # fashion_store_return (Killer Feature)
    x_return_request_ids = fields.One2many(
        'fashion.return.request', 'order_id', string='Đơn đổi/trả'
    )
```

---

#### `product.template` — Module: `fashion_store_product`

```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Product enrichment fields
    x_gender_type = fields.Selection(
        [('male', 'Nam'), ('female', 'Nữ'), ('unisex', 'Unisex')],
        string='Giới tính',
        default='unisex'
    )
    x_material = fields.Char(string='Chất liệu')
    x_technology = fields.Char(string='Công nghệ')
    x_care_instruction = fields.Text(string='Hướng dẫn bảo quản')

    # CoolCash override per product
    x_coolcash_earn_override = fields.Float(
        string='CoolCash earn rate override (%)',
        help='Nếu để 0, dùng rate mặc định từ Settings',
        default=0.0
    )

    # Combo Engine (Killer Feature)
    x_is_combo = fields.Boolean(string='Là sản phẩm Combo', default=False)
    x_combo_component_ids = fields.Many2many(
        'product.product',
        'product_combo_component_rel',
        'combo_tmpl_id',
        'component_id',
        string='SKU thành phần Combo'
    )
    x_combo_cogs = fields.Float(
        string='COGS Combo (tính từ các SKU thành phần)',
        compute='_compute_combo_cogs',
        store=True
    )
```

---

#### `res.config.settings` — Module: `fashion_store_config` (20 Feature Flags)

```python
class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # ── Feature Flags FF-01 đến FF-20 ──────────────────────────────────

    x_ff_01_free_gift = fields.Boolean(
        string='FF-01: Free Gift Promotion',
        config_parameter='fashion.ff_01_free_gift'
    )
    x_ff_02_free_shipping = fields.Boolean(
        string='FF-02: Free Shipping Threshold',
        config_parameter='fashion.ff_02_free_shipping'
    )
    x_ff_03_coupon = fields.Boolean(
        string='FF-03: Coupon / Voucher',
        config_parameter='fashion.ff_03_coupon'
    )
    x_ff_04_combo = fields.Boolean(
        string='FF-04: Combo Products',
        config_parameter='fashion.ff_04_combo'
    )
    x_ff_05_pre_order = fields.Boolean(
        string='FF-05: Pre-order',
        config_parameter='fashion.ff_05_pre_order'
    )
    x_ff_06_coolcash = fields.Boolean(
        string='FF-06: CoolCash Loyalty',
        config_parameter='fashion.ff_06_coolcash'
    )
    x_ff_07_coolcash_expiry = fields.Boolean(
        string='FF-07: CoolCash Expiry',
        config_parameter='fashion.ff_07_coolcash_expiry'
    )
    x_ff_08_referral = fields.Boolean(
        string='FF-08: Referral Program',
        config_parameter='fashion.ff_08_referral'
    )
    x_ff_09_coolclub = fields.Boolean(
        string='FF-09: CoolClub Membership',
        config_parameter='fashion.ff_09_coolclub'
    )
    x_ff_10_tier_downgrade = fields.Boolean(
        string='FF-10: CoolClub Tier Downgrade',
        config_parameter='fashion.ff_10_tier_downgrade'
    )
    x_ff_11_wishlist = fields.Boolean(
        string='FF-11: Wishlist',
        config_parameter='fashion.ff_11_wishlist'
    )
    x_ff_12_product_review = fields.Boolean(
        string='FF-12: Product Reviews',
        config_parameter='fashion.ff_12_product_review'
    )
    x_ff_13_momo = fields.Boolean(
        string='FF-13: MoMo Payment',
        config_parameter='fashion.ff_13_momo'
    )
    x_ff_14_zalopay = fields.Boolean(
        string='FF-14: ZaloPay Payment',
        config_parameter='fashion.ff_14_zalopay'
    )
    x_ff_15_vnpay = fields.Boolean(
        string='FF-15: VNPay Payment',
        config_parameter='fashion.ff_15_vnpay'
    )
    x_ff_16_social_login = fields.Boolean(
        string='FF-16: Social Login (Google/Facebook)',
        config_parameter='fashion.ff_16_social_login'
    )
    x_ff_17_zalo_login = fields.Boolean(
        string='FF-17: Zalo QR Login',
        config_parameter='fashion.ff_17_zalo_login'
    )
    x_ff_18_multi_warehouse = fields.Boolean(
        string='FF-18: Multi-Warehouse Routing',
        config_parameter='fashion.ff_18_multi_warehouse'
    )
    x_ff_19_alternate_receiver = fields.Boolean(
        string='FF-19: Alternate Receiver',
        config_parameter='fashion.ff_19_alternate_receiver'
    )
    x_ff_20_gender_title = fields.Boolean(
        string='FF-20: Gender Title (Danh xưng)',
        config_parameter='fashion.ff_20_gender_title'
    )

    # ── Global Config Params ────────────────────────────────────────────

    x_coolcash_earn_rate = fields.Float(
        string='CoolCash Earn Rate (%)',
        config_parameter='fashion.coolcash_earn_rate',
        default=7.0,
        help='Phần trăm giá trị đơn hàng được hoàn vào CoolCash (mặc định 7%)'
    )
    x_free_shipping_threshold = fields.Float(
        string='Ngưỡng miễn phí vận chuyển (VNĐ)',
        config_parameter='fashion.free_shipping_threshold',
        default=350000.0
    )
    x_coolclub_silver_threshold = fields.Float(
        string='CoolClub Silver — Ngưỡng tích lũy (VNĐ)',
        config_parameter='fashion.coolclub_silver_threshold',
        default=1000000.0
    )
    x_coolclub_gold_threshold = fields.Float(
        string='CoolClub Gold — Ngưỡng tích lũy (VNĐ)',
        config_parameter='fashion.coolclub_gold_threshold',
        default=3000000.0
    )
    x_coolclub_diamond_threshold = fields.Float(
        string='CoolClub Diamond — Ngưỡng tích lũy (VNĐ)',
        config_parameter='fashion.coolclub_diamond_threshold',
        default=10000000.0
    )
    x_referral_reward_referrer = fields.Float(
        string='Referral — Thưởng cho người giới thiệu (CoolCash)',
        config_parameter='fashion.referral_reward_referrer',
        default=50000.0
    )
    x_referral_discount_new_customer = fields.Float(
        string='Referral — Giảm giá cho khách mới (VNĐ)',
        config_parameter='fashion.referral_discount_new_customer',
        default=50000.0
    )
```

---

### 2.2 Model mới — Custom Odoo Models

#### Nhóm CoolCash

| Model | Table | Fields chính | Module |
|-------|-------|-------------|--------|
| `coolcash.wallet` | `coolcash_wallet` | `partner_id` (M2o res.partner, unique), `balance` (Float), `lifetime_earned` (Float), `currency` ('CoolCash') | `coolcash` |
| `coolcash.transaction` | `coolcash_transaction` | `wallet_id` (M2o), `amount` (Float, signed), `type` (earn/spend/expire/refund), `reference` (Char), `order_id` (M2o sale.order), `date` (Datetime), `expiry_date` (Date, nullable) | `coolcash` |

#### Nhóm CoolClub

| Model | Table | Fields chính | Module |
|-------|-------|-------------|--------|
| `coolclub.tier` | `coolclub_tier` | `name` (Char: Bronze/Silver/Gold/Diamond), `threshold` (Float), `sequence` (Int), `coolcash_earn_rate` (Float), `free_shipping_threshold` (Float), `birthday_bonus` (Float), `early_access` (Boolean) | `coolclub` |
| `coolclub.membership` | `coolclub_membership` | `partner_id` (M2o, unique), `tier_id` (M2o coolclub.tier), `cumulative_spend` (Float, compute), `join_date` (Date), `tier_expiry_date` (Date), `tier_upgrade_date` (Date), `tier_history_ids` (O2m) | `coolclub` |
| `coolclub.tier.history` | `coolclub_tier_history` | `membership_id` (M2o), `from_tier_id`, `to_tier_id`, `change_date` (Datetime), `reason` (Char) | `coolclub` |

#### Nhóm Referral

| Model | Table | Fields chính | Module |
|-------|-------|-------------|--------|
| `referral.code` | `referral_code` | `partner_id` (M2o, unique), `code` (Char, unique, index), `is_active` (Boolean), `total_referred` (Int, compute), `total_earned` (Float, compute) | `referral` |
| `referral.reward.log` | `referral_reward_log` | `referrer_id` (M2o res.partner), `referee_id` (M2o res.partner), `order_id` (M2o sale.order), `referrer_reward` (Float), `referee_discount` (Float), `date` (Datetime), `state` (pending/done/cancelled) | `referral` |

#### Nhóm Killer Features

| Model | Table | Fields chính | Module |
|-------|-------|-------------|--------|
| `fashion.return.request` | `fashion_return_request` | `order_id` (M2o sale.order), `partner_id` (M2o), `state` (draft/approved/shipped/done/cancelled), `reason` (Text), `items_json` (Text, JSON), `picking_return_id` (M2o stock.picking), `carrier_pickup_job_id` (Char), `refund_type` (coolcash/bank), `coolcash_refunded` (Float), `created_date` (Datetime) | `fashion_store_return` |
| `fashion.warehouse.rule` | `fashion_warehouse_rule` | `warehouse_id` (M2o stock.warehouse), `coverage_province_ids` (M2m res.country.state), `priority` (Int), `max_split_orders` (Int) | `fashion_store_routing` |
| `fashion.order.route` | `fashion_order_route` | `order_id` (M2o sale.order), `rule_id` (M2o fashion.warehouse.rule), `warehouse_id` (M2o), `routing_score` (Float), `is_split` (Boolean), `split_child_ids` (O2m sale.order) | `fashion_store_routing` |
| `fashion.combo.template` | `fashion_combo_template` | `product_tmpl_id` (M2o product.template, unique), `component_ids` (O2m fashion.combo.component), `total_cogs` (Float, compute) | `fashion_store_combo` |
| `fashion.combo.component` | `fashion_combo_component` | `combo_id` (M2o fashion.combo.template), `product_id` (M2o product.product), `qty` (Float), `unit_cogs` (Float) | `fashion_store_combo` |
| `fashion.ai.recommendation` | `fashion_ai_recommendation` | `partner_id` (M2o res.partner), `product_ids_json` (Text, JSON — ranked list), `score_json` (Text, JSON), `generated_at` (Datetime), `ttl_hours` (Int, default=24), `is_expired` (Boolean, compute) | `fashion_store_ai_catalog` |

---

## 3. Killer Features — Chi tiết thiết kế

### KF-1: Automated Returns Portal (`fashion_store_return`)

**Mục tiêu:** Khách tự tạo yêu cầu đổi/trả qua Next.js Frontend → Odoo tự động: tạo Reverse Picking + lên lịch lấy hàng với GHN/GHTK + hoàn CoolCash.

**API Endpoints mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/returns/create` | `🔒 JWT` | Tạo yêu cầu đổi/trả |
| `GET` | `/api/returns` | `🔒 JWT` | Danh sách đổi/trả của tôi |
| `GET` | `/api/returns/{return_id}` | `🔒 JWT` | Chi tiết + trạng thái |
| `POST` | `/api/returns/{return_id}/cancel` | `🔒 JWT` | Huỷ yêu cầu (nếu còn draft) |

**Automation Flow:**
```
Customer → POST /api/returns/create
                │
                ▼
    fashion.return.request (state=draft)
                │
    Odoo Action → Stock Return Wizard
                │
    stock.picking (type=incoming reverse)
                │
    GHN/GHTK API → Create reverse pickup order
    (carrier_pickup_job_id = GHN/GHTK job ID)
                │
    state = approved, email notification sent
                │
    GHN/GHTK webhook: pickup done → state = shipped
                │
    Goods received → stock.picking validate()
                │
    coolcash.wallet.credit(partner, refund_amount)
    state = done
```

**Odoo Logic (`fashion_store_return`):**
```python
# models/fashion_return_request.py
def action_approve_and_schedule_pickup(self):
    # 1. Tạo Reverse Picking
    return_wizard = self.env['stock.return.picking'].create({
        'picking_id': self.order_id.picking_ids.filtered(
            lambda p: p.state == 'done'
        )[-1].id
    })
    new_picking = return_wizard._create_returns()

    # 2. Gọi GHN API để lên lịch lấy hàng
    carrier = self.order_id.carrier_id
    pickup_job = carrier._create_reverse_pickup(
        picking=new_picking,
        address=self.order_id.partner_shipping_id
    )
    self.carrier_pickup_job_id = pickup_job['order_code']
    self.picking_return_id = new_picking.id
    self.state = 'approved'
```

---

### KF-2: Smart Multi-Warehouse Fulfillment (`fashion_store_routing`)

**Mục tiêu:** Khi khách xác nhận đơn hàng, hệ thống tự động:
1. Tính warehouse gần khách nhất (theo tỉnh/thành) có đủ stock
2. Nếu một kho không đủ → split order thành nhiều sub-order từ nhiều kho
3. Tối ưu chi phí vận chuyển và thời gian giao hàng

**API Endpoints mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/routing/estimate` | `✅ Public` | Tính toán routing preview trước khi confirm |
| `GET` | `/api/routing/warehouses` | `✅ Public` | Danh sách kho + province coverage |

**Routing Algorithm:**
```python
# models/sale_order.py (_inherit)
def _compute_optimal_route(self):
    """
    1. Lấy tỉnh/thành của shipping address
    2. Tìm warehouse rules phủ tỉnh đó (priority asc)
    3. Check stock tại warehouse đó cho từng line
    4. Nếu warehouse_A đủ toàn bộ → assign, done
    5. Nếu không đủ → split:
       - Line có stock tại WH_A → sub-order 1 (WH_A)
       - Line còn lại → sub-order 2 (WH_B nearest fallback)
    6. Ghi fashion.order.route record
    """
    shipping_province = self.partner_shipping_id.state_id

    # Tìm rules theo priority
    rules = self.env['fashion.warehouse.rule'].search([
        ('coverage_province_ids', 'in', shipping_province.id)
    ], order='priority asc')

    for rule in rules:
        wh = rule.warehouse_id
        available = self._check_stock_at_warehouse(wh)
        if available['all_available']:
            return self._assign_warehouse(wh)

    # Cần split
    return self._split_order_by_warehouse(rules)
```

---

### KF-3: Dynamic Combo Engine (`fashion_store_combo`)

**Mục tiêu:** Frontend hiển thị Combo như 1 sản phẩm đơn lẻ với giá combo. Khi đặt hàng → Odoo tự động bóc tách thành các SKU đơn lẻ để:
- Trừ kho chính xác theo từng SKU
- Ghi nhận COGS cho từng SKU (kế toán)

**API Endpoints mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/catalog/combos` | `✅ Public` | Danh sách combo đang active |
| `GET` | `/api/catalog/combos/{slug}` | `✅ Public` | Chi tiết combo + component SKUs |

**Combo Decomposition Flow:**
```python
# models/sale_order_line.py (_inherit)
def _expand_combo_lines(self):
    """Gọi khi sale.order.action_confirm()"""
    for line in self.filtered(lambda l: l.product_id.product_tmpl_id.x_is_combo):
        combo = line.product_id.product_tmpl_id
        for component in combo.x_combo_component_ids:
            # Tạo hidden line cho từng SKU thành phần
            self.order_id.order_line.create({
                'product_id': component.id,
                'product_uom_qty': line.product_uom_qty,
                'price_unit': 0,  # Giá = 0, combo line giữ giá
                'x_is_combo_component': True,
                'x_parent_combo_line_id': line.id,
                'name': f'[Combo Component] {component.display_name}',
            })
        # Đánh dấu line gốc là combo header
        line.x_is_combo_header = True
```

**COGS Tracking:**
```python
# Khi invoice được tạo, COGS tính từ combo_cogs
# account.move.line lấy standard_price từ component SKU
# Không dùng giá bán combo để tính COGS
```

---

### KF-4: Real-time Omnichannel P&L Dashboard (`fashion_store_dashboard`)

**Mục tiêu:** CEO/CFO xem báo cáo Profit & Loss real-time theo giờ, ngày, tuần — bao gồm doanh thu thuần, shipping cost, marketing cost.

**API Endpoints mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/dashboard/pl` | `🔒 JWT` (CEO role) | P&L summary theo time range |
| `GET` | `/api/dashboard/pl/hourly` | `🔒 JWT` | Revenue theo giờ (last 24h) |
| `GET` | `/api/dashboard/orders/live` | `🔒 JWT` | Đơn mới trong 15 phút gần nhất |
| `GET` | `/api/dashboard/channels` | `🔒 JWT` | Revenue breakdown: web/app/pos |

**Response mẫu `GET /api/dashboard/pl`:**
```json
{
  "period": "2026-05-26T00:00:00 to 2026-05-26T18:30:00",
  "gross_revenue": 125600000,
  "discount_total": 8340000,
  "net_revenue": 117260000,
  "shipping_cost": 4520000,
  "shipping_revenue": 6800000,
  "net_shipping_margin": 2280000,
  "coolcash_issued": 8208200,
  "cogs_estimate": 52000000,
  "gross_profit": 65260000,
  "gross_margin_pct": 55.6,
  "orders_count": 312,
  "avg_order_value": 375641,
  "top_products": [...],
  "hourly_revenue": [...]
}
```

**Odoo Logic:** Aggregate query trực tiếp từ `sale.order` + `account.move` + `stock.valuation.layer` (COGS). Dùng PostgreSQL window functions cho hourly data. Redis cache TTL=60s để tránh N+1 query.

---

### KF-5: AI-Driven Personalized Catalog (`fashion_store_ai_catalog`)

**Mục tiêu:** Trang chủ Next.js gọi API → Nhận danh sách sản phẩm được cá nhân hóa dựa trên lịch sử mua sắm của khách từ Odoo CRM.

**API Endpoints mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/catalog/personalized` | `🔒 JWT` | Recommended products cho member |
| `GET` | `/api/catalog/trending` | `✅ Public` | Trending products (fallback cho guest) |

**Recommendation Engine:**
```python
# models/fashion_ai_recommendation.py
def _generate_recommendations(self, partner_id):
    """
    Approach: Collaborative Filtering (simple, Odoo-native)
    Không cần external ML service trong MVP.
    """
    partner = self.env['res.partner'].browse(partner_id)

    # 1. Lấy purchase history của partner
    purchased_products = self.env['sale.order.line'].search([
        ('order_id.partner_id', '=', partner_id),
        ('order_id.state', 'in', ['sale', 'done'])
    ]).mapped('product_id.product_tmpl_id')

    # 2. Tìm customers khác có pattern mua tương tự
    similar_partners = self._find_similar_customers(purchased_products)

    # 3. Lấy products mà similar customers đã mua nhưng partner chưa mua
    recommended = self._get_unrearched_products(
        similar_partners, purchased_products
    )

    # 4. Rank theo similarity score + recency
    ranked = self._rank_by_score(recommended)

    # 5. Cache kết quả vào fashion.ai.recommendation (TTL 24h)
    self._cache_recommendations(partner_id, ranked)
    return ranked
```

**Fallback:** Nếu partner chưa có đủ purchase history (< 3 đơn) → trả về `trending products` (best_seller 30 ngày qua). Cho phép tích hợp Claude API sau này như external AI service.

---

## 4. Cấu trúc Thư mục Dự án (Git Repository Skeleton)

```
odoo-ecommerce/
│
├── docker/                              # Infrastructure
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.odoo
│   ├── nginx/
│   │   └── nginx.conf
│   └── .env.example
│
├── custom_addons/                       # Tất cả custom Odoo modules
│   │
│   ├── ── LAYER 3: FOUNDATION ──────────────────────────────────────
│   │
│   ├── fashion_store_config/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── res_config_settings.py   # FF-01 đến FF-20 + global params
│   │   ├── data/
│   │   │   └── default_config.xml       # Default values khi cài
│   │   ├── views/
│   │   │   └── res_config_settings_views.xml
│   │   └── security/
│   │       └── ir.model.access.csv
│   │
│   ├── fashion_store_product/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── product_template.py      # x_gender_type, x_material, etc.
│   │   └── views/
│   │       └── product_template_views.xml
│   │
│   ├── fashion_store_sale/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── sale_order.py            # x_gender_title, x_alternate_receiver, etc.
│   │   └── views/
│   │       └── sale_order_views.xml
│   │
│   ├── ── LAYER 4: BUSINESS LOGIC ──────────────────────────────────
│   │
│   ├── coolcash/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── coolcash_wallet.py       # coolcash.wallet model
│   │   │   ├── coolcash_transaction.py  # coolcash.transaction model
│   │   │   └── res_partner.py           # _inherit res.partner
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── coolcash_router.py       # FastAPI router /api/coolcash
│   │   ├── data/
│   │   │   ├── automation_rules.xml     # Earn trigger sau delivery
│   │   │   └── cron_expiry.xml          # Daily cron check expiry (FF-07)
│   │   ├── security/
│   │   │   ├── coolcash_security.xml
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       ├── coolcash_wallet_views.xml
│   │       └── res_partner_views.xml
│   │
│   ├── coolclub/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── coolclub_tier.py         # coolclub.tier
│   │   │   ├── coolclub_membership.py   # coolclub.membership
│   │   │   └── res_partner.py           # _inherit res.partner
│   │   ├── api/
│   │   │   └── coolclub_router.py       # FastAPI router /api/coolclub
│   │   ├── data/
│   │   │   ├── tier_data.xml            # Default tiers: Bronze/Silver/Gold/Diamond
│   │   │   └── cron_tier_check.xml      # Daily/annual tier upgrade/downgrade cron
│   │   ├── security/
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       └── coolclub_views.xml
│   │
│   ├── referral/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── referral_code.py         # referral.code
│   │   │   ├── referral_reward_log.py   # referral.reward.log
│   │   │   └── sale_order.py            # _inherit: validate & apply referral
│   │   ├── api/
│   │   │   └── referral_router.py       # FastAPI router /api/referral
│   │   ├── security/
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       └── referral_views.xml
│   │
│   ├── fastapi_auth_zalo/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   └── res_partner.py           # _inherit: x_zalo_id field
│   │   └── api/
│   │       └── zalo_auth_router.py      # POST /api/auth/zalo
│   │
│   ├── payment_vnpay/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   └── payment_provider.py      # payment.provider _inherit
│   │   ├── controllers/
│   │   │   └── main.py                  # Webhook /api/payment/vnpay/webhook
│   │   ├── api/
│   │   │   └── vnpay_router.py          # FastAPI POST /api/payment/vnpay/create
│   │   ├── data/
│   │   │   └── payment_provider_data.xml
│   │   └── views/
│   │       └── payment_provider_views.xml
│   │
│   ├── payment_momo/                    # Cấu trúc tương tự payment_vnpay
│   │   └── ...
│   │
│   ├── payment_zalopay/                 # Cấu trúc tương tự payment_vnpay
│   │   └── ...
│   │
│   ├── delivery_ghn/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── delivery_carrier.py      # _inherit: GHN API methods
│   │   │   └── stock_picking.py         # _inherit: tracking number update
│   │   ├── controllers/
│   │   │   └── main.py                  # Webhook: GHN tracking callback
│   │   └── data/
│   │       └── delivery_carrier_data.xml
│   │
│   ├── delivery_ghtk/                   # Cấu trúc tương tự delivery_ghn
│   │   └── ...
│   │
│   ├── sale_return_api/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── fashion_return_request.py
│   │   │   └── sale_order.py            # _inherit: x_return_request_ids
│   │   ├── api/
│   │   │   └── return_router.py         # FastAPI /api/orders/{id}/return
│   │   ├── security/
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       └── return_request_views.xml
│   │
│   ├── ── LAYER 5: KILLER FEATURES ─────────────────────────────────
│   │
│   ├── fashion_store_return/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   └── fashion_return_request.py  # _inherit: automation methods
│   │   └── api/
│   │       └── return_automation_router.py  # Full auto flow endpoints
│   │
│   ├── fashion_store_routing/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── fashion_warehouse_rule.py  # fashion.warehouse.rule
│   │   │   ├── fashion_order_route.py     # fashion.order.route
│   │   │   └── sale_order.py              # _inherit: routing compute
│   │   ├── api/
│   │   │   └── routing_router.py
│   │   ├── data/
│   │   │   └── warehouse_rule_data.xml    # Default rules
│   │   ├── security/
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       └── warehouse_rule_views.xml
│   │
│   ├── fashion_store_combo/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── fashion_combo_template.py  # fashion.combo.template
│   │   │   ├── fashion_combo_component.py # fashion.combo.component
│   │   │   ├── product_template.py        # _inherit: x_is_combo, components
│   │   │   └── sale_order_line.py         # _inherit: _expand_combo_lines
│   │   ├── api/
│   │   │   └── combo_router.py            # /api/catalog/combos
│   │   ├── security/
│   │   │   └── ir.model.access.csv
│   │   └── views/
│   │       └── combo_views.xml
│   │
│   ├── fashion_store_dashboard/
│   │   ├── __manifest__.py
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   └── dashboard_service.py       # Aggregate query service
│   │   ├── api/
│   │   │   └── dashboard_router.py        # /api/dashboard/*
│   │   └── security/
│   │       └── ir.model.access.csv
│   │
│   └── fashion_store_ai_catalog/
│       ├── __manifest__.py
│       ├── __init__.py
│       ├── models/
│       │   ├── fashion_ai_recommendation.py  # fashion.ai.recommendation
│       │   └── recommendation_engine.py      # Collaborative filtering logic
│       ├── api/
│       │   └── personalized_catalog_router.py  # /api/catalog/personalized
│       ├── data/
│       │   └── cron_refresh_recommendations.xml  # Daily regen cache
│       └── security/
│           └── ir.model.access.csv
│
├── oca_addons/                          # OCA modules (git submodule hoặc pip install)
│   ├── rest-framework/                  # OCA/rest-framework (fastapi, fastapi_auth_*)
│   └── shopinvader/                     # shopinvader/shopinvader
│
├── docs/
│   ├── brd/
│   │   └── fashion-store-brd.md
│   ├── uc/
│   │   └── use-cases.md
│   ├── us/
│   │   └── user-stories.md
│   ├── api/
│   │   └── api-mapping.md
│   └── mapping/
│       └── odoo-module-mapping.md       ← file này
│
├── frontend/                            # Next.js (có thể là submodule hoặc monorepo)
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── api/                     # API client wrappers → Odoo endpoints
│   │   └── hooks/
│   └── ...
│
├── .gitmodules                          # Git submodules cho OCA
├── .env.example
├── odoo.conf.example
└── README.md
```

---

## 5. `__manifest__.py` mẫu — Core Module (`coolcash`)

```python
# custom_addons/coolcash/__manifest__.py
{
    'name': 'CoolCash Loyalty Wallet',
    'version': '19.0.1.0.0',
    'summary': 'CoolCash internal loyalty currency — earn, spend, refund, expiry',
    'author': 'Fashion Store Team',
    'category': 'eCommerce / Loyalty',
    'license': 'LGPL-3',
    'depends': [
        # Layer 0 — Odoo Core
        'sale',
        'account',
        'loyalty',
        # Layer 3 — Foundation Custom
        'fashion_store_config',
        'fashion_store_sale',
        # Layer 2 — ShopInvader (for FastAPI router registration)
        'shopinvader_sale',
        # Layer 1 — OCA FastAPI
        'fastapi_auth_partner_jwt',
    ],
    'data': [
        'security/coolcash_security.xml',
        'security/ir.model.access.csv',
        'data/automation_rules.xml',
        'data/cron_expiry.xml',
        'views/coolcash_wallet_views.xml',
        'views/res_partner_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
```

---

## 6. Tổng hợp Module Count

| Layer | Loại | Số module | Module names |
|-------|------|-----------|-------------|
| 0 | Odoo Core | 10 | (pre-installed) |
| 1 | OCA Framework | 4 | fastapi, fastapi_auth_jwt, fastapi_auth_partner_jwt, auth_oauth |
| 2 | ShopInvader | 8 | shopinvader, shopinvader_product, shopinvader_category, shopinvader_cart, shopinvader_sale, shopinvader_partner, shopinvader_delivery, shopinvader_wishlist |
| 3 | Custom Foundation | 3 | fashion_store_config, fashion_store_product, fashion_store_sale |
| 4 | Custom Business Logic | 10 | coolcash, coolclub, referral, fastapi_auth_zalo, payment_vnpay, payment_momo, payment_zalopay, delivery_ghn, delivery_ghtk, sale_return_api |
| 5 | Killer Features | 5 | fashion_store_return, fashion_store_routing, fashion_store_combo, fashion_store_dashboard, fashion_store_ai_catalog |
| **TOTAL Custom** | | **18** | Layer 3 + 4 + 5 |
| **TOTAL 3rd-party** | | **12** | Layer 1 + 2 |

---

## 7. Thứ tự Install (Production Checklist)

```bash
# Step 1 — Odoo v19 Enterprise + PostgreSQL 16
# (Docker Compose, đã có sẵn)

# Step 2 — Clone OCA repos vào oca_addons/
git submodule add https://github.com/OCA/rest-framework.git oca_addons/rest-framework
git submodule add https://github.com/shopinvader/shopinvader.git oca_addons/shopinvader

# Step 3 — Odoo addons_path config
# odoo.conf: addons_path = /odoo/addons,/custom_addons,/oca_addons/rest-framework,/oca_addons/shopinvader

# Step 4 — Install theo thứ tự Layer
odoo -d fashion_db -i fastapi,fastapi_auth_jwt,fastapi_auth_partner_jwt,auth_oauth
odoo -d fashion_db -i shopinvader,shopinvader_product,shopinvader_category
odoo -d fashion_db -i shopinvader_cart,shopinvader_sale,shopinvader_partner,shopinvader_delivery,shopinvader_wishlist
odoo -d fashion_db -i fashion_store_config,fashion_store_product,fashion_store_sale
odoo -d fashion_db -i coolcash,coolclub,referral
odoo -d fashion_db -i payment_vnpay,payment_momo,payment_zalopay
odoo -d fashion_db -i delivery_ghn,delivery_ghtk,sale_return_api,fastapi_auth_zalo
# Killer Features — cài sau khi Layer 4 tested
odoo -d fashion_db -i fashion_store_return,fashion_store_routing
odoo -d fashion_db -i fashion_store_combo,fashion_store_dashboard,fashion_store_ai_catalog
```

---

*Module Mapping v1.0 — Fashion Store eCommerce Headless Platform*  
*Odoo v19 + OCA FastAPI + ShopInvader + 18 Custom Modules (3 Foundation + 10 Business Logic + 5 Killer Features)*
