# Spec Development Flow & Guidelines

This document outlines the step-by-step development lifecycle for implementing a new specification, feature, or task in this project. It ensures that any developer (or coding agent) joining the project follows the correct procedures for both Odoo development and Harness compliance.

---

## The Spec-to-Code Workflow

Every new spec or feature follows a structured 7-step cycle:

```
┌──────────────────────────────────────┐
│  1. Intake & Classification          │ ◄── harness-cli intake
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  2. Story Decomposition & Setup      │ ◄── Create docs/stories/*.md & story add
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  3. Spin Up Environment              │ ◄── docker compose & npm run dev
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  4. Implement & Update Code          │ ◄── Addons, Next.js, Odoo --update
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  5. Write & Run Tests                │ ◄── Odoo tests, Next.js lint
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  6. Story Verification               │ ◄── harness-cli story verify
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  7. Record Execution Trace           │ ◄── harness-cli trace
└──────────────────────────────────────┘
```

---

## Step 1: Feature Intake & Risk Classification

Before writing any code, classify the request risk lane using `docs/FEATURE_INTAKE.md`:
- **Tiny**: Simple bug fix, copy updates, or doc changes (Risk = Tiny).
- **Normal**: Modifying an endpoint, adding a view, or adding a utility function (Risk = Normal).
- **High-Risk**: DB schema migrations, auth logic, payments, or core routing (Risk = High-Risk).

Run the intake recorder command:
```powershell
.\scripts\bin\harness-cli.exe intake --type change_request --summary "Describe the spec behavior" --lane <tiny|normal|high-risk>
```

---

## Step 2: Story Decomposition & Setup

1. **Create Story Packet:** 
   Create a markdown file under `docs/stories/US-XXX.md` using the template at `docs/templates/story.md`. Document the description, acceptance criteria, and plan.
2. **Add to Database Tracker:**
   Register the story in the Harness SQLite database:
   ```powershell
   .\scripts\bin\harness-cli.exe story add --id US-XXX --title "Implement Feature Name" --lane normal --verify "verification command"
   ```
   *Note: For Odoo backend tests, the verify command is usually Odoo test commands, e.g.:*
   `docker compose exec odoo odoo -d fashionos --test-tags fashion,your_tag --stop-after-init`
3. **Update Test Matrix:**
   Add a row in `docs/TEST_MATRIX.md` to map the story to its corresponding unit/integration tests.

---

## Step 3: Spin Up local Environment

Run the docker containers for Odoo 19 and PostgreSQL:
```bash
docker compose up -d
docker compose logs -f odoo # Keep logs open to debug Python/Odoo output
```

Spin up the Next.js frontend:
```bash
cd frontend/fashionos-web
npm run dev
```

---

## Step 4: Implement Backend & Frontend Changes

### Odoo Backend Development Rules
- **Addon Path:** Put all custom logic inside `backend/addons/<your_module>`.
- **Manifest:** Manifest file `__manifest__.py` must be a **bare dictionary**. No python docstring before the dict declaration. Version string must be `'version': '19.0.1.0.0'`.
- **ORM Mutations:** **Never** assign values directly to record fields (e.g. `line.price = 100`). Always use the Odoo ORM method:
  ```python
  line.write({'price': 100})
  ```
- **Pagination Counting:** Use database-level counts (`self.search_count(domain)`). Do not load all records and call `len()`.
- **Request Parsing:** Always wrap JSON body parsing in a `try/except ValueError` block:
  ```python
  try:
      data = json.loads(request.httprequest.data)
  except ValueError:
      return error_response('MALFORMED_JSON', 'Malformed JSON payload')
  ```

### Refreshing Odoo Schema & Views
Whenever you modify database models (`models/*.py`) or view/data files (`views/*.xml`, `data/*.xml`):
```bash
# Update the module in the running Odoo container
docker compose exec odoo odoo -d fashionos --update=<module_name> --stop-after-init
```

### Frontend Next.js Development Rules
- Standard pages and server components reside in `frontend/fashionos-web/app/`.
- Maintain typed endpoints and functions in `frontend/fashionos-web/lib/api.ts`.
- Ensure frontend compiles cleanly: `npm run build`.

---

## Step 5: Write & Run Tests

Write Odoo backend test classes inside `tests/` folder in your module (e.g. `tests/test_feature.py`), tagging classes with `post_install` and `at_install`.

Run the Odoo test command:
```bash
# Run all tests in the project tagged with 'fashion'
docker compose exec odoo odoo -d fashionos --test-tags fashion --stop-after-init

# Run only your module's specific test tag
docker compose exec odoo odoo -d fashionos --test-tags fashion,your_tag --stop-after-init
```

---

## Step 6: Story Verification

Verify your story status using the verification command registered in Step 2:
```powershell
.\scripts\bin\harness-cli.exe story verify US-XXX
```
Ensure it returns success. If the tests pass, update the database record with proof results:
```powershell
# Set unit=1 (true) and integration=1 (true)
.\scripts\bin\harness-cli.exe story update --id US-XXX --status completed --unit 1 --integration 1
```

---

## Step 7: Record Execution Trace

Once the task is verified and complete, record a trace detailing your changes:
```powershell
# Record a trace linked to the story
.\scripts\bin\harness-cli.exe trace --summary "Implemented spec detail, added tests, verified build" --outcome success --story US-XXX
```
Propose any backlog recommendations if you encountered recurring difficulties or code friction:
```powershell
.\scripts\bin\harness-cli.exe backlog add --title "Improve X helper" --pain "Had to manually write parsing code twice" --risk tiny
```
