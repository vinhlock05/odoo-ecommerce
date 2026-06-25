# Agent Instructions

## Project Overview & Stack
- **Project Name:** FashionOS — Headless Fashion eCommerce
- **Backend:** Odoo 19 (Docker container `odoo:19.0`, PostgreSQL 16) running on port `8069`. DB Name: `fashionos`.
- **Frontend:** Next.js 15 (App Router, Tailwind CSS v4, TypeScript) running on port `3000`.
- **Pathing:** Addons live at `backend/addons/`, frontend lives at `frontend/fashionos-web/`.

## 🚨 CRITICAL RULES & GOTCHAS

1. **Odoo Version is 19.0 (NOT 17.0)**
   - All module manifests (`__manifest__.py`) must declare `'version': '19.0.1.0.0'`.
   - Never use/reference Odoo 17 code patterns unless verified to work in Odoo 19.
2. **Don't Reinvent the Wheel**
   - Check [OCA (Odoo Community Association)](https://github.com/OCA) or PyPI/npm packages before building custom code.
3. **Custom JWT API Layer**
   - The `fashion_store_api` module implements custom JWT authentication and HTTP controllers. This is intentional for Odoo 19 as OCA's rest-framework does not support Odoo 19 yet. Do not refactor/replace this auth logic.
4. **Odoo Manifest Structure**
   - Must be a bare dictionary in `__manifest__.py`. **Do not** put Python docstrings before the dictionary, as it causes `safe_eval` parsing errors.
5. **ORM Mutations**
   - Do not assign fields directly (e.g. `line.product_uom_qty += 1`). Use ORM `.write()` method (e.g. `line.write({'product_uom_qty': line.product_uom_qty + 1})`) to guarantee proper dirty state tracking and database synchronization.
6. **Pagination Counting**
   - Do count queries at the database/ORM level using `.search_count(domain)`. Never load all records into Python memory to filter or call `len()`.
7. **Request Body Parsing**
   - Always wrap body parsing in `try/except ValueError` to handle malformed JSON input gracefully.

## CLI Commands

### Dev & Infrastructure
- Start backend: `docker compose up -d`
- View backend logs: `docker compose logs -f odoo`
- Stop backend: `docker compose down`
- Odoo shell: `docker compose exec odoo odoo shell -d fashionos`
- Start frontend: `cd frontend/fashionos-web && npm run dev`
- Build frontend: `cd frontend/fashionos-web && npm run build`

### Odoo Module Management
- Install module: `docker compose exec odoo odoo -d fashionos --init=<module_name> --stop-after-init`
- Update module: `docker compose exec odoo odoo -d fashionos --update=<module_name> --stop-after-init`

### Testing & Verification
- Run all FashionOS backend tests: `docker compose exec odoo odoo -d fashionos --test-tags fashion --stop-after-init`
- Run specific tests: `docker compose exec odoo odoo -d fashionos --test-tags fashion,<tag> --stop-after-init` (available tags: `coolcash`, `combo`, `routing`)
- Run all tests for a specific module: `docker compose exec odoo odoo -d fashionos --init=<module_name> --test-tags /<module_name> --stop-after-init`
- Lint frontend: `cd frontend/fashionos-web && npm run lint`


<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TOOL_REGISTRY.md`
- `scripts/bin/harness-cli query matrix` on macOS/Linux, or `.\scripts\bin\harness-cli.exe query matrix` on Windows

Use the Rust Harness CLI at `scripts/bin/harness-cli` on macOS/Linux or
`scripts/bin/harness-cli.exe` on Windows as the main operational tool. Before a
step that could use an external tool, run `scripts/bin/harness-cli query tools
--capability <name> --status present` to see what is equipped; an absent
capability is a clean skip.
<!-- HARNESS:END -->
