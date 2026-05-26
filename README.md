# FashionOS — Headless Odoo eCommerce Template

> MVP v0.1 | Odoo v19 + Next.js 15 | Kiến trúc Headless Fashion eCommerce

---

## Quick Start

### 1. Cập nhật image Odoo trong `.env`

```bash
# .env
ODOO_IMAGE=odoo:19.0   # hoặc image v19 của bạn
```

### 2. Khởi động Odoo + PostgreSQL

```bash
docker compose up -d
```

Odoo chạy tại: http://localhost:8069

### 3. Cài module `fashionos_base`

1. Vào http://localhost:8069
2. Tạo database mới (hoặc dùng database có sẵn)
3. Settings → Activate Developer Mode
4. Apps → Update App List
5. Tìm **FashionOS - Base** → Install

### 4. Test API

```bash
# Health check
curl http://localhost:8069/fashionos/api/v1/health

# Product list
curl http://localhost:8069/fashionos/api/v1/products

# Single product
curl http://localhost:8069/fashionos/api/v1/products/1
```

### 5. Chạy Frontend

```bash
cd frontend/fashionos-web
npm install
npm run dev
```

Frontend tại: http://localhost:3000

---

## Project Structure

```
fashionos/
├── custom_addons/
│   └── fashionos_base/          # Odoo custom module
│       ├── __manifest__.py
│       └── controllers/
│           └── main.py          # REST API endpoints
├── frontend/
│   └── fashionos-web/           # Next.js 15 App Router
│       ├── app/
│       │   └── products/page.tsx
│       ├── components/
│       │   └── ProductCard.tsx
│       └── lib/
│           └── api.ts           # API client + types
├── docker-compose.yml
└── .env
```

## API Endpoints (MVP)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/fashionos/api/v1/health` | None | Health check |
| GET | `/fashionos/api/v1/products` | Public | Product list (paginated) |
| GET | `/fashionos/api/v1/products/<id>` | Public | Product detail + variants |

### Query Parameters (products list)

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 20 | Max 100 |
| `offset` | 0 | Pagination offset |
| `category_id` | — | Filter by Odoo product category |

---

## Roadmap

| Sprint | Feature | Status |
|--------|---------|--------|
| S0 | Module scaffold + health/products API | ✅ MVP Done |
| S1 | JWT Auth (OCA fastapi_auth_partner_jwt) | Next |
| S2 | Cart + Checkout (ShopInvader) | Planned |
| S3 | CoolCash loyalty + CoolClub membership | Planned |
| S4 | VNPay / MoMo / ZaloPay payments | Planned |
| S5 | GHN / GHTK delivery integration | Planned |
| S6 | Killer Features (Returns, Smart Routing, Combo) | Planned |
| S7 | AI Recommendations + P&L Dashboard | Planned |

---

## Tech Stack

- **Backend**: Odoo v19 Enterprise + OCA FastAPI + ShopInvader
- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16
- **Auth**: JWT (OCA `fastapi_auth_partner_jwt`)
- **Payments**: VNPay · MoMo · ZaloPay
- **Delivery**: GHN · GHTK
