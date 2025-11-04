# Service Standards Auditor

> A production-ready CLI tool for auditing repositories against engineering best practices and compliance standards.

[![CI](https://github.com/aksondhi/interview-homework-service-standards-auditor/workflows/CI/badge.svg)](https://github.com/aksondhi/interview-homework-service-standards-auditor/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Service Standards Auditor** is a flexible, extensible CLI tool that scans codebases and evaluates them against configurable YAML-based rules. Perfect for enforcing engineering standards across multiple services, microservices, or monorepos.

## ✨ Features

- 🔍 **Automated Scanning** - Discover services in directories with intelligent detection
- ⚙️ **YAML Configuration** - Define compliance rules in a human-readable format
- 📊 **Multiple Report Formats** - JSON, Markdown, and HTML with charts
- 🚀 **Parallel Execution** - Fast auditing with concurrent service processing
- 🧪 **Extensible Rule System** - Easy to add custom compliance checks
- 📈 **Rich Reporting** - Detailed compliance scores, statistics, and visualizations
- 🎯 **Built-in Rules** - File existence, code coverage, semantic versioning
- 🔧 **TypeScript** - Type-safe codebase with 95%+ test coverage

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/aksondhi/interview-homework-service-standards-auditor.git
cd interview-homework-service-standards-auditor

# Install dependencies
npm ci

# Build the project
npm run build

# Link for global usage (optional)
npm link
```

## 🚀 Quick Start

### CLI Usage

```bash
# Audit services with a configuration file
ssa --path ./services --config rules.yml --output md

# Audit with JSON output
ssa --path ./my-services --config config.yml --output json --outdir ./reports

# Generate both JSON and Markdown reports
ssa --path . --config standards.yml --output both

# Generate interactive HTML report
ssa --path ./services --config rules.yml --output html
```

### GitHub Action Usage

Use this tool directly in your GitHub Actions workflows:

```yaml
- uses: aksondhi/service-standards-auditor@v1
  with:
    config: .github/standards.yml
    path: ./services
    output: both
    comment-pr: true
```

📖 **See [GitHub Action Documentation](.github/ACTION_USAGE.md) for complete usage examples and configuration options.**

### Using the Binary Aliases

The tool provides two binary aliases:

- `service-standards-auditor` - Full name
- `ssa` - Short alias (recommended)

### Example: Audit the Included Services

```bash
npm start -- --path examples/services --config examples/comprehensive-rules.yml --output html
```

This will generate an HTML report in `./reports/` showing:

- ✅ **compliant-service** - Passes all standards
- ❌ **non-compliant-service** - Fails several rules

## 📋 Command-Line Options

| Option     | Alias | Description                                    | Required | Default     |
| ---------- | ----- | ---------------------------------------------- | -------- | ----------- |
| `--path`   | `-p`  | Path to service(s) directory                   | ✅       | -           |
| `--config` | `-c`  | Path to YAML config file                       | ✅       | -           |
| `--output` | `-o`  | Report format: `json`, `md`, `html`, or `both` | ✅       | -           |
| `--outdir` | `-d`  | Output directory for reports                   | ❌       | `./reports` |

## ⚙️ Configuration

### Configuration File Format

Create a YAML file defining your compliance rules:

```yaml
# rules.yml
name: 'Engineering Standards'
description: 'Core compliance rules for all services'

# Global options
options:
  parallel: true # Enable parallel execution
  failFast: false # Continue even if rules fail

# Define compliance rules
rules:
  - name: 'README Required'
    type: 'file-exists'
    target: 'README.md'
    required: true

  - name: 'Dockerfile Required'
    type: 'file-exists'
    target: 'Dockerfile'
    required: true

  - name: 'Tests Directory'
    type: 'file-exists'
    target: 'tests/'
    required: true

  - name: 'Code Coverage 80%'
    type: 'coverage'
    threshold: 80
    required: true

  - name: 'Semantic Versioning'
    type: 'semver'
    target: 'package.json'
    required: true
```

### Available Rule Types

#### 1. **file-exists** - Check for file or directory presence

```yaml
- name: 'CI Configuration'
  type: 'file-exists'
  target: '.github/workflows/ci.yml'
  required: true
```

Supports glob patterns:

```yaml
- name: 'Test Files Present'
  type: 'file-exists'
  target: 'tests/**/*.test.ts'
  required: true
```

#### 2. **coverage** - Validate code coverage thresholds

```yaml
- name: 'High Test Coverage'
  type: 'coverage'
  threshold: 80 # Minimum percentage required
  required: true
```

Expects a `coverage/coverage-summary.json` file (Jest format).

#### 3. **semver** - Validate semantic versioning

```yaml
- name: 'Valid Package Version'
  type: 'semver'
  target: 'package.json' # File containing version field
  required: true
```

## 📊 Report Formats

### JSON Report

Structured data perfect for CI/CD integration:

```json
{
  "summary": {
    "totalServices": 2,
    "compliantServices": 1,
    "nonCompliantServices": 1,
    "overallScore": 75.5,
    "timestamp": "2025-11-03T19:30:00.000Z"
  },
  "services": [
    {
      "name": "user-service",
      "path": "/path/to/user-service",
      "score": 100,
      "status": "compliant",
      "results": [
        {
          "ruleName": "README Required",
          "passed": true,
          "message": "File exists: README.md"
        }
      ]
    }
  ]
}
```

### Markdown Report

Human-readable report with tables and status indicators:

```markdown
# Service Standards Audit Report

**Generated:** 2025-11-03 19:30:00

## Summary

| Metric         | Value |
| -------------- | ----- |
| Total Services | 2     |
| Compliant      | 1 ✅  |
| Non-Compliant  | 1 ❌  |
| Overall Score  | 75.5% |

## Service Results

### user-service ✅

**Score:** 100% | **Status:** Compliant

| Rule                | Status  | Details                 |
| ------------------- | ------- | ----------------------- |
| README Required     | ✅ Pass | File exists: README.md  |
| Dockerfile Required | ✅ Pass | File exists: Dockerfile |
```

### HTML Report

Interactive HTML report with:

- 📈 Visual compliance charts (Chart.js)
- 📋 Detailed service breakdowns with collapsible sections
- 🎨 Color-coded compliance status
- 📱 Responsive design
- 🔍 Filterable and sortable tables

Features include:

- Overall compliance pie chart
- Service score bar chart
- Individual service drill-down
- Export functionality
- Print-friendly layout

## 🏗️ Architecture

### Project Structure

```
src/
├── cli.ts                    # CLI entry point (Commander.js)
├── auditor/                  # Orchestration layer
│   └── auditor.ts           # Main audit coordinator
├── config/                   # Configuration parsing
│   ├── parser.ts            # YAML config loader & validator
│   └── schema.ts            # Zod validation schemas
├── rules/                    # Rule system
│   ├── base-rule.ts         # Abstract rule base class
│   ├── rule-engine.ts       # Rule execution engine
│   ├── rule-factory.ts      # Rule instantiation factory
│   └── implementations/     # Built-in rules
│       ├── file-exists-rule.ts
│       ├── coverage-rule.ts
│       └── semver-rule.ts
├── scanner/                  # Service discovery
│   └── service-scanner.ts   # File system scanner with ignore logic
├── reporters/                # Report generation
│   ├── base-reporter.ts     # Reporter interface
│   ├── json-reporter.ts     # JSON output
│   ├── markdown-reporter.ts # Markdown output
│   ├── html-reporter.ts     # HTML output (Handlebars templates)
│   └── reporter-factory.ts  # Reporter creation factory
├── templates/                # Report templates
│   └── report-template.hbs  # Handlebars HTML template
└── utils/                    # Utilities
    └── logger.ts            # Structured logging (debug module)
```

### Key Design Patterns

- **Strategy Pattern** - Pluggable rule implementations via `BaseRule` interface
- **Factory Pattern** - Rule and reporter creation through dedicated factories
- **Template Method** - Base rule and reporter abstractions define workflow
- **Dependency Injection** - Testable, modular components with clear boundaries

### Technology Stack

- **TypeScript 5.9** - Type-safe development with strict mode
- **Node.js 22+** - Latest LTS with ES modules
- **Commander.js** - CLI argument parsing
- **Zod** - Runtime schema validation
- **YAML** - Human-friendly configuration format
- **Jest 30** - Testing framework with 95%+ coverage
- **Handlebars** - HTML template engine
- **Chart.js** - Data visualization
- **ESLint + Prettier** - Code quality and formatting

## 🧪 Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- scanner.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should audit"
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking (via build)
npm run build
```

### Test Coverage

Current coverage: **95%+ statements, 82%+ branches, 96%+ functions**

Coverage thresholds enforced:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

### Development Workflow

```bash
# Development mode with auto-reload
npm run dev -- --path examples/services --config examples/basic-rules.yml --output json

# Build and test
npm run build && npm test

# Run linting before commit (automatic via Husky)
npm run lint
```

### Pre-commit Hooks

The project uses Husky and lint-staged to ensure code quality:

- Runs ESLint on staged files
- Runs Prettier for formatting
- Runs full test suite before commit

## 📝 Examples

The repository includes example services and configurations in the `examples/` directory.

### Example Configurations

#### 1. Basic Rules (`examples/basic-rules.yml`)

Minimal ruleset checking essential files:

```bash
ssa --path examples/services --config examples/basic-rules.yml --output md
```

#### 2. Minimal Rules (`examples/minimal-rules.yml`)

Single rule for quick validation:

```bash
ssa --path examples/services --config examples/minimal-rules.yml --output json
```

#### 3. Comprehensive Rules (`examples/comprehensive-rules.yml`)

Full compliance audit with all rule types:

```bash
ssa --path examples/services --config examples/comprehensive-rules.yml --output html
```

### Example Services

Located in `examples/services/`:

#### compliant-service/

Fully compliant example service with:

- ✅ README.md with proper documentation
- ✅ Dockerfile for containerization
- ✅ tests/ directory with test files
- ✅ Code coverage above 80%
- ✅ package.json with semantic version

#### non-compliant-service/

Deliberately non-compliant service missing:

- ❌ No README.md
- ❌ No Dockerfile
- ❌ No tests directory
- ❌ No coverage report
- ❌ Invalid version in package.json

### Running Example Audits

```bash
# Quick test with minimal rules
npm start -- --path examples/services/compliant-service --config examples/minimal-rules.yml --output json

# Full audit with HTML report
npm start -- --path examples/services --config examples/comprehensive-rules.yml --output html

# Compare compliant vs non-compliant
npm start -- --path examples/services --config examples/basic-rules.yml --output both
```

## 🚀 CI/CD Integration

### GitHub Actions

Example workflow for auditing on every push:

```yaml
name: Standards Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install SSA
        run: |
          git clone https://github.com/aksondhi/interview-homework-service-standards-auditor.git ssa
          cd ssa && npm ci && npm run build && npm link

      - name: Run Audit
        run: ssa --path . --config .standards.yml --output json

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: reports/

      - name: Check Compliance
        run: |
          SCORE=$(jq '.summary.overallScore' reports/audit-report.json)
          if (( $(echo "$SCORE < 80" | bc -l) )); then
            echo "❌ Compliance score $SCORE% is below 80%"
            exit 1
          fi
          echo "✅ Compliance score: $SCORE%"
```

### Integration with Other CI Systems

<details>
<summary>GitLab CI</summary>

```yaml
audit:
  stage: test
  image: node:22
  script:
    - npm ci
    - npm run build
    - ./dist/cli.js --path . --config .standards.yml --output json
  artifacts:
    paths:
      - reports/
```

</details>

<details>
<summary>Jenkins</summary>

```groovy
pipeline {
  agent { docker { image 'node:22' } }
  stages {
    stage('Audit') {
      steps {
        sh 'npm ci && npm run build'
        sh 'node dist/cli.js --path . --config .standards.yml --output json'
        publishHTML([
          reportDir: 'reports',
          reportFiles: '*.html',
          reportName: 'Standards Audit'
        ])
      }
    }
  }
}
```

</details>

## 🎯 Extending the Tool

### Adding a Custom Rule

1. **Create a new rule class** extending `BaseRule`:

```typescript
// src/rules/implementations/custom-rule.ts
import { BaseRule } from '../base-rule.js';
import { RuleResult, Service } from '../../types/common.js';
import { readFile } from 'fs/promises';

export class CustomRule extends BaseRule {
  private threshold: number;

  constructor(name: string, required: boolean, config: any) {
    super(name, required);
    this.threshold = config.threshold || 0;
  }

  async evaluate(service: Service): Promise<RuleResult> {
    try {
      // Your custom rule logic here
      const result = await this.checkSomething(service.path);

      return {
        ruleName: this.name,
        passed: result >= this.threshold,
        message:
          result >= this.threshold
            ? `✅ Check passed with score ${result}`
            : `❌ Check failed with score ${result}, expected ${this.threshold}`,
        details: {
          score: result,
          threshold: this.threshold,
        },
      };
    } catch (error) {
      return {
        ruleName: this.name,
        passed: false,
        message: `Error: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  private async checkSomething(path: string): Promise<number> {
    // Implement your check logic
    return 0;
  }
}
```

2. **Register in `rule-factory.ts`**:

```typescript
import { CustomRule } from './implementations/custom-rule.js';

// In createRule method
case 'custom':
  return new CustomRule(config.name, config.required || false, config);
```

3. **Add to your YAML config**:

```yaml
rules:
  - name: 'My Custom Rule'
    type: 'custom'
    threshold: 50
    required: true
```

4. **Write tests**:

```typescript
// tests/rules/custom-rule.test.ts
describe('CustomRule', () => {
  it('should pass when threshold is met', async () => {
    const rule = new CustomRule('Test', true, { threshold: 50 });
    const result = await rule.evaluate(mockService);
    expect(result.passed).toBe(true);
  });
});
```

### Adding a Custom Reporter

1. **Extend `BaseReporter`**:

```typescript
// src/reporters/custom-reporter.ts
import { BaseReporter } from './base-reporter.js';
import { AuditReport } from '../types/result.js';

export class CustomReporter extends BaseReporter {
  async generate(report: AuditReport, outputPath: string): Promise<void> {
    // Generate your custom format
    const content = this.formatReport(report);
    await writeFile(outputPath, content, 'utf-8');
  }

  getFormat(): string {
    return 'custom';
  }

  getExtension(): string {
    return '.custom';
  }

  private formatReport(report: AuditReport): string {
    // Your formatting logic
    return '';
  }
}
```

2. **Register in `reporter-factory.ts`** and use it!

## 🧩 Project Context

This project was developed as a **take-home assignment** for an **Engineering Practices & Standards** role, demonstrating:

### Technical Skills

- ✅ Production-quality TypeScript architecture with strict typing
- ✅ Test-Driven Development (TDD) methodology with 95%+ coverage
- ✅ Comprehensive error handling and edge case management
- ✅ Performance optimization with parallel execution
- ✅ Clean code principles and SOLID design patterns

### Engineering Practices

- ✅ CI/CD pipeline with GitHub Actions
- ✅ Automated testing and coverage reporting
- ✅ Code quality tooling (ESLint, Prettier, Husky)
- ✅ Semantic versioning and changelog management
- ✅ Comprehensive documentation

### System Design

- ✅ Extensible plugin architecture (Strategy + Factory patterns)
- ✅ Modular, testable components with clear boundaries
- ✅ Separation of concerns (scanning, rules, reporting)
- ✅ Configurable, YAML-driven behavior
- ✅ Multiple output formats for different use cases

### Bonus Features Implemented

- ✅ HTML report generation with interactive charts
- ✅ Parallel execution for performance
- ✅ Complete example repository with test services
- ✅ GitHub Actions CI/CD workflows
- ✅ Release automation (commented for interview context)

## 📚 Additional Documentation

- [`RUBRIC.md`](RUBRIC.md) - Internal scoring rubric and evaluation criteria
- [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) - TDD approach and implementation plan
- [`TIMESTAMPS.md`](TIMESTAMPS.md) - Commit timeline reference
- [`CHANGELOG.md`](CHANGELOG.md) - Version history
- [`examples/README.md`](examples/README.md) - Example configurations guide

## 🤝 Contributing

This is an interview homework project, but feedback and suggestions are welcome! Feel free to:

- Open issues for bugs or enhancement ideas
- Submit pull requests with improvements
- Share how you would approach similar problems

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## ⏱️ Development Timeline

**Timebox:** 3-4 days (November 2025)  
**Methodology:** Test-Driven Development (TDD)  
**Focus:** Architecture, code quality, testing, and documentation

**Final Statistics:**

- 📝 155 tests (14 test suites)
- 📊 95.66% statement coverage, 82.24% branch coverage
- 🏗️ 1,500+ lines of production code
- 📚 2,000+ lines of test code
- 🎯 32 atomic commits with realistic timeline

---

**Built with ❤️ using TDD, TypeScript, and best practices**
