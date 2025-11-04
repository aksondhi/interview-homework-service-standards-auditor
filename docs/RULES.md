# Rule System Documentation

## Overview

The rule system is the core of the Service Standards Auditor. It provides a flexible, extensible framework for defining and executing compliance checks against services.

## Rule Architecture

### Base Rule Interface

All rules extend the `BaseRule` abstract class:

```typescript
abstract class BaseRule {
  constructor(
    public readonly name: string,
    public readonly required: boolean
  ) {}

  abstract evaluate(service: Service): Promise<RuleResult>;
}
```

### Rule Result Structure

```typescript
interface RuleResult {
  ruleName: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}
```

## Built-in Rules

### 1. File Exists Rule

**Type:** `file-exists`

**Purpose:** Check for the presence of files or directories in a service.

**Configuration:**

```yaml
- name: 'README Required'
  type: 'file-exists'
  target: 'README.md'
  required: true
```

**Glob Pattern Support:**

```yaml
- name: 'Test Files Present'
  type: 'file-exists'
  target: 'tests/**/*.test.ts'
  required: true
```

**Implementation Details:**

- Uses `fast-glob` for pattern matching
- Supports files and directories
- Returns list of matched files in details
- Handles missing paths gracefully

**Example Results:**

```json
{
  "ruleName": "README Required",
  "passed": true,
  "message": "File exists: README.md",
  "details": {
    "target": "README.md",
    "found": true
  }
}
```

**Common Use Cases:**

- Documentation files (README.md, CHANGELOG.md)
- Configuration files (.eslintrc, tsconfig.json)
- Docker files (Dockerfile, docker-compose.yml)
- Test directories (tests/, **tests**/)
- CI configuration (.github/workflows/)

### 2. Coverage Rule

**Type:** `coverage`

**Purpose:** Validate code coverage meets a minimum threshold.

**Configuration:**

```yaml
- name: 'High Test Coverage'
  type: 'coverage'
  threshold: 80
  required: true
```

**Expected File:** `coverage/coverage-summary.json` (Jest format)

**Coverage File Format:**

```json
{
  "total": {
    "lines": { "pct": 95.5 },
    "statements": { "pct": 94.2 },
    "functions": { "pct": 96.0 },
    "branches": { "pct": 82.3 }
  }
}
```

**Implementation Details:**

- Reads Jest coverage summary
- Calculates average of all metrics
- Compares against threshold
- Provides breakdown of all metrics

**Example Results:**

```json
{
  "ruleName": "High Test Coverage",
  "passed": true,
  "message": "Code coverage (88.5%) meets threshold (80%)",
  "details": {
    "threshold": 80,
    "actual": 88.5,
    "breakdown": {
      "lines": 95.5,
      "statements": 94.2,
      "functions": 96.0,
      "branches": 82.3
    }
  }
}
```

**Common Use Cases:**

- Enforce minimum test coverage
- Ensure code quality standards
- Prevent untested code from merging

### 3. Semver Rule

**Type:** `semver`

**Purpose:** Validate semantic versioning in package.json or other version files.

**Configuration:**

```yaml
- name: 'Valid Package Version'
  type: 'semver'
  target: 'package.json'
  required: true
```

**Implementation Details:**

- Uses `semver` library for validation
- Reads version field from JSON files
- Validates format (MAJOR.MINOR.PATCH)
- Supports pre-release and build metadata

**Valid Semver Formats:**

- `1.0.0` - Standard version
- `1.0.0-alpha` - Pre-release
- `1.0.0-beta.1` - Pre-release with number
- `1.0.0+build.123` - Build metadata
- `1.0.0-rc.1+build.456` - Combined

**Example Results:**

```json
{
  "ruleName": "Valid Package Version",
  "passed": true,
  "message": "Valid semantic version: 1.0.0",
  "details": {
    "version": "1.0.0",
    "target": "package.json"
  }
}
```

**Common Use Cases:**

- Package.json versioning
- API versioning
- Release management
- Dependency management

## Rule Execution

### Rule Engine

The `RuleEngine` class orchestrates rule execution:

```typescript
class RuleEngine {
  registerRule(rule: BaseRule): void;
  async executeRules(service: Service, parallel?: boolean): Promise<RuleResult[]>;
}
```

### Execution Modes

#### Sequential Execution (Default)

```typescript
const results = await engine.executeRules(service, false);
```

- Rules run one at a time
- Predictable order
- Easier debugging

#### Parallel Execution

```typescript
const results = await engine.executeRules(service, true);
```

- Rules run concurrently
- Faster for independent rules
- Better performance

**Configuration:**

```yaml
options:
  parallel: true # Enable parallel execution
```

### Error Handling

Rules handle errors gracefully:

```typescript
async evaluate(service: Service): Promise<RuleResult> {
  try {
    // Rule logic
  } catch (error) {
    return {
      ruleName: this.name,
      passed: false,
      message: `Error: ${error.message}`,
      details: { error: error.message }
    };
  }
}
```

## Creating Custom Rules

### Step 1: Implement the Rule Class

```typescript
// src/rules/implementations/my-custom-rule.ts
import { BaseRule } from '../base-rule.js';
import { RuleResult, Service } from '../../types/common.js';

export class MyCustomRule extends BaseRule {
  private threshold: number;

  constructor(name: string, required: boolean, config: any) {
    super(name, required);
    this.threshold = config.threshold || 0;
  }

  async evaluate(service: Service): Promise<RuleResult> {
    try {
      // Your custom validation logic
      const result = await this.performCheck(service);

      return {
        ruleName: this.name,
        passed: result >= this.threshold,
        message:
          result >= this.threshold
            ? `✅ Check passed with score ${result}`
            : `❌ Check failed: ${result} < ${this.threshold}`,
        details: {
          score: result,
          threshold: this.threshold,
        },
      };
    } catch (error) {
      return {
        ruleName: this.name,
        passed: false,
        message: `Error evaluating rule: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  private async performCheck(service: Service): Promise<number> {
    // Implement your check logic
    // Return a numeric score or boolean
    return 0;
  }
}
```

### Step 2: Register in Rule Factory

```typescript
// src/rules/rule-factory.ts
import { MyCustomRule } from './implementations/my-custom-rule.js';

export class RuleFactory {
  static createRule(config: RuleConfig): BaseRule {
    switch (config.type) {
      case 'file-exists':
        return new FileExistsRule(config.name, config.required || false, config);
      case 'coverage':
        return new CoverageRule(config.name, config.required || false, config);
      case 'semver':
        return new SemverRule(config.name, config.required || false, config);
      case 'my-custom': // Add your rule type
        return new MyCustomRule(config.name, config.required || false, config);
      default:
        throw new Error(`Unsupported rule type: ${config.type}`);
    }
  }
}
```

### Step 3: Add Configuration Schema

```typescript
// src/config/schema.ts
const ruleConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['file-exists', 'coverage', 'semver', 'my-custom']), // Add type
  target: z.string().optional(),
  threshold: z.number().optional(),
  required: z.boolean().optional(),
});
```

### Step 4: Write Tests

```typescript
// tests/rules/my-custom-rule.test.ts
import { MyCustomRule } from '../../src/rules/implementations/my-custom-rule';

describe('MyCustomRule', () => {
  it('should pass when threshold is met', async () => {
    const rule = new MyCustomRule('Test Rule', true, { threshold: 50 });
    const service = { name: 'test', path: '/test', type: 'node' };

    const result = await rule.evaluate(service);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('passed');
  });

  it('should fail when threshold not met', async () => {
    const rule = new MyCustomRule('Test Rule', true, { threshold: 100 });
    const service = { name: 'test', path: '/test', type: 'node' };

    const result = await rule.evaluate(service);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('failed');
  });

  it('should handle errors gracefully', async () => {
    const rule = new MyCustomRule('Test Rule', true, { threshold: 50 });
    const invalidService = null;

    const result = await rule.evaluate(invalidService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('Error');
  });
});
```

### Step 5: Use in Configuration

```yaml
# config.yml
rules:
  - name: 'My Custom Check'
    type: 'my-custom'
    threshold: 75
    required: true
```

## Rule Best Practices

### 1. Single Responsibility

Each rule should check one thing:

✅ **Good:**

```yaml
- name: 'README Exists'
  type: 'file-exists'
  target: 'README.md'

- name: 'Dockerfile Exists'
  type: 'file-exists'
  target: 'Dockerfile'
```

❌ **Bad:**

```yaml
- name: 'All Documentation'
  type: 'multi-check'
  targets: ['README.md', 'Dockerfile', 'CHANGELOG.md']
```

### 2. Descriptive Names

Use clear, descriptive rule names:

✅ **Good:** `"Code Coverage Above 80%"`  
❌ **Bad:** `"Coverage"`

### 3. Helpful Messages

Provide actionable error messages:

✅ **Good:** `"Missing README.md - add documentation to the root directory"`  
❌ **Bad:** `"File not found"`

### 4. Detailed Results

Include context in the details object:

```typescript
{
  passed: false,
  message: "Coverage too low",
  details: {
    expected: 80,
    actual: 65,
    breakdown: {
      lines: 70,
      branches: 60,
      functions: 75,
      statements: 65
    },
    suggestion: "Add tests to improve coverage"
  }
}
```

### 5. Async Operations

Always use async/await for I/O:

```typescript
async evaluate(service: Service): Promise<RuleResult> {
  const exists = await this.fileExists(path);
  // ...
}
```

### 6. Error Handling

Wrap evaluation in try-catch:

```typescript
try {
  // Rule logic
} catch (error) {
  return {
    passed: false,
    message: `Error: ${error.message}`,
    details: { error: error.message },
  };
}
```

## Advanced Topics

### Rule Dependencies

Currently not supported, but could be implemented:

```yaml
rules:
  - name: 'Tests Exist'
    type: 'file-exists'
    target: 'tests/'

  - name: 'Coverage Above 80%'
    type: 'coverage'
    threshold: 80
    depends_on: ['Tests Exist'] # Future feature
```

### Rule Caching

For expensive operations, consider caching:

```typescript
private cache = new Map<string, any>();

async evaluate(service: Service): Promise<RuleResult> {
  const cacheKey = `${service.path}-${this.name}`;
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  const result = await this.performExpensiveCheck(service);
  this.cache.set(cacheKey, result);
  return result;
}
```

### Conditional Rules

Apply rules based on service type:

```yaml
rules:
  - name: 'package.json Required'
    type: 'file-exists'
    target: 'package.json'
    condition: "type === 'node'" # Future feature
```

## Troubleshooting

### Rule Not Executing

1. Check rule is registered in `RuleFactory`
2. Verify rule type in config matches factory case
3. Ensure rule is imported in factory

### Rule Always Fails

1. Check file paths are relative to service root
2. Verify glob patterns are correct
3. Test rule in isolation with unit tests

### Performance Issues

1. Enable parallel execution: `parallel: true`
2. Avoid expensive operations in rules
3. Profile with `DEBUG=ssa:* npm start`

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Maintainer:** Service Standards Auditor Team
