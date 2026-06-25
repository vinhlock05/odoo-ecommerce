# Test Matrix

This matrix maps core project behaviors to validation suites and proof.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Feature | Scope / Behavior | Unit / ORM Tests | Integration / API Smoke | Status | Evidence / Commands |
| --- | --- | --- | --- | --- | --- |
| **CoolCash Loyalty** | Points earning rates, redeem calculations, ledger transactions | `test_coolcash.py` | — | implemented | `docker compose exec odoo odoo -d fashionos --test-tags fashion,coolcash --stop-after-init` |
| **Referrals** | Referral discount application, referrer rewards, logs | `test_referral.py` | — | implemented | `docker compose exec odoo odoo -d fashionos --test-tags fashion,coolcash --stop-after-init` |
| **Combo Products** | Explodes combo header lines to child lines on order validation | `test_combo.py` | — | implemented | `docker compose exec odoo odoo -d fashionos --test-tags fashion,combo --stop-after-init` |
| **Smart Routing** | Dynamic warehouse routing based on customer province | `test_routing.py` | — | implemented | `docker compose exec odoo odoo -d fashionos --test-tags fashion,routing --stop-after-init` |
| **Storefront REST API** | Cart, Catalog, Checkout, and JWT auth flow stability | — | Curl smoke tests | implemented | CLI curl requests in `docs/qa/how-to-run-tests.md` |

## Evidence Rules

- **Unit proof (ORM)**: Covers pure business rules inside specific models (runs within Odoo transaction rollback context).
- **Integration proof**: Covers REST API endpoints, external webhook responses (GHN/VNPay), and cross-module interactions.
- **E2E proof**: Verifies that the storefront frontend connects and behaves correctly under user-driven browser scenarios.
