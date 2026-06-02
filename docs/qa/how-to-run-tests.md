# How to Run Tests

## Prerequisites

Odoo + PostgreSQL running via Docker Compose.

## Run all FashionOS tests

```bash
# Run tagged tests (requires Odoo running with --test-enable)
docker compose exec odoo odoo \
  -d fashionos \
  --test-tags fashion \
  --stop-after-init
```

## Run specific module tests

```bash
# CoolCash + Referral tests
docker compose exec odoo odoo \
  -d fashionos \
  --test-tags fashion,coolcash \
  --stop-after-init

# Combo engine tests
docker compose exec odoo odoo \
  -d fashionos \
  --test-tags fashion,combo \
  --stop-after-init

# Routing tests
docker compose exec odoo odoo \
  -d fashionos \
  --test-tags fashion,routing \
  --stop-after-init
```

## Run all tests for a module

```bash
docker compose exec odoo odoo \
  -d fashionos \
  --init=fashion_store_loyalty \
  --test-tags /fashion_store_loyalty \
  --stop-after-init
```

## API integration smoke test (manual)

```bash
# 1. Register
curl -s -X POST http://localhost:8069/fashionos/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}' | jq .

# 2. Login and get token
TOKEN=$(curl -s -X POST http://localhost:8069/fashionos/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r .data.token)

# 3. Get products
curl -s http://localhost:8069/fashionos/api/v1/catalog/products | jq .meta

# 4. Get cart (should be empty)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8069/fashionos/api/v1/cart | jq .data.item_count

# 5. Check loyalty status
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8069/fashionos/api/v1/account/loyalty | jq .data

# 6. Check referral code
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8069/fashionos/api/v1/account/referral | jq .data.code
```

## Performance targets

| Endpoint | Target p95 |
|----------|-----------|
| `GET /catalog/products` | < 500ms |
| `GET /cart` | < 200ms |
| `POST /auth/login` | < 300ms |
| `GET /account/loyalty` | < 200ms |
| `GET /catalog/recommendations` | < 1000ms |
