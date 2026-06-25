# Architecture — FashionOS Headless eCommerce

FashionOS is built on a headless eCommerce architecture, separating the front-end user experience from the back-end ERP and database logic.

```
┌──────────────────────────────────────────────┐
│  Next.js 15 Storefront (frontend/fashionos-web)│
│  React 18 + TS + Tailwind CSS v4             │
└───────────────┬──────────────────────────────┘
                │ REST API / JWT
                │ /fashionos/api/v1/*
                ▼
┌──────────────────────────────────────────────┐
│  Odoo 19.0 API Gateway (backend/addons)      │
│  Custom HTTP Controllers & JWT Auth          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Custom Addons (Addon Layer)            │  │
│  │ - fashionos_base, config, product,     │  │
│  │   sale, loyalty, api, routing, return  │  │
│  └────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────┘
                        │ ORM
                        ▼
┌──────────────────────────────────────────────┐
│  PostgreSQL 16 Database                      │
│  DB Name: fashionos                          │
└──────────────────────────────────────────────┘
```

---

## 1. Core Stack

### Frontend
- **Framework:** Next.js 15 (App Router, Server Actions, Client-side Components)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (React 18)
- **Integration:** API Client `lib/api.ts` requesting endpoints on `http://localhost:8069`.

### Backend
- **Framework:** Odoo 19.0 (ERP, CRM, and eCommerce Engine)
- **Database:** PostgreSQL 16
- **Server:** Docker-based container (`odoo:19.0`) running on port `8069` with auto-reload (`--dev=all`) active for Python files.
- **REST API & Auth:** Custom Python controllers using `werkzeug` and standard Odoo HTTP request routing, secured by custom JSON Web Tokens (JWT) signed with HS256.

---

## 2. Backend Module Hierarchy & Addon Layering

Our backend customization is modular, split into specific addon directories in `backend/addons/`:

```text
fashion_store_api
  └─ depends on all modules below (serves as the API Controller Gateway)
fashion_store_return / fashion_store_routing / fashion_store_combo / delivery_ghn / payment_vnpay
  └─ depends on base modules below (business logic, webhook, and algorithms)
fashion_store_loyalty
  └─ depends on fashion_store_sale / fashionos_base
fashion_store_sale / fashion_store_product
  └─ depends on fashion_store_config / base Odoo modules
fashion_store_config / fashionos_base
  └─ depends on core Odoo apps (sale, product, stock, mail)
```

### Module Roles:
1. **`fashionos_base`**: Configures base settings, health checks, and global utilities.
2. **`fashion_store_config`**: Stores Feature Flags (e.g. loyalty enabled, free shipping thresholds) in Odoo's `ir.config_parameter`.
3. **`fashion_store_product`**: Customizes the product model. Supports sizes, colors, material types, custom size guides, computed Vietnamese-aware SEO slugs, and Combo Products.
4. **`fashion_store_sale`**: Extends Odoo sales orders with customer gender title, alternative receiver details, referral codes, splits, and custom routing warehouse trackers.
5. **`fashion_store_loyalty`**: Manages the "CoolCash" loyalty ledger, club tiers, and referral bonuses (50k registration discount, 100k referrer reward).
6. **`payment_vnpay`**: Integrates VNPay gateway with HMAC-SHA512 signatures and txn verification.
7. **`delivery_ghn`**: Generates shipments via Giao Hang Nhanh (GHN) API and processes tracking status webhooks.
8. **`fashion_store_combo`**: Combo Engine that expands a combo header into component lines on sales order confirmation.
9. **`fashion_store_return`**: Self-service returns portal with automatic CoolCash refund ledger entries.
10. **`fashion_store_routing`**: Smart warehouse routing engine selecting the closest inventory location based on the customer's shipping province.
11. **`fashion_store_api`**: Exposes the REST API surface (`/fashionos/api/v1/`), handling registration, login, JWT issuance/validation, catalog retrieval, cart persistence, checkout, and member dashboards.

---

## 3. Boundary Integration & Parsing Rules

1. **JSON Parsing & Validation:**
   - Any external API request must parse body data through `json.loads(request.httprequest.data)`.
   - Always catch `ValueError` to handle malformed JSON payloads and return a structured `400 MALFORMED_JSON` error.
2. **JWT Security Boundary:**
   - All authenticated routes check for `Authorization: Bearer <token>` header.
   - Authentication middleware validates signatures, timestamps, and active partner records.
3. **Database Write Control:**
   - Always perform modifications via Odoo ORM methods (`.write()`, `.create()`) to ensure Odoo triggers proper cache invalidation and database triggers. Do not edit model attributes directly.
