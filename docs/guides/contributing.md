# Contributor Guidelines — Nexus PM

This guide outlines Git branch management, commit naming standards, and coding conventions for developers contributing to Nexus PM.

---

## 1. Branch Strategy (GitFlow)

We use a GitFlow-based branch strategy to coordinate releases and isolate features:

* **`master`:** Represents production-ready code. Merges from `develop` via release Pull Requests.
* **`develop`:** Staging integration channel. All developer features branch off from here and target this branch via Pull Requests.
* **`feature/*`:** Short-lived feature branches. Used for task edits, layout upgrades, and API extensions.
* **`fix/*`:** Bug fixes and quick hotfix modifications.

---

## 2. Commit Message Conventions

We follow Conventional Commits formatting. Standard scopes:
* **`feat:`** A new feature (e.g. `feat: add task attachment upload options`).
* **`fix:`** A bug fix (e.g. `fix: strip quotes from ALLOWED_ORIGINS env`).
* **`docs:`** Documentation modifications (e.g. `docs: add contributing guide`).
* **`style:`** Formatter/spacing modifications (e.g. `style: run black formatting`).
* **`refactor:`** Code modifications that neither fix bugs nor add features.
* **`chore:`** Dependency updates, build configurations, or file cleanups.

---

## 3. Code Style & Quality Standards

### Python (Backend)
* **Code Formatter:** We use **Black** to enforce standard Python line widths and formatting.
* **Linter & Quality Checks:** We use **Ruff** for fast linting checks.
* Run before committing:
  ```bash
  black .
  ruff check .
  ```

### TypeScript / React (Frontend)
* **Linter:** We use **ESLint** to verify type consistency and check for unused components.
* Run before committing:
  ```bash
  npm run lint
  ```

---

## 4. Database Migrations (Alembic)

Whenever you add or modify SQLAlchemy models under `models/`, you must generate a new Alembic migration:

1. **Create Migration Script:**
   ```bash
   alembic revision --autogenerate -m "describe changes here"
   ```
2. **Review Code:** Open the generated script inside `alembic/versions/` and ensure the upgrades/downgrades map your changes cleanly.
3. **Execute Locally:**
   ```bash
   alembic upgrade head
   ```

---

## 5. Pre-PR Checklist

Before submitting a Pull Request:
1. Ensure your local branch is synchronized with the latest `develop` head.
2. Verify Python syntax checks:
   ```bash
   python -m compileall -q .
   ```
3. Run backend unit tests:
   ```bash
   python -m unittest discover -s tests
   ```
4. Verify frontend build compilation:
   ```bash
   npm run build
   ```
5. If modifying API interfaces, ensure you update the Swagger schemas or examples inside the `docs/examples/` suite.
