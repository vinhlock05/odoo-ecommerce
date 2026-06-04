# FashionOS — Headless Fashion eCommerce

Production-ready headless eCommerce platform built on **Odoo 19** (backend/ERP) + **Next.js 16** (frontend), communicating via a custom REST API with JWT authentication.

Designed as a reference architecture for Vietnamese fashion brands wanting Odoo ERP power with a modern custom storefront — similar to Coolmate/Gymbody.

## Architecture

```
[Next.js 16 + TypeScript]  ←  REST API  →  [Odoo 19 + Python]
   App Router + Tailwind        JWT            11 custom modules
        :3000                               PostgreSQL 16 + :8069
              ↑
         [nginx + SSL]
```

## Features

| Area | What's built |
|------|-------------|
| Auth | Custom JWT (HS256), register/login/refresh |
| Catalog | Products, variants, slug-based URLs, categories |
| Cart | Draft order pattern (`x_is_cart`), CoolCash apply |
| Checkout | Address validation, referral codes, order confirmation |
| Payments | VNPay HMAC-SHA512 gateway |
| Delivery | GHN API v2 shipment + tracking webhook |
| Loyalty | CoolCash earn/redeem, tier system (Member/Silver/Gold) |
| Referral | Auto-generate codes, 50k referee discount, 100k referrer reward |
| Returns | Customer portal — submit request, CoolCash refund |
| Smart Routing | Province-based warehouse routing |
| Combo Engine | Expand combo product lines on order confirm |
| Account | Profile, addresses, order history, returns, CoolCash history |
| Admin AI | Claude API dashboard + catalog recommendations |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Odoo 19, Python 3.11 |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Database | PostgreSQL 16 |
| Auth | Custom JWT via Python stdlib |
| Payment | VNPay |
| Delivery | GHN |
| DevOps | Docker Compose, GitHub Actions CI/CD |
| Monitoring | Sentry, nginx uptime, `/api/health` endpoint |
| Infra | nginx reverse proxy, SSL, automated pg_dump backup |

## Quick Start (Development)

**Prerequisites:** Docker, Docker Compose, Node.js 20+

```bash
# 1. Clone and configure
git clone https://github.com/YOUR_USER/odoo-ecommerce.git
cd odoo-ecommerce
cp .env.example .env   # fill in passwords

# 2. Start backend
docker compose up -d

# 3. Install Odoo modules (first time only)
docker compose exec odoo odoo -d fashionos \
  --init=fashion_store_api --stop-after-init

# 4. Start frontend
cd frontend/fashionos-web
npm install
npm run dev   # http://localhost:3000
```

Odoo admin: http://localhost:8069 — database: `fashionos`

## Production Deployment

```bash
# On a fresh Ubuntu 22.04 VPS:
curl -sL https://raw.githubusercontent.com/YOUR_USER/odoo-ecommerce/main/infra/setup/server-setup.sh | sudo bash

# Then as the deploy user:
cd /opt/fashionos
cp .env.example .env && nano .env
bash infra/setup/first-deploy.sh
sudo certbot --nginx -d yourdomain.com
```

CI/CD via GitHub Actions — configure `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY` in repository secrets.

## Project Structure

```
├── backend/
│   ├── addons/           # 11 custom Odoo modules
│   │   ├── fashionos_base/
│   │   ├── fashion_store_api/      # JWT + 50+ REST endpoints
│   │   ├── fashion_store_loyalty/  # CoolCash + tiers
│   │   ├── payment_vnpay/          # VNPay gateway
│   │   ├── delivery_ghn/           # GHN delivery
│   │   └── ...
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/fashionos-web/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Shared UI components
│   └── lib/api.ts        # Typed API client (30+ functions)
├── infra/
│   ├── nginx/            # nginx config with rate limiting + SSL
│   ├── backup/           # pg_dump + restore scripts
│   ├── monitoring/       # uptime config for BetterStack/UptimeRobot
│   └── setup/            # server provisioning scripts
├── .github/workflows/    # CI (typecheck + lint) + CD (SSH deploy)
├── docker-compose.yml
└── docker-compose.prod.yml
```

## API Reference

Base URL: `/fashionos/api/v1/`  
Auth: `Authorization: Bearer <jwt_token>`

Key endpoints: `POST /auth/login`, `GET /catalog/products`, `POST /cart/items`, `POST /cart/checkout`, `GET /account/orders`, `POST /account/returns`

## License

MIT
