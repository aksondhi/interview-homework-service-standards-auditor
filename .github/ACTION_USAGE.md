# GitHub Action Usage

Use the Service Standards Auditor in your GitHub Actions workflows to automatically audit your services for compliance with engineering best practices.

## Quick Start

```yaml
name: Audit Services

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aksondhi/service-standards-auditor@v1
        with:
          config: .github/standards.yml
          path: ./services
          output: both
```

## Inputs

| Input           | Description                                    | Required | Default                 |
| --------------- | ---------------------------------------------- | -------- | ----------------------- |
| `path`          | Path to scan for services                      | No       | `.` (current directory) |
| `config`        | Path to configuration YAML file                | Yes      | -                       |
| `output`        | Output format: `json`, `md`, `html`, or `both` | No       | `both`                  |
| `outdir`        | Output directory for reports                   | No       | `./reports`             |
| `fail-on-error` | Fail the action if any required rules fail     | No       | `true`                  |
| `comment-pr`    | Post audit results as PR comment               | No       | `false`                 |
| `github-token`  | GitHub token for PR comments                   | No       | `${{ github.token }}`   |

## Outputs

| Output            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `report-path`     | Path to the generated report file(s)               |
| `passed`          | Whether all required rules passed (`true`/`false`) |
| `total-services`  | Total number of services audited                   |
| `passed-services` | Number of services that passed all required rules  |
| `pass-rate`       | Percentage of services that passed                 |

## Examples

### Basic Audit

```yaml
- uses: aksondhi/service-standards-auditor@v1
  with:
    config: .github/rules.yml
```

### Audit with PR Comments

```yaml
- uses: aksondhi/service-standards-auditor@v1
  with:
    config: .github/rules.yml
    comment-pr: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Generate HTML Report

```yaml
- uses: aksondhi/service-standards-auditor@v1
  with:
    config: .github/rules.yml
    output: html
    outdir: ./audit-reports

- uses: actions/upload-artifact@v4
  with:
    name: audit-report
    path: ./audit-reports
```

### Conditional Failure

```yaml
- uses: aksondhi/service-standards-auditor@v1
  id: audit
  with:
    config: .github/rules.yml
    fail-on-error: false

- name: Check audit results
  if: steps.audit.outputs.passed == 'false'
  run: |
    echo "⚠️ Audit failed but continuing"
    echo "Pass rate: ${{ steps.audit.outputs.pass-rate }}%"
```

### Matrix Auditing

```yaml
jobs:
  audit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4

      - uses: aksondhi/service-standards-auditor@v1
        with:
          config: .github/rules-${{ matrix.environment }}.yml
          path: ./services
```

## Configuration File

Create a `.github/standards.yml` file in your repository:

```yaml
rules:
  - name: 'README Required'
    type: 'file-exists'
    target: 'README.md'
    required: true

  - name: 'Tests Required'
    type: 'file-exists'
    target: 'tests/**/*.test.{ts,js}'
    required: true

  - name: 'Dockerfile Required'
    type: 'file-exists'
    target: 'Dockerfile'
    required: true

  - name: 'Semantic Versioning'
    type: 'semver'
    target: 'package.json'
    required: true

  - name: 'Code Coverage'
    type: 'coverage'
    threshold: 80
    required: false

parallel: true
```

## Full Workflow Example

```yaml
name: Service Standards Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  audit:
    name: Audit Services
    runs-on: ubuntu-latest

    permissions:
      contents: read
      pull-requests: write # For PR comments

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run audit
        id: audit
        uses: aksondhi/service-standards-auditor@v1
        with:
          config: .github/standards.yml
          path: ./services
          output: both
          outdir: ./reports
          comment-pr: ${{ github.event_name == 'pull_request' }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: audit-reports
          path: ./reports
          retention-days: 30

      - name: Display results
        if: always()
        run: |
          echo "📊 Audit Results"
          echo "Total Services: ${{ steps.audit.outputs.total-services }}"
          echo "Passed: ${{ steps.audit.outputs.passed-services }}"
          echo "Pass Rate: ${{ steps.audit.outputs.pass-rate }}%"
          echo "Status: ${{ steps.audit.outputs.passed }}"
```

## Permissions

If using `comment-pr: true`, ensure your workflow has the `pull-requests: write` permission:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## Troubleshooting

### Action fails to find services

- Ensure the `path` input points to the correct directory
- Check that services have `package.json` files

### PR comments not posting

- Verify `github-token` is provided
- Ensure workflow has `pull-requests: write` permission
- Check that the workflow is running in a pull request context

### Reports not generated

- Check the `outdir` path is writable
- Verify the `output` format is valid (`json`, `md`, `html`, or `both`)

## Local Testing

Test the action locally before committing:

```bash
npm install
npm run build
node dist/action.js
```

## License

MIT
