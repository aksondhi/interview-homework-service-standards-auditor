# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-04

### Added

- **GitHub Action Integration**: Reusable GitHub Action for CI/CD workflows
  - Action inputs for all CLI options
  - Action outputs for pass/fail status and metrics
  - PR comment support with audit results
  - GitHub Actions job summaries with formatted tables
- **CLI Progress Indicators**: Enhanced user experience
  - Spinner for loading operations (ora)
  - Progress tracking with TTY detection
  - Automatic disabling in CI/CD environments
- **End-to-End Testing**: Comprehensive E2E test suite
  - 13 E2E tests covering complete CLI workflows
  - Process spawning and cleanup
  - Multi-format validation
  - Error scenario coverage
- **Performance Optimizations**:
  - Controlled concurrency for parallel operations
  - Batch processing utilities
  - Optimized file system operations

### Enhanced

- **Architecture Documentation**: Added comprehensive docs
  - ARCHITECTURE.md with system design
  - EXTENDING.md for plugin development
  - RULES.md for rule implementation guide
- **Error Handling**: Custom error classes with context
  - AuditorError, ConfigurationError, ServiceScanError
  - RuleEvaluationError, ReportGenerationError, FileSystemError
  - Formatted error messages with context
- **Code Documentation**: JSDoc comments for all public APIs
- **Test Coverage**: Increased to 94.83% statements, 82.06% branches
  - 248 total tests across 18 test suites
  - Unit, integration, and E2E test coverage

### Fixed

- Template file copying in build process
- Process cleanup in E2E tests to prevent hanging
- Progress callback integration in Auditor

### Infrastructure

- Added @actions/core and @actions/github dependencies
- Added ora and cli-progress for terminal UI
- Build script now copies Handlebars templates
- Jest timeout configuration for E2E tests

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

[Unreleased]: https://github.com/aksondhi/interview-homework-service-standards-auditor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/aksondhi/interview-homework-service-standards-auditor/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/aksondhi/interview-homework-service-standards-auditor/releases/tag/v0.1.0
