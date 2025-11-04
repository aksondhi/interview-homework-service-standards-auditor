# Architecture Overview

## System Design

Service Standards Auditor follows a **modular, plugin-based architecture** designed for extensibility, testability, and maintainability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│                        (cli.ts)                              │
│  - Argument parsing (Commander.js)                           │
│  - User input validation                                     │
│  - Output coordination                                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Auditor (Orchestrator)                    │
│                     (auditor.ts)                             │
│  - Coordinates all components                                │
│  - Manages audit workflow                                    │
│  - Aggregates results                                        │
└─────┬──────────────────┬─────────────────────┬──────────────┘
      │                  │                     │
      ▼                  ▼                     ▼
┌───────────┐    ┌──────────────┐    ┌─────────────────┐
│  Scanner  │    │ Rule Engine  │    │    Reporters    │
│           │    │              │    │                 │
│ Discovers │    │  Executes    │    │  Generates      │
│ Services  │    │  Rules       │    │  Reports        │
└─────┬─────┘    └──────┬───────┘    └────────┬────────┘
      │                  │                     │
      ▼                  ▼                     ▼
┌───────────┐    ┌──────────────┐    ┌─────────────────┐
│ Directory │    │ Rule Factory │    │ Report Factory  │
│ Traversal │    │              │    │                 │
│           │    │ - File Exists│    │ - JSON Reporter │
│ - Ignores │    │ - Coverage   │    │ - MD Reporter   │
│ - Depth   │    │ - Semver     │    │ - HTML Reporter │
└───────────┘    └──────────────┘    └─────────────────┘
      │                  │                     │
      ▼                  ▼                     ▼
┌───────────┐    ┌──────────────┐    ┌─────────────────┐
│Config     │    │  Base Rule   │    │  Base Reporter  │
│Parser     │    │  Interface   │    │  Interface      │
│           │    │              │    │                 │
│ YAML →    │    │ Strategy     │    │ Template Method │
│ Config    │    │ Pattern      │    │ Pattern         │
└───────────┘    └──────────────┘    └─────────────────┘
```

## Core Components

### 1. CLI Layer (`src/cli.ts`)

**Responsibility:** User interface and input/output coordination

**Key Features:**

- Command-line argument parsing with Commander.js
- Input validation and error handling
- Coordinates auditor and reporter components
- Provides user feedback

**Design Decision:** Keep CLI thin - it's purely an interface layer that delegates to the auditor.

### 2. Configuration System (`src/config/`)

**Responsibility:** Parse and validate YAML configuration files

**Components:**

- `parser.ts` - YAML file loading and parsing
- `schema.ts` - Zod validation schemas

**Design Decision:** Use Zod for runtime validation to catch configuration errors early with helpful error messages.

### 3. Service Scanner (`src/scanner/`)

**Responsibility:** Discover services in a directory tree

**Key Features:**

- Recursive directory traversal with depth limits
- Intelligent service detection (package.json presence)
- Configurable ignore patterns (node_modules, dist, etc.)
- Metadata extraction from package.json

**Design Decision:** Use `fast-glob` for efficient file system operations with pattern matching.

### 4. Rule System (`src/rules/`)

**Architecture Pattern:** Strategy Pattern + Factory Pattern

**Components:**

- `base-rule.ts` - Abstract base class defining rule interface
- `rule-engine.ts` - Executes rules against services (supports parallel execution)
- `rule-factory.ts` - Creates rule instances from configuration
- `implementations/` - Concrete rule implementations

**Rule Interface:**

```typescript
abstract class BaseRule {
  abstract evaluate(service: Service): Promise<RuleResult>;
}
```

**Design Decision:** Each rule is independently testable and can be executed in isolation or parallel.

### 5. Reporter System (`src/reporters/`)

**Architecture Pattern:** Template Method Pattern + Factory Pattern

**Components:**

- `base-reporter.ts` - Abstract base class for reporters
- `reporter-factory.ts` - Creates reporter instances
- `json-reporter.ts` - JSON output
- `markdown-reporter.ts` - Markdown output
- `html-reporter.ts` - HTML output with Handlebars templates

**Reporter Interface:**

```typescript
abstract class BaseReporter {
  abstract generate(report: AuditReport, outputPath: string): Promise<void>;
  abstract getFormat(): string;
  abstract getExtension(): string;
}
```

**Design Decision:** Reporters are independent and can be easily added without modifying existing code (Open/Closed Principle).

### 6. Auditor (`src/auditor/`)

**Responsibility:** Orchestrate the entire audit process

**Workflow:**

1. Parse configuration
2. Scan for services
3. Execute rules against each service
4. Aggregate results
5. Generate reports

**Design Decision:** The auditor is the single entry point that coordinates all components, making the system easy to test end-to-end.

## Design Patterns

### Strategy Pattern (Rules)

Each rule implements the same interface but with different evaluation logic. Rules can be swapped or added without changing the rule engine.

**Benefits:**

- Easy to add new rule types
- Rules are independently testable
- Runtime rule selection based on configuration

### Factory Pattern (Rules & Reporters)

Factories create instances based on type strings from configuration.

**Benefits:**

- Centralized object creation
- Easy to extend with new types
- Type safety with TypeScript

### Template Method Pattern (Reporters)

Base reporter defines the workflow; subclasses implement specific formats.

**Benefits:**

- Consistent reporter interface
- Shared utility methods (directory creation, file writing)
- Clear extension points

## Data Flow

```
Config File (YAML)
    ↓
Config Parser (Zod validation)
    ↓
Auditor receives validated config
    ↓
Scanner discovers services → [Service, Service, ...]
    ↓
Rule Factory creates rule instances → [Rule, Rule, ...]
    ↓
Rule Engine executes rules → [RuleResult, RuleResult, ...]
    ↓
Auditor aggregates results → AuditReport
    ↓
Reporter Factory creates reporters → [Reporter, Reporter, ...]
    ↓
Reporters generate output files → [JSON, MD, HTML]
```

## Extensibility Points

### Adding a New Rule Type

1. Create new class extending `BaseRule` in `src/rules/implementations/`
2. Implement `evaluate()` method
3. Register in `RuleFactory.createRule()`
4. Add configuration schema to `src/config/schema.ts`
5. Write tests in `tests/rules/`

### Adding a New Reporter Format

1. Create new class extending `BaseReporter` in `src/reporters/`
2. Implement `generate()`, `getFormat()`, `getExtension()`
3. Register in `ReporterFactory.createReporter()`
4. Write tests in `tests/reporters/`

### Adding New Scanner Capabilities

Modify `ServiceScanner` to:

- Detect different project types (Python, Ruby, etc.)
- Extract additional metadata
- Support custom detection patterns

## Concurrency

The system supports parallel execution at two levels:

1. **Service-level parallelism** - Multiple services scanned concurrently
2. **Rule-level parallelism** - Multiple rules executed concurrently per service

**Configuration:**

```yaml
options:
  parallel: true # Enable parallel execution
```

**Implementation:** Uses `Promise.all()` for concurrent execution.

## Error Handling Strategy

1. **Validation Errors** - Caught early at config parsing (Zod)
2. **File System Errors** - Graceful degradation (service skipped with warning)
3. **Rule Evaluation Errors** - Individual rule failures don't stop audit
4. **Reporter Errors** - Each reporter operates independently

**Design Decision:** Fail gracefully and continue processing when possible. Provide detailed error messages to users.

## Testing Strategy

- **Unit Tests** - Each component tested in isolation
- **Integration Tests** - CLI workflow tested end-to-end
- **Test Coverage** - 95%+ statements, 80%+ branches
- **Mocking** - File system operations mocked for consistent tests
- **TDD Approach** - Tests written before implementation

## Performance Considerations

1. **File Scanning** - Use `fast-glob` with efficient patterns
2. **Parallel Execution** - Configurable for faster audits
3. **Caching** - Service metadata cached after first read
4. **Lazy Loading** - Components instantiated only when needed

## Type Safety

- **Strict TypeScript** - All code uses strict mode
- **Runtime Validation** - Zod ensures config matches types
- **Type Inference** - Minimal type annotations needed
- **No `any` types** - Explicit typing throughout

## Dependencies

### Production

- `commander` - CLI argument parsing
- `zod` - Schema validation
- `yaml` - Configuration parsing
- `fast-glob` - File system operations
- `semver` - Version validation
- `handlebars` - HTML templating
- `debug` - Structured logging

### Development

- `jest` - Testing framework
- `ts-jest` - TypeScript Jest support
- `eslint` - Linting
- `prettier` - Code formatting
- `husky` - Git hooks
- `lint-staged` - Pre-commit linting

## Architectural Decisions

### Why ES Modules?

- Modern Node.js standard (22+)
- Better tree-shaking
- Native browser compatibility
- Future-proof

### Why Zod over JSON Schema?

- Type-safe validation
- Better TypeScript integration
- Runtime and compile-time safety
- Clear error messages

### Why Handlebars for HTML?

- Logic-less templates
- Simple syntax
- Wide adoption
- Easy to maintain

### Why Factory Pattern?

- Centralized object creation
- Easy to add new types
- Configuration-driven
- Type-safe instantiation

## Future Enhancements

Potential areas for extension:

1. **Plugin System** - Load rules from external npm packages
2. **Custom Parsers** - Support JSON/TOML config formats
3. **Remote Repos** - Audit GitHub repositories directly
4. **Incremental Audits** - Only check changed services
5. **Rule Dependencies** - Rules that depend on other rule results
6. **Webhooks** - POST results to external services
7. **Watch Mode** - Continuous auditing during development
8. **Machine Learning** - Anomaly detection in codebases

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Author:** Service Standards Auditor Team
