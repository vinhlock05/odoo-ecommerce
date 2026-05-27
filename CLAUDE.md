# CLAUDE.md — FashionOS eCommerce Project

> Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho mọi AI assistant và developer làm việc với repo này.
> Đọc kỹ trước khi code bất cứ thứ gì.

---
## Subagents

Spawn subagents to isolate context, parallelize independent work, or offload bulk mechanical tasks. Don't spawn when the parent needs the reasoning, when synthesis requires holding things together, or when spawn overhead dominates.

Pick the cheapest model that can do the subtask well:
- Haiku: bulk mechanical work, no judgment
- Sonnet: scoped research, code exploration, in-scope synthesis
- Opus: subtasks needing real planning or tradeoffs

If a subagent realizes it needs a higher tier than itself, return to the parent.

Parent owns final output and cross-spawn synthesis. User instructions override.

## Preferred Tools

### Data Fetching

1. **WebFetch**: free, text-only, works on public pages that don't block bots.
2. **agent-browser CLI**: free, local Rust CLI + Chrome via CDP. For dynamic pages or auth walls that WebFetch can't handle. Returns the accessibility tree with element refs (@e1, @e2). ~82% fewer tokens than screenshot-based tools. Install: `npm i -g agent-browser && agent-browser install`. Use `snapshot` for AI-friendly DOM state, element refs for interaction.
3. **Notice recurring fetch patterns and propose wrapping them as dedicated tools.** When the same fetch/parse logic comes up more than once, suggest wrapping it as a named tool (e.g. a skill file or a .py script that calls `agent-browser` with the snapshot and extraction steps baked in for that source). Add the entry to `## Dedicated Tools` below and reference it by name on future calls.

### PDF Files

Use 'pdftotext', not the 'Read' tool. Use 'Read' only when the user directly asks to analyze images or charts inside the document. Read loads PDFs as images.

## Dedicated Tools

## 🚨 CRITICAL RULES — ĐỌC TRƯỚC KHI LÀM BẤT CỨ THỨ GÌ

### 1. ODOO VERSION = 19, KHÔNG PHẢI 17
- Docker image: `odoo:19.0`
- Mọi tài liệu/code nói v17 là **SAI**
- ✅ **FIXED**: Tất cả 5 module manifest đã được cập nhật lên `'version': '19.0.1.0.0'`

### 2. KHÔNG TỰ BUILD LẠI NHỮNG GÌ ĐÃ CÓ (Don't reinvent the wheel)
Trước khi code bất cứ feature nào:
1. **Tìm OCA package trước** — https://github.com/OCA
2. **Tìm thư viện PyPI/npm trước**
3. Chỉ tự code khi không có giải pháp phù hợp

### 3. SPRINT 3 — CUSTOM JWT IMPLEMENTATION (GIỮ NGUYÊN, KHÔNG REDO)
- Module `fashion_store_api` dùng custom JWT + HTTP controllers — đây là **lựa chọn đúng cho Odoo 19**
- **Lý do:** OCA/rest-framework chỉ có branch đến 17.0, chưa hỗ trợ Odoo 19. ShopInvader tương tự.
- Khi OCA ra branch 19.0 thì mới xem xét migrate, không redo bây giờ.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Tên dự án** | FashionOS — Headless Fashion eCommerce |
| **Model** | Odoo 19 (backend API) + Next.js (frontend) |
| **DB** | PostgreSQL 16 |
| **DB name** | `fashionos` |
| **Odoo port** | `8069` |
| **Frontend port** | `3000` (dev) |
| **Target brand** | Fashion store dạng Coolmate/Gymbody |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Next.js Frontend (frontend/fashionos-web/)  │
│  TypeScript + Tailwind CSS + Next.js 15  │
└───────────────┬─────────────────────────┘
                │ REST API calls
                │ /fashionos/api/v1/*
                ▼
┌─────────────────────────────────────────┐
│  Odoo 19 (backend)                       │
│  Port 8069                               │
│  Addons: backend/addons/                 │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  OCA Layer (PLANNED, not done)  │    │
│  │  - rest-framework / fastapi     │    │
│  │  - shopinvader                  │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  Custom Addons                  │    │
│  │  - fashionos_base               │    │
│  │  - fashion_store_config         │    │
│  │  - fashion_store_product        │    │
│  │  - fashion_store_sale           │    │
│  │  - fashion_store_api (WRONG)    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  PostgreSQL 16                           │
│  DB: fashionos                           │
└─────────────────────────────────────────┘
```

---

## Docker Setup

**File:** `docker-compose.yml`

```yaml
# Odoo 19 — KHÔNG phải v17
image: odoo:19.0

# Custom addons mount point
volumes:
  - ./backend/addons:/mnt/extra-addons

# DB config
POSTGRES_DB: fashionos
POSTGRES_USER: odoo
POSTGRES_PASSWORD: odoo_secret

# Dev mode — auto-reload Python
command: odoo --dev=all
```

**Khởi động:**
```bash
docker compose up -d        # start
docker compose logs -f odoo # xem log
docker compose down         # stop
```

**Cài/update module:**
```bash
# Cài module mới
docker compose exec odoo odoo -d fashionos --init=fashion_store_api --stop-after-init

# Update module đã cài
docker compose exec odoo odoo -d fashionos --update=fashion_store_api --stop-after-init
```

---

## Module Structure

### Addons path: `backend/addons/`

Tất cả custom modules nằm tại `backend/addons/`, được mount vào container tại `/mnt/extra-addons`.

### Module list

| Module | Status | Depends | Mô tả |
|--------|--------|---------|-------|
| `fashionos_base` | ✅ Active | `product`, `sale` | Base module, health check endpoint, tiền đề cho mọi module khác |
| `fashion_store_config` | ✅ Active | `base`, `mail` | Feature flags (FF-01..FF-20), business config, lưu trong `ir.config_parameter` |
| `fashion_store_product` | ✅ Active | `product`, `fashion_store_config` | Fashion product fields, master data (sizes, colors, categories) |
| `fashion_store_sale` | ✅ Active | `sale`, `fashion_store_config` | Fashion sale order fields: CoolCash, combo, routing, returns |
| `fashion_store_api` | ⚠️ WRONG | `fashionos_base`, `fashion_store_config`, `fashion_store_product`, `fashion_store_sale` | **CUSTOM JWT/HTTP controllers — SAI APPROACH. Cần redo với OCA fastapi** |

### Module version strings

✅ **FIXED** — Tất cả 5 module manifest đã dùng `'version': '19.0.1.0.0'`.

Convention: `{odoo_major}.0.{major}.{minor}.{patch}` — ví dụ: `19.0.1.0.0`.

---

## Custom Fields Reference

### `res.partner` (trong `fashion_store_api/models/res_partner.py`)

| Field | Type | Mô tả |
|-------|------|-------|
| `x_gender_title` | Selection `('anh'/'chi')` | Xưng hô khách hàng |
| `x_zalo_id` | Char (indexed) | Zalo account ID |
| `x_phone_verified` | Boolean | Số điện thoại đã xác minh |

### `sale.order` (trong `fashion_store_api/models/sale_order.py`)

| Field | Type | Mô tả |
|-------|------|-------|
| `x_is_cart` | Boolean (indexed) | Draft order là cart của khách. Dùng thay session cart. |

### `sale.order` (trong `fashion_store_sale/`)

| Field | Type | Mô tả |
|-------|------|-------|
| `x_gender_title` | Selection | Xưng hô trên order |
| `x_alt_receiver_name` | Char | Tên người nhận thay thế |
| `x_alt_receiver_phone` | Char | SĐT người nhận thay thế |
| `x_coolcash_used` | Float | CoolCash sử dụng |
| `x_coolcash_earned` | Float | CoolCash nhận được |
| `x_referral_code` | Char | Mã referral |
| `x_is_split_order` | Boolean | Đơn hàng bị tách |
| `x_routed_warehouse_id` | Many2one `stock.warehouse` | Kho routing |

### `sale.order.line` (trong `fashion_store_sale/`)

| Field | Type | Mô tả |
|-------|------|-------|
| `x_is_combo_header` | Boolean | Dòng tổng combo |
| `x_is_combo_component` | Boolean | Dòng sản phẩm con trong combo |
| `x_combo_parent_id` | Many2one self | Trỏ về combo header |

### `product.template` (trong `fashion_store_product/`)

| Field | Type | Mô tả |
|-------|------|-------|
| `x_gender_type` | Selection `('male'/'female'/'unisex')` | Giới tính sản phẩm |
| `x_material` | Char | Chất liệu vải |
| `x_technology` | Char | Công nghệ (VD: CoolFit, DryFit) |
| `x_care_instruction` | Text | Hướng dẫn giặt ủi |
| `x_size_guide_url` | Char | URL bảng size |
| `x_slug` | Char (unique, computed) | SEO slug, tự generate từ tên (Vietnamese-aware) |
| `x_coolcash_earn_override` | Float | Override tỉ lệ tích CoolCash riêng cho sản phẩm |
| `x_is_combo` | Boolean | Sản phẩm combo |
| `x_combo_component_ids` | One2many | Danh sách sản phẩm con trong combo |
| `x_combo_cogs` | Float (computed) | Cost of combo (tổng COGS các component) |

---

## REST API (fashion_store_api — CURRENT WRONG IMPLEMENTATION)

> Custom HTTP controllers + JWT — lựa chọn đúng vì OCA/rest-framework chưa có branch Odoo 19.
> Documentation dưới đây mô tả implementation hiện tại.

**Base URL:** `/fashionos/api/v1/`

**Auth:** Bearer JWT token trong header `Authorization: Bearer <token>`

**JWT Implementation:**
- Algorithm: HS256 (Python stdlib `hmac` + `hashlib`)
- Secret: `ir.config_parameter` key `fashionos.jwt.secret_key`
- Expiry: `ir.config_parameter` key `fashionos.jwt.expiry_hours` (default: 24h)
- Payload: `{ partner_id, exp, iat }`

### Endpoints

#### Auth (`/fashionos/api/v1/auth/`)
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/auth/register` | None | Đăng ký: tạo `res.partner` + portal `res.users` |
| POST | `/auth/login` | None | Đăng nhập: trả JWT |
| GET | `/auth/me` | JWT | Profile hiện tại |
| POST | `/auth/refresh` | JWT | Gia hạn token |
| POST | `/auth/logout` | None | Stateless logout (client tự xóa token) |

#### Catalog (`/fashionos/api/v1/catalog/`)
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/catalog/categories` | None | Danh sách category tree |
| GET | `/catalog/products` | None | Product list (paginated, filter, sort) |
| GET | `/catalog/products/<id>` | None | Product detail by ID |
| GET | `/catalog/products/slug/<slug>` | None | Product detail by slug |

**Query params cho `/catalog/products`:**
- `page` (int, default 1)
- `limit` (int, default 20, max 100)
- `category_id` (int)
- `search` (string)
- `min_price`, `max_price` (float)
- `sort_by`: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `newest` (default)

#### Cart (`/fashionos/api/v1/cart/`)
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/cart` | JWT | Lấy cart (tạo mới nếu chưa có) |
| DELETE | `/cart` | JWT | Xóa toàn bộ item trong cart |
| POST | `/cart/items` | JWT | Thêm sản phẩm vào cart |
| PUT | `/cart/items/<line_id>` | JWT | Cập nhật quantity (0 = xóa) |
| DELETE | `/cart/items/<line_id>` | JWT | Xóa item khỏi cart |
| POST | `/cart/checkout` | JWT | ✅ Chốt đơn — convert cart → confirmed sale order |

**Cart pattern:** `sale.order` (state=`draft`, `x_is_cart=True`) — 1 cart/khách.

**Checkout body:**
```json
{
  "delivery_address_id": 42,        // required — res.partner ID thuộc về account này
  "gender_title": "anh",            // optional — 'anh' hoặc 'chi'
  "alt_receiver_name": "Nguyễn B",  // optional — phải đi kèm alt_receiver_phone
  "alt_receiver_phone": "0901234567",
  "note": "Giao giờ hành chính",    // optional
  "referral_code": "FRIEND10"       // optional
}
```

**Checkout response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "order_name": "S00042",
    "amount_total": 350000.0,
    "amount_untaxed": 318181.82,
    "amount_tax": 31818.18,
    "state": "sale",
    "partner_shipping_id": 42
  }
}
```

#### Account (`/fashionos/api/v1/account/`)
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/account/profile` | JWT | Lấy profile |
| PUT | `/account/profile` | JWT | Cập nhật profile |
| GET | `/account/addresses` | JWT | Danh sách địa chỉ giao hàng |
| POST | `/account/addresses` | JWT | Tạo địa chỉ mới |
| PUT | `/account/addresses/<addr_id>` | JWT | Cập nhật địa chỉ |
| DELETE | `/account/addresses/<addr_id>` | JWT | Xóa địa chỉ |

### Response format
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }

// Paginated
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1, "limit": 20, "total_pages": 5, "has_next": true, "has_prev": false } }
```

---

## Feature Flags

Tất cả flags lưu trong `ir.config_parameter` (Settings → FashionOS Config):

| Key | Default | Mô tả |
|-----|---------|-------|
| `fashionos.jwt.secret_key` | (random on install) | JWT signing secret — PHẢI đổi trên production |
| `fashionos.jwt.expiry_hours` | `24` | JWT expiry |
| `fashionos.ff.free_shipping_threshold` | `500000` | Ngưỡng free shipping (VND) |
| `fashionos.ff.coolcash_enabled` | `true` | Bật/tắt CoolCash loyalty |
| `fashionos.ff.combo_enabled` | `true` | Bật/tắt combo products |

---

## Frontend

**Path:** `frontend/fashionos-web/`

**Stack:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- API client: `lib/api.ts`

**Env file:** `frontend/fashionos-web/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8069
```

**Chạy frontend:**
```bash
cd frontend/fashionos-web
npm install
npm run dev   # http://localhost:3000
```

---

## Sprint Status

| Sprint | Tên | Status | Ghi chú |
|--------|-----|--------|---------|
| S0 | Environment Setup | ✅ Done | Docker stack, Odoo 19, PostgreSQL 16 |
| S1 | Master Data | ✅ Done | Sizes, colors, categories trong `fashion_store_product` |
| S2 | Foundation Modules | ✅ Done | `fashionos_base`, `fashion_store_config`, `fashion_store_product`, `fashion_store_sale` |
| S3 | API Layer | ✅ Done | `fashion_store_api` với custom JWT — đúng approach cho Odoo 19 (OCA chưa có branch 19.0) |
| S4 | CoolCash + CoolClub | ❌ Not started | Loyalty system |
| S5 | Payments + Delivery | ❌ Not started | VNPay/MoMo/ZaloPay + GHN/GHTK |
| S6 | Killer Features | ❌ Not started | 5 KF modules |
| S7 | Frontend Next.js | ❌ Not started | Full storefront |
| S8 | QA + Docs | ❌ Not started | Test coverage, final docs |

---

## Key Documentation

| File | Nội dung |
|------|---------|
| `docs/plan/implementation-plan.md` | Chi tiết từng Sprint, task list, code snippets |
| `docs/brd/fashion-store-brd.md` | Business Requirements Document v2.0 |
| `docs/api/api-mapping.md` | ~50 API endpoints mapping |
| `docs/uc/use-cases.md` | Use Cases UC01–UC20 |
| `docs/us/user-stories.md` | User Stories US-001–US-028 |
| `docs/mapping/odoo-module-mapping.md` | 30 Odoo modules mapping |

---

---

## Common Gotchas

### 1. Odoo `__manifest__.py` — Bare dict
Manifest phải là **bare dict** (không có Python docstring trước):
```python
# WRONG — Odoo safe_eval sẽ lỗi
"""Module description"""
{
    'name': 'Module',
    ...
}

# CORRECT
{
    'name': 'Module',
    'description': 'Module description',
    ...
}
```

### 2. ORM write() vs direct assignment
```python
# WRONG — không trigger ORM dirty tracking đáng tin cậy
line.product_uom_qty += 1

# CORRECT
line.write({'product_uom_qty': line.product_uom_qty + 1})
```

### 3. Pagination count phải dùng ORM domain, không filter Python
```python
# WRONG — total count sai, pagination break
products = Product.search(domain)
products = [p for p in products if p.list_price >= min_price]  # filter sau

# CORRECT — filter trong domain trước khi count
if min_price:
    domain.append(('list_price', '>=', float(min_price)))
total = Product.search_count(domain)
products = Product.search(domain, limit=limit, offset=offset)
```

### 4. parse_body() — Luôn handle ValueError
```python
try:
    body = parse_body()
except ValueError:
    return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
```

### 5. Module version convention cho Odoo 19
```python
'version': '19.0.1.0.0'  # {odoo_major}.0.{major}.{minor}.{patch}
```

---

## Development Workflow

### Thêm module mới
1. Tạo thư mục tại `backend/addons/<module_name>/`
2. Tạo `__manifest__.py` với `'version': '19.0.1.0.0'`
3. Tạo `__init__.py`
4. Cài vào Odoo: `docker compose exec odoo odoo -d fashionos --init=<module_name> --stop-after-init`

### Sửa code Python
- `--dev=all` đã bật → Odoo tự reload khi save file Python
- Nếu thay đổi model fields → cần `--update=<module_name>`

### Sửa XML data
- Cần `--update=<module_name>` để load lại XML data files

### Debug
```bash
docker compose logs -f odoo            # xem log realtime
docker compose exec odoo odoo shell -d fashionos  # Odoo shell
```
