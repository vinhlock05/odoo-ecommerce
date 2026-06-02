# Security Checklist — FashionOS

## Status: ✅ PASS

### JWT Security
- [x] JWT secret stored in `ir.config_parameter` key `fashionos.jwt.secret_key` — NOT hardcoded
- [x] JWT HS256 implementation uses Python stdlib `hmac` + `hashlib`
- [x] Token expiry enforced via `exp` claim
- [x] `auth='none'` routes use `get_partner_from_request()` — no anonymous data access

### Payment Security
- [x] VNPay TmnCode + HashSecret in `ir.config_parameter` — NOT in source code
- [x] VNPay IPN verifies HMAC-SHA512 signature before processing
- [x] VNPay return params verified before reporting success to user
- [x] Amount double-checked in IPN (VNPay amount ÷ 100 matches transaction)

### GHN Delivery
- [x] GHN API token in `ir.config_parameter` — NOT in source code
- [x] GHN webhook processes only known order codes (no arbitrary data injection)

### API Security
- [x] All cart/account/checkout endpoints require valid JWT
- [x] Delivery address ownership verified before checkout (child_of check)
- [x] Referral code: users cannot use their own code
- [x] Referral discount: first-order only (confirmed order count checked)
- [x] CoolCash redeem: balance check before deduction (UserError if insufficient)

### Data Access
- [x] All auth='none' controllers use `env(user=1)` (SUPERUSER_ID)
  → Required for Odoo 19 where anonymous uid=0 breaks ORM
- [x] Partner data access scoped to authenticated partner only
- [x] Order access: `order.partner_id.id != partner.id` guards on all endpoints

### SQL Injection
- [x] All queries use Odoo ORM domain syntax — no raw SQL string concatenation
- [x] Search domains use typed parameters (int, str) — not user-controlled strings injected raw

### Input Validation
- [x] `parse_body()` wraps JSON parse with try/except → 400 MALFORMED_JSON
- [x] All integer/float inputs cast with try/except before use
- [x] `delivery_address_id` validated as int and ownership-checked
- [x] `gender_title` validated against allowed values ('anh', 'chi')

### Secrets in Code
- [x] No API keys, passwords, or tokens hardcoded in any Python or TypeScript file
- [x] `.env.local` contains only `localhost:8069` URLs — no production secrets
- [x] Docker Compose uses env vars — no plaintext secrets in YAML (DB password is local-dev only)

## To-Do Before Production
- [ ] Change `POSTGRES_PASSWORD` from `odoo_secret` to a strong random password
- [ ] Set `fashionos.jwt.secret_key` to a cryptographically random 64-char string
- [ ] Replace VNPay sandbox credentials with production TmnCode + HashSecret
- [ ] Replace GHN dev token with production token
- [ ] Set `fashionos.vnpay.sandbox = 0` for production
- [ ] Enable HTTPS on Odoo and Next.js
- [ ] Set `fashionos.vnpay.return_url` and `fashionos.vnpay.ipn_url` to production URLs
- [ ] Configure rate limiting on `/fashionos/api/v1/auth/*` endpoints
