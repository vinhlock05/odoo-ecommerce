# Phase 6 — Implementation Plan
# Fashion Store eCommerce trên Odoo v19 (Headless Architecture)

> **Nguyên tắc triển khai:** Master Data trước → Foundation Custom Modules → Business Logic → Killer Features → Frontend Integration
>
> **Kiến trúc:** Headless Odoo v19 + OCA FastAPI + ShopInvader + Next.js Frontend
>
> **Tài liệu tham chiếu:**
> - BRD v2.0: `docs/brd/fashion-store-brd.md`
> - Use Cases UC01–UC20: `docs/uc/use-cases.md`
> - User Stories US-001–US-028: `docs/us/user-stories.md`
> - API Mapping ~50 endpoints: `docs/api/api-mapping.md`
> - Module Mapping 30 modules: `docs/mapping/odoo-module-mapping.md`

---

## Tổng quan Timeline

| Sprint | Tên | Độ dài | Deliverable chính |
|--------|-----|--------|-------------------|
| S0 | Environment Setup | 3 ngày | Docker stack chạy, Odoo v19 cài xong |
| S1 | Master Data | 4 ngày | Size/Color/Variants/Warehouse cấu hình xong |
| S2 | Foundation Layer 3 | 5 ngày | 3 custom base modules |
| S3 | OCA + ShopInvader | 4 ngày | Layer 1 + Layer 2 hoạt động, API auth sống |
| S4 | CoolCash + CoolClub | 5 ngày | Loyalty system end-to-end |
| S5 | Payments + Delivery | 5 ngày | VNPay/MoMo/ZaloPay + GHN/GHTK live |
| S6 | Killer Features | 6 ngày | 5 KF modules |
| S7 | Frontend Next.js | 7 ngày | Full storefront connected to API |
| S8 | QA + Docs | 3 ngày | Test coverage, final docs |

**Tổng:** ~42 ngày làm việc (~8.5 tuần)

---

## Sprint 0 — Environment Setup (3 ngày)

### Mục tiêu
Dựng môi trường dev chuẩn: Odoo v19 Enterprise chạy trong Docker, PostgreSQL 16, kết nối được qua browser.

### Task S0-01: Docker Compose stack

**File:** `docker/docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: odoo
      POSTGRES_PASSWORD: odoo
      POSTGRES_DB: odoo_fashion
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  odoo:
    image: odoo:19.0
    depends_on:
      - db
    environment:
      HOST: db
      USER: odoo
      PASSWORD: odoo
    ports:
      - "8069:8069"
      - "8072:8072"
    volumes:
      - ./custom_addons:/mnt/extra-addons
      - ./oca_addons:/mnt/oca-addons
      - odoo_data:/var/lib/odoo
    command: >
      odoo
      --addons-path=/usr/lib/python3/dist-packages/odoo/addons,/mnt/oca-addons,/mnt/extra-addons
      --db_host=db
      --db_user=odoo
      --db_password=odoo
      --database=odoo_fashion
      --dev=xml

volumes:
  pgdata:
  odoo_data:
```

**File:** `docker/odoo.conf`

```ini
[options]
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/oca-addons,/mnt/extra-addons
db_host = db
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = odoo_fashion
workers = 2
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
limit_request = 8192
limit_time_cpu = 60
limit_time_real = 120
log_level = info
```

### Task S0-02: Clone OCA modules (Git Submodules)

```bash
# Từ root project
git init

# Layer 1 — OCA REST Framework
git submodule add -b 19.0 https://github.com/OCA/rest-framework.git oca_addons/rest-framework

# Layer 2 — ShopInvader
git submodule add -b 19.0 https://github.com/shopinvader/odoo-shopinvader.git oca_addons/shopinvader

# Auth OAuth (từ odoo enterprise — hoặc OCA nếu community)
# Lưu ý: auth_oauth đã có sẵn trong Odoo Enterprise v19 core
```

> **Lưu ý:** Nếu dùng Odoo Community thay Enterprise, cần thêm `auth_oauth` từ OCA/server-auth.

### Task S0-03: Khởi tạo database + cài base modules

```bash
# Khởi động container
docker compose up -d

# Cài Odoo base qua CLI
docker exec -it fashion_odoo odoo \
  --database=odoo_fashion \
  --init=base,web,mail,sale,stock,account,product,loyalty \
  --stop-after-init

# Verify
docker exec -it fashion_odoo odoo shell \
  --database=odoo_fashion \
  -c "print('Odoo', odoo.release.version)"
```

### Checklist S0

- [ ] `docker compose up -d` → không lỗi
- [ ] Browser mở `http://localhost:8069` → Odoo login page
- [ ] Login admin thành công
- [ ] PostgreSQL connect được (port 5432)
- [ ] `oca_addons/rest-framework/` có files
- [ ] `oca_addons/shopinvader/` có files

---

## Sprint 1 — Master Data Configuration (4 ngày)

> **Lý do làm trước:** Master Data (Size, Màu sắc, Biến thể, Kho) là nền tảng cho mọi module business logic sau. Không có Product Attributes chuẩn → không thể test API catalog, cart, checkout.

### Task S1-01: Product Attributes — Kích thước (Size)

**Đường dẫn UI:** Inventory → Configuration → Product Attributes

```
Attribute: Kích thước
Display Type: Pills (hiển thị dạng nút bấm trên frontend)
Variant Creation: Always (mỗi combo size/màu = 1 SKU riêng)

Values:
  - XS   (sequence: 10)
  - S    (sequence: 20)
  - M    (sequence: 30)
  - L    (sequence: 40)
  - XL   (sequence: 50)
  - 2XL  (sequence: 60)
  - 3XL  (sequence: 70)

# Cho sản phẩm quần (số đo):
Attribute: Size Quần
Values: 28, 29, 30, 31, 32, 33, 34
```

**Data file:** `custom_addons/fashion_store_product/data/product_attributes.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
  <record id="attr_size" model="product.attribute">
    <field name="name">Kích thước</field>
    <field name="display_type">pills</field>
    <field name="create_variant">always</field>
    <field name="sequence">10</field>
  </record>

  <record id="attr_size_xs" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">XS</field>
    <field name="sequence">10</field>
  </record>
  <record id="attr_size_s" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">S</field>
    <field name="sequence">20</field>
  </record>
  <record id="attr_size_m" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">M</field>
    <field name="sequence">30</field>
  </record>
  <record id="attr_size_l" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">L</field>
    <field name="sequence">40</field>
  </record>
  <record id="attr_size_xl" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">XL</field>
    <field name="sequence">50</field>
  </record>
  <record id="attr_size_2xl" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">2XL</field>
    <field name="sequence">60</field>
  </record>
  <record id="attr_size_3xl" model="product.attribute.value">
    <field name="attribute_id" ref="attr_size"/>
    <field name="name">3XL</field>
    <field name="sequence">70</field>
  </record>
</odoo>
```

### Task S1-02: Product Attributes — Màu sắc (Color)

```
Attribute: Màu sắc
Display Type: Color (hiển thị dạng ô màu hex)
Variant Creation: Always
```

**Data file** (tiếp theo `product_attributes.xml`):

```xml
  <record id="attr_color" model="product.attribute">
    <field name="name">Màu sắc</field>
    <field name="display_type">color</field>
    <field name="create_variant">always</field>
    <field name="sequence">20</field>
  </record>

  <!-- Màu cơ bản Coolmate-style -->
  <record id="attr_color_white" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Trắng</field>
    <field name="html_color">#FFFFFF</field>
    <field name="sequence">10</field>
  </record>
  <record id="attr_color_black" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Đen</field>
    <field name="html_color">#1A1A1A</field>
    <field name="sequence">20</field>
  </record>
  <record id="attr_color_navy" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Xanh Navy</field>
    <field name="html_color">#1B2A4A</field>
    <field name="sequence">30</field>
  </record>
  <record id="attr_color_gray" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Xám</field>
    <field name="html_color">#808080</field>
    <field name="sequence">40</field>
  </record>
  <record id="attr_color_red" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Đỏ</field>
    <field name="html_color">#D32F2F</field>
    <field name="sequence">50</field>
  </record>
  <record id="attr_color_blue" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Xanh Dương</field>
    <field name="html_color">#1976D2</field>
    <field name="sequence">60</field>
  </record>
  <record id="attr_color_green" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Xanh Lá</field>
    <field name="html_color">#388E3C</field>
    <field name="sequence">70</field>
  </record>
  <record id="attr_color_beige" model="product.attribute.value">
    <field name="attribute_id" ref="attr_color"/>
    <field name="name">Be</field>
    <field name="html_color">#F5F0E8</field>
    <field name="sequence">80</field>
  </record>
```

### Task S1-03: Product Category Tree

```
Danh mục sản phẩm (Internal Category dùng cho kế toán):
  All
  └─ Fashion Store
     ├─ Áo (Top)
     │   ├─ Áo Thun
     │   ├─ Áo Polo
     │   ├─ Áo Sơ Mi
     │   └─ Áo Khoác
     ├─ Quần (Bottom)
     │   ├─ Quần Short
     │   ├─ Quần Dài
     │   └─ Quần Jeans
     ├─ Đồ Lót & Đồ Ngủ
     ├─ Phụ Kiện
     └─ Combo Set
```

**eCommerce Category** (dùng cho frontend catalog, khác Internal Category):
- Cùng cấu trúc nhưng tạo trong module `shopinvader_category` → `shopinvader.category`
- Slug format: `ao-thun`, `quan-short`, `combo-set`

### Task S1-04: Warehouse Configuration

**Đường dẫn UI:** Inventory → Configuration → Warehouses

```
# Kho Hà Nội (Bắc)
Name: Kho Hà Nội
Short Name: HN
Company: Fashion Store Vietnam
Address: [Địa chỉ Hà Nội]
Coverage: Hà Nội, Hải Phòng, Quảng Ninh, và các tỉnh phía Bắc (22 tỉnh)

# Kho TP.HCM (Nam)
Name: Kho TP. Hồ Chí Minh  
Short Name: HCM
Company: Fashion Store Vietnam
Address: [Địa chỉ HCM]
Coverage: TP.HCM, Bình Dương, Đồng Nai, và các tỉnh phía Nam (33 tỉnh)

# Kho Đà Nẵng (Trung)
Name: Kho Đà Nẵng
Short Name: DAN
Company: Fashion Store Vietnam
Address: [Địa chỉ Đà Nẵng]
Coverage: Đà Nẵng, Huế, Quảng Nam, và các tỉnh miền Trung (8 tỉnh)
```

**fashion.warehouse.rule data** (cài sau khi module `fashion_store_routing` được deploy):

```xml
<!-- Sau khi cài fashion_store_routing -->
<record id="rule_hn_north" model="fashion.warehouse.rule">
  <field name="warehouse_id" ref="stock.warehouse_hn"/>
  <field name="priority">10</field>
  <field name="coverage_province_ids" eval="[
    (4, ref('base.state_vn_hn')),
    (4, ref('base.state_vn_hp')),
    ...
  ]"/>
</record>
```

### Task S1-05: Sample Product với Variants

Tạo 3 sản phẩm mẫu để test API:

**Sản phẩm 1: Áo Thun Basic Premium**
```
Product Type: Storable Product
Internal Reference: AT-BASIC-001
Sales Price: 299,000 VNĐ
Cost: 95,000 VNĐ
Attributes:
  - Kích thước: S, M, L, XL, 2XL (5 variants)
  - Màu sắc: Trắng, Đen, Xanh Navy (3 variants)
  = 15 SKU tổng
Weight: 0.2kg
```

**Sản phẩm 2: Quần Short Thể Thao Pro**
```
Internal Reference: QS-PRO-001
Sales Price: 349,000 VNĐ
Attributes: Size Quần (28-34) × Màu sắc (Đen, Xám, Navy) = 21 SKU
```

**Sản phẩm 3: Combo Set Summer (KF-3 test)**
```
Internal Reference: COMBO-SUM-001
Sales Price: 549,000 VNĐ
x_is_combo: True
Components:
  - AT-BASIC-001 (M/Trắng) × 1
  - QS-PRO-001 (30/Đen) × 1
```

### Checklist S1

- [ ] Attribute "Kích thước" tạo xong, 7 values
- [ ] Attribute "Màu sắc" tạo xong, 8 values với hex color codes
- [ ] Product category tree 3 cấp
- [ ] 3 warehouses: HN/HCM/DAN
- [ ] 3 sample products với variants (15 + 21 SKU)
- [ ] Kiểm tra `product.product` records đủ số lượng biến thể
- [ ] Giá bán và giá vốn (Cost) được nhập đúng

---

## Sprint 2 — Foundation Layer 3 Custom Modules (5 ngày) ✅ COMPLETE

> Viết 3 module foundation trước tất cả business logic. Đây là nền tảng mà mọi module Layer 4–5 kế thừa.
>
> **Hoàn thành:** 2026-05-26. Code review (1 CRITICAL, 5 HIGH, 2 MEDIUM) đã được fix trước khi commit.
> **Divergences from plan:**
> - FF naming: `fashionos.ff.*` keys thay vì `fashion.ff_*` (namespacing rõ hơn)
> - Module tách riêng: `fashion_store_config`, `fashion_store_product`, `fashion_store_sale` (thay vì monolithic)
> - `is_enabled()` helper xử lý cả `'1'` và `'True'` (defensive, Odoo canonical là `'1'`)
> - `x_slug` có `_sql_constraints` UNIQUE + collision-suffix loop (-2, -3…)
> - `_check_combo_parent_same_order` ORM constraint (thay vì chỉ domain client-side)
> - `_check_jwt_secret_key` constraint: min 32 chars khi FF-09 bật

### Task S2-01: Module `fashion_store_config`

**Mục đích:** Chứa tất cả Feature Flags (FF-01 đến FF-20) và global config parameters.

**File:** `custom_addons/fashion_store_config/__manifest__.py`

```python
{
    'name': 'Fashion Store - Configuration',
    'version': '19.0.1.0.0',
    'category': 'Fashion Store',
    'summary': 'Feature flags and global config for Fashion Store',
    'depends': ['base', 'sale', 'website'],
    'data': [
        'data/config_parameter_defaults.xml',
        'views/res_config_settings_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
```

**File:** `custom_addons/fashion_store_config/models/res_config_settings.py`

```python
from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # ── Feature Flags FF-01 đến FF-20 ──────────────────────────────────────
    x_ff_01_free_gift = fields.Boolean(
        string='FF-01: Free Gift',
        config_parameter='fashion.ff_01_free_gift',
    )
    x_ff_02_bundle_discount = fields.Boolean(
        string='FF-02: Bundle Discount',
        config_parameter='fashion.ff_02_bundle_discount',
    )
    x_ff_03_flash_sale = fields.Boolean(
        string='FF-03: Flash Sale',
        config_parameter='fashion.ff_03_flash_sale',
    )
    x_ff_04_pre_order = fields.Boolean(
        string='FF-04: Pre-Order',
        config_parameter='fashion.ff_04_pre_order',
    )
    x_ff_05_size_guide = fields.Boolean(
        string='FF-05: Size Guide',
        config_parameter='fashion.ff_05_size_guide',
    )
    x_ff_06_coolcash = fields.Boolean(
        string='FF-06: CoolCash Loyalty',
        config_parameter='fashion.ff_06_coolcash',
    )
    x_ff_07_zalo_login = fields.Boolean(
        string='FF-07: Zalo Login',
        config_parameter='fashion.ff_07_zalo_login',
    )
    x_ff_08_referral = fields.Boolean(
        string='FF-08: Referral Program',
        config_parameter='fashion.ff_08_referral',
    )
    x_ff_09_coolclub = fields.Boolean(
        string='FF-09: CoolClub Membership',
        config_parameter='fashion.ff_09_coolclub',
    )
    x_ff_10_smart_routing = fields.Boolean(
        string='FF-10: Smart Routing',
        config_parameter='fashion.ff_10_smart_routing',
    )
    x_ff_11_returns_portal = fields.Boolean(
        string='FF-11: Returns Portal',
        config_parameter='fashion.ff_11_returns_portal',
    )
    x_ff_12_combo_engine = fields.Boolean(
        string='FF-12: Combo Engine',
        config_parameter='fashion.ff_12_combo_engine',
    )
    x_ff_13_pl_dashboard = fields.Boolean(
        string='FF-13: P&L Dashboard',
        config_parameter='fashion.ff_13_pl_dashboard',
    )
    x_ff_14_ai_catalog = fields.Boolean(
        string='FF-14: AI Personalized Catalog',
        config_parameter='fashion.ff_14_ai_catalog',
    )
    x_ff_15_ghn = fields.Boolean(
        string='FF-15: GHN Delivery',
        config_parameter='fashion.ff_15_ghn',
    )
    x_ff_16_ghtk = fields.Boolean(
        string='FF-16: GHTK Delivery',
        config_parameter='fashion.ff_16_ghtk',
    )
    x_ff_17_vnpay = fields.Boolean(
        string='FF-17: VNPay Payment',
        config_parameter='fashion.ff_17_vnpay',
    )
    x_ff_18_momo = fields.Boolean(
        string='FF-18: MoMo Payment',
        config_parameter='fashion.ff_18_momo',
    )
    x_ff_19_alternate_receiver = fields.Boolean(
        string='FF-19: Alternate Receiver',
        config_parameter='fashion.ff_19_alternate_receiver',
    )
    x_ff_20_gender_title = fields.Boolean(
        string='FF-20: Gender Title',
        config_parameter='fashion.ff_20_gender_title',
    )

    # ── Business Config ─────────────────────────────────────────────────────
    x_coolcash_earn_rate = fields.Float(
        string='CoolCash Earn Rate (%)',
        config_parameter='fashion.coolcash_earn_rate',
        default=7.0,
    )
    x_free_shipping_threshold = fields.Float(
        string='Free Shipping Threshold (VNĐ)',
        config_parameter='fashion.free_shipping_threshold',
        default=350000.0,
    )
    x_coolclub_silver_threshold = fields.Float(
        string='CoolClub Silver Threshold (VNĐ)',
        config_parameter='fashion.coolclub_silver_threshold',
        default=1000000.0,
    )
    x_coolclub_gold_threshold = fields.Float(
        string='CoolClub Gold Threshold (VNĐ)',
        config_parameter='fashion.coolclub_gold_threshold',
        default=3000000.0,
    )
    x_coolclub_diamond_threshold = fields.Float(
        string='CoolClub Diamond Threshold (VNĐ)',
        config_parameter='fashion.coolclub_diamond_threshold',
        default=10000000.0,
    )
    x_referral_reward_referrer = fields.Float(
        string='Referral Reward - Referrer (VNĐ)',
        config_parameter='fashion.referral_reward_referrer',
        default=50000.0,
    )
    x_referral_discount_new_customer = fields.Float(
        string='Referral Discount - New Customer (VNĐ)',
        config_parameter='fashion.referral_discount_new_customer',
        default=50000.0,
    )
    x_max_coolcash_per_order_pct = fields.Float(
        string='Max CoolCash per Order (%)',
        config_parameter='fashion.max_coolcash_per_order_pct',
        default=30.0,
        help='Maximum percentage of order value that can be paid with CoolCash',
    )
    x_zalo_app_id = fields.Char(
        string='Zalo App ID',
        config_parameter='fashion.zalo_app_id',
    )
    x_zalo_app_secret = fields.Char(
        string='Zalo App Secret',
        config_parameter='fashion.zalo_app_secret',
    )
    x_jwt_secret_key = fields.Char(
        string='JWT Secret Key',
        config_parameter='fashion.jwt_secret_key',
    )
    x_jwt_expiry_hours = fields.Integer(
        string='JWT Expiry (hours)',
        config_parameter='fashion.jwt_expiry_hours',
        default=24,
    )
```

**Helper utility** `custom_addons/fashion_store_config/utils/feature_flags.py`:

```python
from odoo import api


def is_enabled(env, flag_key: str) -> bool:
    """Check if a feature flag is enabled via ir.config_parameter."""
    param = env['ir.config_parameter'].sudo().get_param(
        f'fashion.{flag_key}', default='False'
    )
    return param in ('True', '1', 'true')
```

### Task S2-02: Module `fashion_store_product`

**Mục đích:** `_inherit` `product.template` + `product.product` để thêm các trường đặc thù thời trang.

**File:** `custom_addons/fashion_store_product/models/product_template.py`

```python
from odoo import fields, models, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    x_gender_type = fields.Selection(
        selection=[('male', 'Nam'), ('female', 'Nữ'), ('unisex', 'Unisex')],
        string='Giới tính',
        default='unisex',
        index=True,
    )
    x_material = fields.Char(string='Chất liệu', translate=True)
    x_technology = fields.Char(string='Công nghệ', translate=True)
    x_care_instruction = fields.Text(string='Hướng dẫn bảo quản', translate=True)
    x_size_guide_url = fields.Char(string='URL Bảng size')
    x_coolcash_earn_override = fields.Float(
        string='CoolCash Earn Rate Override (%)',
        default=0.0,
        help='0 = dùng global rate. >0 = override riêng cho sản phẩm này',
    )
    x_is_combo = fields.Boolean(string='Là sản phẩm Combo', default=False)
    x_combo_component_ids = fields.Many2many(
        comodel_name='product.product',
        relation='product_combo_component_rel',
        column1='combo_tmpl_id',
        column2='component_product_id',
        string='Thành phần Combo',
    )
    x_combo_cogs = fields.Float(
        string='Giá vốn Combo tổng',
        compute='_compute_combo_cogs',
        store=True,
    )
    x_slug = fields.Char(
        string='URL Slug',
        compute='_compute_slug',
        store=True,
        index=True,
    )

    @api.depends('x_combo_component_ids', 'x_combo_component_ids.standard_price')
    def _compute_combo_cogs(self):
        for tmpl in self:
            if tmpl.x_is_combo:
                tmpl.x_combo_cogs = sum(
                    c.standard_price for c in tmpl.x_combo_component_ids
                )
            else:
                tmpl.x_combo_cogs = 0.0

    @api.depends('name')
    def _compute_slug(self):
        import re
        import unicodedata
        for tmpl in self:
            if tmpl.name:
                nfkd = unicodedata.normalize('NFKD', tmpl.name)
                ascii_str = nfkd.encode('ascii', 'ignore').decode('ascii')
                slug = re.sub(r'[^a-z0-9]+', '-', ascii_str.lower()).strip('-')
                tmpl.x_slug = slug
            else:
                tmpl.x_slug = ''
```

### Task S2-03: Module `fashion_store_sale`

**Mục đích:** `_inherit` `sale.order` + `sale.order.line` để hỗ trợ CoolCash, Referral, Smart Routing, và Alternate Receiver.

**File:** `custom_addons/fashion_store_sale/models/sale_order.py`

```python
from odoo import fields, models, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # FF-20: Gender title cho giao tiếp
    x_gender_title = fields.Selection(
        selection=[('anh', 'Anh'), ('chi', 'Chị'), ('ban', 'Bạn')],
        string='Xưng hô',
        default='ban',
    )
    # FF-19: Alternate Receiver
    x_alternate_receiver_name = fields.Char(string='Tên người nhận khác')
    x_alternate_receiver_phone = fields.Char(string='SĐT người nhận khác')
    # CoolCash
    x_coolcash_amount_used = fields.Float(string='CoolCash đã dùng', default=0.0)
    x_coolcash_earned = fields.Float(
        string='CoolCash sẽ nhận', compute='_compute_coolcash_earned', store=True
    )
    # Referral
    x_referral_code = fields.Char(string='Mã Referral', index=True)
    x_referral_code_id = fields.Many2one('referral.code', string='Referral Code Record')
    x_referral_discount = fields.Float(string='Giảm giá Referral', default=0.0)
    # Smart Routing (FF-10)
    x_is_split_order = fields.Boolean(string='Đơn hàng tách kho', default=False)
    x_parent_order_id = fields.Many2one('sale.order', string='Đơn gốc')
    x_child_order_ids = fields.One2many(
        'sale.order', 'x_parent_order_id', string='Đơn tách'
    )
    x_routed_warehouse_id = fields.Many2one('stock.warehouse', string='Kho được chọn')
    x_routing_score = fields.Float(string='Routing Score', digits=(6, 2))
    # Returns
    x_return_request_ids = fields.One2many(
        'fashion.return.request', 'order_id', string='Yêu cầu đổi trả'
    )

    @api.depends('order_line.price_subtotal', 'x_coolcash_amount_used')
    def _compute_coolcash_earned(self):
        ICP = self.env['ir.config_parameter'].sudo()
        default_rate = float(ICP.get_param('fashion.coolcash_earn_rate', '7.0'))
        ff_coolcash = ICP.get_param('fashion.ff_06_coolcash', 'False')
        for order in self:
            if ff_coolcash not in ('True', '1', 'true'):
                order.x_coolcash_earned = 0.0
                continue
            taxable = order.amount_total - order.x_coolcash_amount_used
            order.x_coolcash_earned = round(taxable * default_rate / 100, 0)


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    x_is_combo_component = fields.Boolean(default=False)
    x_is_combo_header = fields.Boolean(default=False)
    x_parent_combo_line_id = fields.Many2one('sale.order.line', string='Combo Header')
```

### Checklist S2

- [x] `fashion_store_config` — 20 FF + 8 business params, `is_enabled()` helper, config_defaults.xml (`noupdate="1"`)
- [x] FF Boolean storage dùng `'1'`/`'0'` (Odoo canonical) — CRITICAL fix applied
- [x] `_check_jwt_secret_key` constraint (min 32 chars khi FF-09 on)
- [x] `fashion_store_product` — gender/material/technology/care/size_guide fields
- [x] CoolCash per-product override (`x_coolcash_earn_override`)
- [x] Combo/bundle fields + `_compute_combo_cogs` với logging warnings
- [x] `x_slug` computed + stored + UNIQUE SQL constraint + copy=False + collision suffix
- [x] `fashion_store_sale` — alternate receiver fields, coolcash earned compute, referral, routing, return links
- [x] `@api.depends('order_line.price_subtotal', …)` — HIGH fix (One2many field-level tracking)
- [x] `_check_combo_parent_same_order` ORM constraint
- [x] `fashionos_base` health + catalog API updated (runtime guard cho optional fashion fields)

---

## Sprint 3 — OCA REST Framework + ShopInvader (4 ngày) ✅ COMPLETE — 2026-05-26

> **Divergence from plan:** Implemented as custom `fashion_store_api` Odoo module using
> Python stdlib JWT (hmac/hashlib HS256) instead of OCA FastAPI/ShopInvader, which are
> Odoo 16/17 optional dependencies not needed for a standalone headless API.
> All 15 REST endpoints are fully implemented and committed (commit e6f482c).
> Code-reviewer HIGH issues fixed: guarded int/float casts, price filters in ORM domain,
> parse_body() raises ValueError on malformed JSON.

### Task S3-01: Cài Layer 1 — OCA REST Framework

```bash
# Cài thứ tự đúng
docker exec -it fashion_odoo odoo \
  --database=odoo_fashion \
  --init=fastapi \
  --stop-after-init

docker exec -it fashion_odoo odoo \
  --database=odoo_fashion \
  --init=fastapi_auth_jwt,fastapi_auth_partner_jwt \
  --stop-after-init

# Verify: FastAPI endpoint docs accessible
# GET http://localhost:8069/api/docs
```

> **Lưu ý Odoo v19:** `fastapi_auth_partner_jwt` đọc `JWT_SECRET_KEY` từ `ir.config_parameter` key `fastapi_auth_jwt.secret_key`. Cần set giá trị này trước khi test auth.

```python
# Via Odoo shell để set JWT secret:
env['ir.config_parameter'].sudo().set_param(
    'fastapi_auth_jwt.secret_key', 
    'your-super-secret-key-change-in-production'
)
```

### Task S3-02: Cài Layer 2 — ShopInvader Suite

```bash
# Cài theo thứ tự dependency
for module in shopinvader shopinvader_product shopinvader_category \
              shopinvader_cart shopinvader_sale shopinvader_partner \
              shopinvader_delivery shopinvader_wishlist; do
  docker exec -it fashion_odoo odoo \
    --database=odoo_fashion \
    --init=$module \
    --stop-after-init
  echo "Installed: $module"
done
```

### Task S3-03: Tạo ShopInvader Backend record

**UI:** ShopInvader → Backend → Create

```
Name: Fashion Store Backend
Company: Fashion Store Vietnam
Default URL: http://localhost:3000
Allowed Origins: http://localhost:3000, https://fashionstore.vn
```

**Verify ShopInvader endpoints:**
```bash
# Test catalog
curl http://localhost:8069/shopinvader/products | python -m json.tool

# Test auth (register)
curl -X POST http://localhost:8069/shopinvader/customer/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "Test@1234"}'
```

### Task S3-04: Verify API Auth Flow

```bash
# 1. Login → nhận JWT
TOKEN=$(curl -s -X POST http://localhost:8069/shopinvader/customer/sign_in \
  -H "Content-Type: application/json" \
  -d '{"login": "test@example.com", "password": "Test@1234"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "JWT: $TOKEN"

# 2. Dùng JWT để lấy profile
curl http://localhost:8069/shopinvader/customer \
  -H "Authorization: Bearer $TOKEN"

# 3. Test catalog với auth
curl http://localhost:8069/shopinvader/products \
  -H "Authorization: Bearer $TOKEN"
```

### Checklist S3

- [ ] `fastapi` cài xong, `/api/docs` accessible
- [ ] `fastapi_auth_partner_jwt` cài xong
- [ ] JWT secret set trong `ir.config_parameter`
- [ ] ShopInvader suite (8 modules) cài xong
- [ ] ShopInvader Backend record tạo xong
- [ ] `POST /shopinvader/customer/register` trả 200
- [ ] `POST /shopinvader/customer/sign_in` trả JWT token
- [ ] `GET /shopinvader/products` trả product list
- [ ] `GET /shopinvader/cart` trả empty cart khi dùng JWT

---

## Sprint 4 — CoolCash + CoolClub + Referral (5 ngày)

### Task S4-01: Module `coolcash`

**Models cần implement:** `coolcash.wallet`, `coolcash.transaction`

**File:** `custom_addons/coolcash/models/coolcash_wallet.py`

```python
from odoo import fields, models, api
from odoo.exceptions import ValidationError


class CoolcashWallet(models.Model):
    _name = 'coolcash.wallet'
    _description = 'CoolCash Wallet'

    partner_id = fields.Many2one(
        'res.partner', required=True, ondelete='cascade', index=True
    )
    balance = fields.Float(
        string='Số dư CoolCash', compute='_compute_balance', store=True
    )
    lifetime_earned = fields.Float(string='Tổng CoolCash đã tích lũy', default=0.0)
    transaction_ids = fields.One2many(
        'coolcash.transaction', 'wallet_id', string='Lịch sử'
    )

    _sql_constraints = [
        ('partner_uniq', 'unique(partner_id)', 'Mỗi khách hàng chỉ có 1 ví CoolCash'),
    ]

    @api.depends('transaction_ids.amount', 'transaction_ids.state')
    def _compute_balance(self):
        for wallet in self:
            confirmed = wallet.transaction_ids.filtered(
                lambda t: t.state == 'done'
            )
            wallet.balance = sum(confirmed.mapped('amount'))

    def credit(self, amount: float, order=None, reason: str = 'earn') -> 'coolcash.transaction':
        """Thêm CoolCash vào ví."""
        self.ensure_one()
        if amount <= 0:
            raise ValidationError('Số CoolCash credit phải > 0')
        tx = self.env['coolcash.transaction'].create({
            'wallet_id': self.id,
            'amount': amount,
            'type': reason,
            'order_id': order.id if order else False,
            'state': 'done',
        })
        self.lifetime_earned += amount
        return tx

    def debit(self, amount: float, order=None) -> 'coolcash.transaction':
        """Trừ CoolCash từ ví."""
        self.ensure_one()
        if amount <= 0:
            raise ValidationError('Số CoolCash debit phải > 0')
        if self.balance < amount:
            raise ValidationError(
                f'Số dư không đủ. Hiện có {self.balance:,.0f} CoolCash, cần {amount:,.0f}'
            )
        return self.env['coolcash.transaction'].create({
            'wallet_id': self.id,
            'amount': -amount,
            'type': 'spend',
            'order_id': order.id if order else False,
            'state': 'done',
        })

    @api.model
    def get_or_create_wallet(self, partner) -> 'CoolcashWallet':
        wallet = self.search([('partner_id', '=', partner.id)], limit=1)
        if not wallet:
            wallet = self.create({'partner_id': partner.id})
        return wallet
```

**File:** `custom_addons/coolcash/models/coolcash_transaction.py`

```python
from odoo import fields, models


class CoolcashTransaction(models.Model):
    _name = 'coolcash.transaction'
    _description = 'CoolCash Transaction'
    _order = 'create_date desc'

    wallet_id = fields.Many2one('coolcash.wallet', required=True, ondelete='cascade')
    amount = fields.Float(
        string='Số CoolCash',
        help='Dương = credit (thêm vào), Âm = debit (trừ đi)',
    )
    type = fields.Selection(
        selection=[
            ('earn', 'Tích lũy từ đơn hàng'),
            ('spend', 'Sử dụng khi mua hàng'),
            ('expire', 'Hết hạn'),
            ('refund', 'Hoàn trả từ đổi trả hàng'),
            ('bonus', 'Thưởng thủ công'),
            ('referral_reward', 'Thưởng giới thiệu bạn bè'),
        ],
        required=True,
    )
    order_id = fields.Many2one('sale.order', string='Đơn hàng liên quan')
    reference = fields.Char(string='Mã tham chiếu')
    expiry_date = fields.Date(string='Ngày hết hạn')
    state = fields.Selection(
        selection=[('pending', 'Chờ xác nhận'), ('done', 'Hoàn tất'), ('cancelled', 'Huỷ')],
        default='done',
    )
    note = fields.Text(string='Ghi chú')
```

**FastAPI endpoint** `custom_addons/coolcash/routers/coolcash_router.py`:

```python
from typing import Annotated
from fastapi import APIRouter, Depends
from odoo.addons.fastapi_auth_partner_jwt.dependencies import authenticated_partner

router = APIRouter(prefix='/api/coolcash', tags=['CoolCash'])


@router.get('/balance')
def get_balance(partner=Depends(authenticated_partner)):
    env = partner.env
    wallet = env['coolcash.wallet'].sudo().get_or_create_wallet(partner)
    pending = wallet.transaction_ids.filtered(lambda t: t.state == 'pending')
    return {
        'balance': wallet.balance,
        'pending': sum(pending.mapped('amount')),
        'lifetime_earned': wallet.lifetime_earned,
        'transactions': [
            {
                'id': t.id,
                'amount': t.amount,
                'type': t.type,
                'date': t.create_date.isoformat(),
                'order_ref': t.order_id.name if t.order_id else None,
            }
            for t in wallet.transaction_ids[:20]
        ],
    }


@router.post('/validate-spend')
def validate_spend(data: dict, partner=Depends(authenticated_partner)):
    env = partner.env
    coolcash_amount = data.get('coolcash_amount', 0)
    order_total = data.get('order_total', 0)
    ICP = env['ir.config_parameter'].sudo()
    max_pct = float(ICP.get_param('fashion.max_coolcash_per_order_pct', '30'))
    max_allowed = round(order_total * max_pct / 100, 0)
    wallet = env['coolcash.wallet'].sudo().get_or_create_wallet(partner)
    actual = min(coolcash_amount, wallet.balance, max_allowed)
    return {
        'valid': True,
        'coolcash_applied': actual,
        'max_allowed': max_allowed,
        'current_balance': wallet.balance,
    }
```

### Task S4-02: Module `coolclub`

**Models:** `coolclub.tier`, `coolclub.membership`, `coolclub.tier.history`

**Tier data** `custom_addons/coolclub/data/coolclub_tiers.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo noupdate="1">
  <record id="tier_bronze" model="coolclub.tier">
    <field name="name">Bronze</field>
    <field name="threshold">0</field>
    <field name="sequence">10</field>
    <field name="coolcash_earn_rate">7.0</field>
    <field name="free_shipping_threshold">350000</field>
    <field name="birthday_bonus">50000</field>
    <field name="early_access">False</field>
    <field name="color_code">#CD7F32</field>
  </record>
  <record id="tier_silver" model="coolclub.tier">
    <field name="name">Silver</field>
    <field name="threshold">1000000</field>
    <field name="sequence">20</field>
    <field name="coolcash_earn_rate">8.0</field>
    <field name="free_shipping_threshold">0</field>
    <field name="birthday_bonus">100000</field>
    <field name="early_access">False</field>
    <field name="color_code">#C0C0C0</field>
  </record>
  <record id="tier_gold" model="coolclub.tier">
    <field name="name">Gold</field>
    <field name="threshold">3000000</field>
    <field name="sequence">30</field>
    <field name="coolcash_earn_rate">10.0</field>
    <field name="free_shipping_threshold">0</field>
    <field name="birthday_bonus">200000</field>
    <field name="early_access">True</field>
    <field name="color_code">#FFD700</field>
  </record>
  <record id="tier_diamond" model="coolclub.tier">
    <field name="name">Diamond</field>
    <field name="threshold">10000000</field>
    <field name="sequence">40</field>
    <field name="coolcash_earn_rate">12.0</field>
    <field name="free_shipping_threshold">0</field>
    <field name="birthday_bonus">500000</field>
    <field name="early_access">True</field>
    <field name="color_code">#B9F2FF</field>
  </record>
</odoo>
```

**Cron job** — tự động review tier hàng tuần:

```xml
<record id="cron_coolclub_tier_review" model="ir.cron">
  <field name="name">CoolClub: Review Tier Weekly</field>
  <field name="model_id" ref="model_coolclub_membership"/>
  <field name="state">code</field>
  <field name="code">model._cron_review_all_tiers()</field>
  <field name="interval_number">1</field>
  <field name="interval_type">weeks</field>
  <field name="numbercall">-1</field>
  <field name="active">True</field>
</record>
```

### Task S4-03: Module `referral`

**Model:** `referral.code`, `referral.reward.log`

**Auto-generate referral code khi partner tạo mới:**

```python
class ReferralCode(models.Model):
    _name = 'referral.code'
    _description = 'Referral Code'

    partner_id = fields.Many2one('res.partner', required=True, ondelete='cascade')
    code = fields.Char(required=True, index=True)
    is_active = fields.Boolean(default=True)
    total_referred = fields.Integer(compute='_compute_stats', store=True)
    total_earned = fields.Float(compute='_compute_stats', store=True)
    reward_log_ids = fields.One2many('referral.reward.log', 'referrer_id')

    _sql_constraints = [
        ('code_uniq', 'unique(code)', 'Referral code phải là duy nhất'),
        ('partner_uniq', 'unique(partner_id)', 'Mỗi khách hàng chỉ có 1 referral code'),
    ]

    @api.model
    def _generate_code(self, partner_id: int) -> str:
        import hashlib
        raw = f'REF-{partner_id}-{self.env.cr.now()}'
        return 'REF-' + hashlib.md5(raw.encode()).hexdigest()[:6].upper()

    @api.model
    def get_or_create_code(self, partner) -> 'ReferralCode':
        code_record = self.search([('partner_id', '=', partner.id)], limit=1)
        if not code_record:
            code_record = self.create({
                'partner_id': partner.id,
                'code': self._generate_code(partner.id),
            })
        return code_record
```

### Checklist S4

- [ ] `coolcash` cài xong
- [ ] `CoolcashWallet.credit(100000)` hoạt động đúng
- [ ] `CoolcashWallet.debit(200000)` raise lỗi nếu balance < 200000
- [ ] `GET /api/coolcash/balance` trả đúng JSON
- [ ] `POST /api/coolcash/validate-spend` enforce max_pct=30%
- [ ] `coolclub` cài xong, 4 tier records tạo xong
- [ ] Cron `_cron_review_all_tiers` có thể trigger thủ công
- [ ] `referral` cài xong
- [ ] Referral code auto-generate dạng `REF-XXXXXX`
- [ ] `POST /api/referral/validate` với code hợp lệ trả `discount_amount = 50000`

---

## Sprint 5 — Payment Gateways + Delivery (5 ngày)

### Task S5-01: Module `payment_vnpay`

**VNPay Integration Architecture:**
```
Frontend → POST /api/payment/vnpay/create
         → Odoo tạo payment.transaction (state=draft)
         → Build VNPay redirect URL với HMAC-SHA512
         → Return { payment_url }

User → VNPay payment page
     → VNPay redirect về frontend với params
     → Frontend gọi POST /api/payment/vnpay/verify

POST /api/payment/vnpay/verify
     → Verify HMAC-SHA512 signature
     → Cập nhật payment.transaction (state=done/failed)
     → Nếu done: confirm sale.order + credit CoolCash
```

**HMAC-SHA512 signature build:**

```python
import hashlib
import hmac
from urllib.parse import urlencode, quote_plus

def build_vnpay_url(params: dict, secret: str) -> str:
    sorted_params = sorted(params.items())
    query_string = urlencode(sorted_params, quote_via=quote_plus)
    signature = hmac.new(
        secret.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    return f"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?{query_string}&vnp_SecureHash={signature}"
```

> **Sandbox credentials:** Lấy từ `https://sandbox.vnpayment.vn/devreg/`

### Task S5-02: Module `delivery_ghn`

**GHN Webhook Handler** (nhận tracking updates):

```python
from fastapi import APIRouter, Request
import hmac, hashlib

router = APIRouter(prefix='/api/webhook/ghn', tags=['GHN Webhook'])

@router.post('/tracking')
async def ghn_tracking_webhook(request: Request):
    payload = await request.json()
    # Verify GHN signature
    token = request.headers.get('Token', '')
    # Update stock.picking state based on GHN order status code
    status_map = {
        'picking': 'Đang lấy hàng',
        'delivering': 'Đang giao',
        'delivered': 'Đã giao',
        'return': 'Đang hoàn hàng',
    }
    return {'status': 'ok'}
```

### Task S5-03: Module `payment_momo`

**MoMo IPN verification (HMAC-SHA256):**

```python
def verify_momo_ipn(data: dict, secret_key: str) -> bool:
    fields = ['accessKey', 'amount', 'extraData', 'message', 'orderId',
              'orderInfo', 'orderType', 'partnerCode', 'payType',
              'requestId', 'responseTime', 'resultCode', 'transId']
    raw = '&'.join(f'{k}={data.get(k, "")}' for k in sorted(fields))
    expected = hmac.new(
        secret_key.encode(), raw.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, data.get('signature', ''))
```

### Checklist S5

- [ ] `payment_vnpay` — HMAC-SHA512 signature test pass
- [ ] VNPay sandbox redirect URL tạo được
- [ ] VNPay webhook verify + cập nhật `payment.transaction`
- [ ] `payment_momo` — HMAC-SHA256 verify test pass
- [ ] `delivery_ghn` — GHN webhook nhận tracking update
- [ ] `delivery_ghtk` — GHTK create shipment API working
- [ ] `sale_return_api` — `fashion.return.request` model tồn tại

---

## Sprint 6 — Killer Features (6 ngày)

### Task S6-01: KF-1 Automated Returns Portal (`fashion_store_return`)

**Luồng chính:**
```
POST /api/returns/create
  → Tạo fashion.return.request (state=draft)
  → action_approve_and_schedule_pickup()
    → Tạo stock.return.picking từ đơn hàng gốc
    → GHN._create_reverse_pickup(picking)
    → state=approved, gửi email thông báo khách
  → GHN webhook callback
    → state=shipped
  → stock.picking.validate()
    → state=done
    → Tạo coolcash.transaction (type=refund)
```

**Test case:** Đặt đơn → confirm → request return → verify CoolCash hoàn trả đúng số tiền

### Task S6-02: KF-2 Smart Routing (`fashion_store_routing`)

**Algorithm:**
```python
def _compute_optimal_route(self):
    province = self.partner_shipping_id.state_id
    rules = self.env['fashion.warehouse.rule'].search(
        [('coverage_province_ids', 'in', province.id)],
        order='priority asc'
    )
    for rule in rules:
        stock_check = self._check_stock_at_warehouse(rule.warehouse_id)
        if stock_check['all_available']:
            return self._assign_warehouse(rule.warehouse_id)
    # Không kho nào đủ hàng → tách đơn
    return self._split_order_by_warehouse(rules)
```

**Test case:** Đặt đơn từ địa chỉ Hà Nội → verify routing về Kho HN

### Task S6-03: KF-3 Combo Engine (`fashion_store_combo`)

**Hook vào `action_confirm`:**
```python
def action_confirm(self):
    result = super().action_confirm()
    self._expand_combo_lines()
    return result

def _expand_combo_lines(self):
    combo_lines = self.order_line.filtered(
        lambda l: l.product_id.product_tmpl_id.x_is_combo
    )
    for line in combo_lines:
        tmpl = line.product_id.product_tmpl_id
        for component in tmpl.x_combo_component_ids:
            self.order_line.create({
                'order_id': self.id,
                'product_id': component.id,
                'product_uom_qty': line.product_uom_qty,
                'price_unit': 0,
                'x_is_combo_component': True,
                'x_parent_combo_line_id': line.id,
            })
        line.x_is_combo_header = True
```

**Test case:** Tạo combo COMBO-SUM-001 → confirm order → verify 2 component lines được tạo với `price_unit=0`

### Task S6-04: KF-4 P&L Dashboard (`fashion_store_dashboard`)

**SQL aggregate query:**
```python
def get_hourly_pl(self, date_from, date_to):
    query = """
        SELECT
            DATE_TRUNC('hour', so.date_order) AS hour,
            SUM(so.amount_total - COALESCE(so.x_coolcash_amount_used, 0)) AS gross_revenue,
            SUM(scl.price_subtotal) AS shipping_cost,
            COUNT(so.id) AS order_count,
            SUM(svl.value) AS cogs
        FROM sale_order so
        LEFT JOIN delivery_carrier dc ON dc.id = so.carrier_id
        LEFT JOIN sale_order_line scl ON scl.order_id = so.id
            AND scl.is_delivery = TRUE
        LEFT JOIN stock_valuation_layer svl ON svl.stock_move_id IN (
            SELECT sm.id FROM stock_move sm
            JOIN stock_picking sp ON sp.id = sm.picking_id
            WHERE sp.sale_id = so.id
        )
        WHERE so.state IN ('sale', 'done')
          AND so.date_order BETWEEN %s AND %s
        GROUP BY DATE_TRUNC('hour', so.date_order)
        ORDER BY hour
    """
    self.env.cr.execute(query, [date_from, date_to])
    return self.env.cr.dictfetchall()
```

### Task S6-05: KF-5 AI Catalog (`fashion_store_ai_catalog`)

**Collaborative filtering MVP:**
```python
def generate_recommendations(self, partner):
    # Lấy purchase history
    purchased = self.env['sale.order.line'].sudo().search([
        ('order_id.partner_id', '=', partner.id),
        ('order_id.state', 'in', ['sale', 'done']),
    ])
    purchased_tmpl_ids = purchased.mapped('product_id.product_tmpl_id.id')

    if not purchased_tmpl_ids:
        # Cold start: trả trending products
        return self._get_trending_products()

    # Tìm customers đã mua cùng sản phẩm
    similar_customers = self.env['sale.order.line'].sudo().search([
        ('product_id.product_tmpl_id', 'in', purchased_tmpl_ids),
        ('order_id.partner_id', '!=', partner.id),
        ('order_id.state', 'in', ['sale', 'done']),
    ]).mapped('order_id.partner_id')

    # Sản phẩm họ đã mua nhưng partner chưa mua
    recommendations = self.env['sale.order.line'].sudo().search([
        ('order_id.partner_id', 'in', similar_customers.ids),
        ('product_id.product_tmpl_id', 'not in', purchased_tmpl_ids),
        ('order_id.state', 'in', ['sale', 'done']),
    ])

    # Rank theo frequency
    from collections import Counter
    freq = Counter(recommendations.mapped('product_id.product_tmpl_id.id'))
    top_ids = [pid for pid, _ in freq.most_common(20)]
    return self.env['product.template'].browse(top_ids)
```

### Checklist S6

- [ ] KF-1: Return request → CoolCash hoàn trả end-to-end
- [ ] KF-2: Order từ Hà Nội → routing về Kho HN
- [ ] KF-3: Combo order confirm → 2 component lines tạo với price=0
- [ ] KF-4: P&L aggregate query trả đúng số liệu
- [ ] KF-5: Recommendation cho new user → trending products (cold start OK)
- [ ] KF-5: Recommendation cho user có 5+ đơn → collaborative filtering

---

## Sprint 7 — Next.js Frontend (7 ngày)

### Task S7-01: Project scaffold

```bash
cd frontend
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# Install API client và state management
pnpm add axios @tanstack/react-query zustand
pnpm add -D @types/node
```

### Task S7-02: API Client Layer

**File:** `frontend/src/lib/api-client.ts`

```typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8069',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Task S7-03: Core Pages

| Page | Route | API calls |
|------|-------|-----------|
| Homepage | `/` | `GET /shopinvader/products?featured=true` |
| Catalog | `/products` | `GET /shopinvader/products` + filters |
| Product Detail | `/products/[slug]` | `GET /api/catalog/products/{slug}` |
| Cart | `/cart` | `GET /api/cart` |
| Checkout | `/checkout` | `POST /api/checkout/confirm` |
| Order Success | `/orders/[id]` | `GET /api/orders/{id}` |
| Account | `/account` | `GET /shopinvader/customer` |
| CoolCash | `/account/coolcash` | `GET /api/coolcash/balance` |
| Returns | `/account/returns` | `POST /api/returns/create` |

### Task S7-04: Auth Flow

```typescript
// src/lib/auth.ts
export async function login(email: string, password: string) {
  const res = await apiClient.post('/shopinvader/customer/sign_in', {
    login: email,
    password,
  })
  localStorage.setItem('auth_token', res.data.token)
  return res.data
}

export async function loginWithZalo(code: string) {
  const res = await apiClient.post('/api/auth/zalo', { code })
  localStorage.setItem('auth_token', res.data.token)
  return res.data
}
```

### Checklist S7

- [ ] `pnpm dev` → Next.js chạy trên port 3000
- [ ] CORS giữa Next.js (3000) và Odoo (8069) được cấu hình
- [ ] Login form → nhận JWT → store vào localStorage
- [ ] Catalog page hiển thị sản phẩm từ ShopInvader API
- [ ] Product detail page có variant picker (size/color)
- [ ] Add to cart → `POST /api/cart/add` → cart count update
- [ ] Checkout form → submit → `POST /api/checkout/confirm` → redirect VNPay
- [ ] Order success page sau khi VNPay callback

---

## Sprint 8 — QA & Final Documentation (3 ngày)

### Task S8-01: API Integration Tests

**Tối thiểu phải có test cho:**
```python
# tests/test_coolcash.py
def test_wallet_credit_debit():
def test_coolcash_earn_on_order_confirm():
def test_coolcash_max_per_order_limit():

# tests/test_referral.py
def test_referral_code_uniqueness():
def test_referral_first_order_only():
def test_referral_reward_credit():

# tests/test_routing.py
def test_hn_address_routes_to_hn_warehouse():
def test_insufficient_stock_triggers_split():

# tests/test_combo.py
def test_combo_expand_on_confirm():
def test_combo_cogs_calculation():
```

### Task S8-02: Performance Check

```bash
# Kiểm tra response time của các API critical path
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8069/shopinvader/products

# Target: < 500ms p95 cho catalog endpoints
# Target: < 200ms p95 cho cart GET
```

### Task S8-03: Security Checklist

- [ ] JWT secret key NOT hardcoded — lấy từ `ir.config_parameter`
- [ ] VNPay/MoMo HMAC secrets NOT in code — lấy từ config
- [ ] Zalo App Secret NOT in code
- [ ] SQL queries dùng parameterized (không string concat)
- [ ] Webhook endpoints verify signature trước khi xử lý
- [ ] Rate limiting trên auth endpoints

### Task S8-04: Update Documentation

```bash
# Update MEMORY.md với trạng thái cuối cùng
# Update module-mapping.md nếu có thay đổi
# Tạo CHANGELOG.md

# Commit all docs
git add docs/
git commit -m "docs: Phase 6 implementation plan complete"
```

---

## Dependency Matrix — Thứ tự cài đặt bắt buộc

```
fashion_store_config          (không deps custom)
    ↓
fashion_store_product         (← fashion_store_config)
fashion_store_sale            (← fashion_store_config)
    ↓
fastapi + fastapi_auth_jwt + fastapi_auth_partner_jwt
    ↓
shopinvader suite (8 modules)
    ↓
coolcash                      (← fashion_store_config, fashion_store_sale)
coolclub                      (← coolcash)
referral                      (← fashion_store_config, coolcash)
fastapi_auth_zalo             (← fashion_store_config)
    ↓
payment_vnpay                 (← fashion_store_sale)
payment_momo                  (← fashion_store_sale)
payment_zalopay               (← fashion_store_sale)
delivery_ghn                  (← fashion_store_sale)
delivery_ghtk                 (← fashion_store_sale)
sale_return_api               (← fashion_store_sale, coolcash)
    ↓
fashion_store_return          (← sale_return_api, delivery_ghn, delivery_ghtk)
fashion_store_routing         (← fashion_store_sale, fashion_store_config)
fashion_store_combo           (← fashion_store_product, fashion_store_sale)
fashion_store_dashboard       (← tất cả Layer 4)
fashion_store_ai_catalog      (← fashion_store_product, fashion_store_sale)
```

---

## Tóm tắt Deliverables

| # | Deliverable | Sprint |
|---|-------------|--------|
| 1 | Docker Compose stack running | S0 |
| 2 | Master Data: Size/Color/Warehouse | S1 |
| 3 | 3 Foundation modules (Layer 3) | S2 |
| 4 | OCA FastAPI + ShopInvader API live | S3 |
| 5 | CoolCash wallet + API | S4 |
| 6 | CoolClub 4-tier membership | S4 |
| 7 | Referral system | S4 |
| 8 | VNPay + MoMo + ZaloPay | S5 |
| 9 | GHN + GHTK delivery | S5 |
| 10 | 5 Killer Features modules | S6 |
| 11 | Next.js storefront | S7 |
| 12 | 80%+ test coverage | S8 |
| 13 | Security audit passed | S8 |

---

*Phase 6 Implementation Plan — Fashion Store eCommerce Odoo v19*  
*Tài liệu cập nhật lần cuối: 2026-05-26*
