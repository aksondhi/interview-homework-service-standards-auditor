# Service Standards Auditor (TypeScript Starter)

> Candidate take-home project for an Engineering Practices & Standards role.

This repository contains the **project brief**, a **starter implementation scaffold** in **TypeScript/Node.js**,
example services to scan, and simple CI wiring. Candidates can expand or replace this scaffold.

---

## 🧩 Project: “Service Standards Auditor”

Build a lightweight **command-line tool** that audits a local repository (or set of repositories) for **engineering best practice compliance**.

### Your Tool Should
1. **Scan** a codebase (e.g., multiple service folders).
2. **Evaluate** compliance against a **configurable set of rules** (YAML).
3. **Generate a compliance report** in **CLI output** and **JSON or Markdown** formats.

### Requirements (Core)
- Implemented in **TypeScript** (Node 22+).
- External config (YAML) defining rules.
- Rules are independently testable/extensible.
- CLI flags:
  - `--path` directory of services or single service
  - `--config` path to YAML config
  - `--output` `json`, `md`, or `both`
  - `--outdir` directory to write reports (default: `./reports`)

### Example Rules
- Must contain a `README.md`
- Must contain a `Dockerfile`
- Must contain a `tests/` or `test/` directory
- Must have code coverage of a minimum percentage (e.g., 80%)
- If Node project, `package.json` must contain a semantic version

### Bonus Ideas (Optional)
- Utilize Github Copilot or similar AI tools for analysis of code
- Enable as a GitHub Action
- Github Action integration to release to Github Registry
- HTML summary report
- Plugin system for adding new rules dynamically
- Parallel scanning or rule execution
- Example repo showing compliant and failing services

---

## ⏱️ Timebox
Spend **3–4 days**. Optimize for **clarity, maintainability, and rationale**.

---

## ▶️ Quickstart

```bash
# Install deps
npm ci

# Build
npm run build

# Run on the included sample services
npm start -- --path examples/services --config config.yaml --output both

# See reports in ./reports
ls reports

# Run tests
npm test
```

> You are **encouraged** to refactor, replace, or extend this scaffold.
> Keep the same user-facing behavior and comparable tests/docs.

---

## 📚 Docs for Reviewers
- See [`RUBRIC.md`](RUBRIC.md) for the internal scoring rubric.
