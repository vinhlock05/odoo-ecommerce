# CLAUDE.md — FashionOS eCommerce

This file provides quick command shortcuts for Claude Code. For full guidelines, rules, and architecture, refer to `AGENTS.md` and `docs/HARNESS.md`.

## Build, Test, and Lint Commands

- **Build**: `cd frontend/fashionos-web && npm run build`
- **Dev/Run**: `docker compose up -d` (backend) & `cd frontend/fashionos-web && npm run dev` (frontend)
- **Test**: `docker compose exec odoo odoo -d fashionos --test-tags fashion --stop-after-init`
- **Lint**: `cd frontend/fashionos-web && npm run lint`

## Project Context
- **Backend**: Odoo 19 (Docker, port `8069`, DB `fashionos`). Addons in `backend/addons/`.
- **Frontend**: Next.js 15 (port `3000`). Root in `frontend/fashionos-web/`.

## 🚨 Critical Reference
This repo uses a repository-level operating harness. Before writing any code, **you must read**:
1. **`AGENTS.md`** — Core rules, Odoo 19 gotchas (bare manifest dict, ORM `.write()`), and CLI tools.
2. **`docs/HARNESS.md`** — Collaboration and risk-level guidelines.
3. **`docs/ARCHITECTURE.md`** — Modular addon structure and layer dependencies.
4. **`docs/TEST_MATRIX.md`** — Feature-to-proof test matrix.
