# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-03

### Added

- Initial release of Service Standards Auditor
- CLI tool with `service-standards-auditor` and `ssa` commands
- YAML-based configuration system with Zod schema validation
- Extensible rule engine with base rule abstraction
- Three built-in rule types:
  - File existence checks (`file-exists`)
  - Code coverage validation (`coverage`)
  - Semantic versioning checks (`semver`)
- Multi-format reporting:
  - JSON output
  - Markdown reports with summary tables
  - HTML reports with Chart.js visualizations
- Service scanner with multi-service support
- Parallel execution for improved performance
- Structured logging with debug mode
- Comprehensive test suite (155 tests, 82%+ coverage)
- GitHub Actions CI workflow for Node.js 22+
- Example configurations and test services
- Full TypeScript support with strict mode
- ESLint and Prettier for code quality

### Infrastructure

- Node.js 22+ requirement
- ES modules (ESM) support
- Commander.js for CLI argument parsing
- Handlebars templates for HTML reports
- Fast-glob for efficient file scanning
- Husky and lint-staged for pre-commit hooks

[Unreleased]: https://github.com/aksondhi/interview-homework-service-standards-auditor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aksondhi/interview-homework-service-standards-auditor/releases/tag/v0.1.0
