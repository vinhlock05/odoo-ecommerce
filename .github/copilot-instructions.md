# GitHub Copilot Instructions — FashionOS Project

Always follow these rules, stack structures, and commands when suggesting code or assisting with development in this repository.

## 📖 Key Reference Documents
- **`AGENTS.md`**: Single source of truth for agent behavior and repository rules. Read it at start of session.
- **`CLAUDE.md`**: Stable developer guide with CLI commands and development workflow.
- **`docs/ARCHITECTURE.md`**: Architecture, technology stack, and module structure details.
- **`docs/TEST_MATRIX.md`**: Maps features to existing test files and verification tags.

---

## 🚨 CRITICAL RULES & GOTCHAS

1. **Odoo Version is 19.0 (NOT 17.0)**
   - All module manifests (`__manifest__.py`) must declare `'version': '19.0.1.0.0'`.
   - Never write code using Odoo 17 conventions; verify Odoo 19 compatibility.
2. **Odoo Manifest File**
   - Must be a bare dictionary in `__manifest__.py`. **Do not** write Python docstrings before the dictionary, as Odoo's safe_eval parser will throw an error.
3. **ORM Mutations**
   - Use ORM `.write()` method for database synchronization (e.g. `line.write({'qty': new_qty})`). **Do not** assign fields directly.
4. **Pagination Count**
   - Compute total counts in database/ORM level using `.search_count(domain)`. Never post-filter in memory using Python list comprehension.
5. **No Reinventing the Wheel**
   - Look for OCA packages or PyPI/npm packages first.

---

## CLI Commands Reference

- **Start Stack**: `docker compose up -d` & `cd frontend/fashionos-web && npm run dev`
- **Build Frontend**: `cd frontend/fashionos-web && npm run build`
- **Lint Frontend**: `cd frontend/fashionos-web && npm run lint`
- **Run Odoo Tests**: `docker compose exec odoo odoo -d fashionos --test-tags fashion --stop-after-init`
- **Run Specific Tests**: `docker compose exec odoo odoo -d fashionos --test-tags fashion,<tag> --stop-after-init` (tags: `coolcash`, `combo`, `routing`)
- **Update Backend Module**: `docker compose exec odoo odoo -d fashionos --update=<module_name> --stop-after-init`
