# Extending the Service Standards Auditor

This guide explains how to extend the auditor with custom rules, reporters, and other components.

## Table of Contents

- [Adding Custom Rules](#adding-custom-rules)
- [Adding Custom Reporters](#adding-custom-reporters)
- [Extending the Scanner](#extending-the-scanner)
- [Adding New Configuration Options](#adding-new-configuration-options)
- [Plugin System (Future)](#plugin-system-future)

---

## Adding Custom Rules

### Quick Start

1. Create a new rule class
2. Register in the rule factory
3. Add to configuration schema
4. Write tests
5. Use in your config

### Detailed Example: Git Commit Rule

Let's create a rule that checks if a repository has a minimum number of commits.

#### Step 1: Create the Rule Class

```typescript
// src/rules/implementations/git-commits-rule.ts
import { BaseRule } from '../base-rule.js';
import { RuleResult, Service } from '../../types/common.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitCommitsRule extends BaseRule {
  private minCommits: number;

  constructor(name: string, required: boolean, config: any) {
    super(name, required);
    this.minCommits = config.minCommits || 1;
  }

  async evaluate(service: Service): Promise<RuleResult> {
    try {
      const { stdout } = await execAsync('git rev-list --count HEAD', {
        cwd: service.path,
      });

      const commitCount = parseInt(stdout.trim(), 10);
      const passed = commitCount >= this.minCommits;

      return {
        ruleName: this.name,
        passed,
        message: passed
          ? `Repository has ${commitCount} commits (minimum: ${this.minCommits})`
          : `Repository has only ${commitCount} commits, expected at least ${this.minCommits}`,
        details: {
          commitCount,
          minCommits: this.minCommits,
        },
      };
    } catch (error) {
      return {
        ruleName: this.name,
        passed: false,
        message: `Error checking git commits: ${error.message}`,
        details: { error: error.message },
      };
    }
  }
}
```

#### Step 2: Register in Rule Factory

```typescript
// src/rules/rule-factory.ts
import { GitCommitsRule } from './implementations/git-commits-rule.js';

export class RuleFactory {
  static createRule(config: RuleConfig): BaseRule {
    switch (config.type) {
      case 'file-exists':
        return new FileExistsRule(config.name, config.required || false, config);
      case 'coverage':
        return new CoverageRule(config.name, config.required || false, config);
      case 'semver':
        return new SemverRule(config.name, config.required || false, config);
      case 'git-commits': // Add new rule type
        return new GitCommitsRule(config.name, config.required || false, config);
      default:
        throw new Error(`Unsupported rule type: ${config.type}`);
    }
  }
}
```

#### Step 3: Update Configuration Schema

```typescript
// src/config/schema.ts
const ruleConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['file-exists', 'coverage', 'semver', 'git-commits']), // Add type
  target: z.string().optional(),
  threshold: z.number().optional(),
  minCommits: z.number().optional(), // Add new field
  required: z.boolean().optional(),
});
```

#### Step 4: Write Tests

```typescript
// tests/rules/git-commits-rule.test.ts
import { GitCommitsRule } from '../../src/rules/implementations/git-commits-rule';
import { Service } from '../../src/types/common';

describe('GitCommitsRule', () => {
  const mockService: Service = {
    name: 'test-service',
    path: '/path/to/service',
    type: 'node',
  };

  it('should pass when commit count meets minimum', async () => {
    const rule = new GitCommitsRule('Git Commits', true, { minCommits: 5 });

    // Mock exec to return 10 commits
    jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: '10\n', stderr: '' });
    });

    const result = await rule.evaluate(mockService);

    expect(result.passed).toBe(true);
    expect(result.details?.commitCount).toBe(10);
  });

  it('should fail when commit count below minimum', async () => {
    const rule = new GitCommitsRule('Git Commits', true, { minCommits: 20 });

    jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: '5\n', stderr: '' });
    });

    const result = await rule.evaluate(mockService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('only 5 commits');
  });

  it('should handle git errors gracefully', async () => {
    const rule = new GitCommitsRule('Git Commits', true, { minCommits: 1 });

    jest.spyOn(require('child_process'), 'exec').mockImplementation((cmd, opts, callback) => {
      callback(new Error('Not a git repository'), null);
    });

    const result = await rule.evaluate(mockService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('Error checking git commits');
  });
});
```

#### Step 5: Use in Configuration

```yaml
# config.yml
name: 'Extended Standards'
description: 'Standards with custom git rule'

rules:
  - name: 'Minimum Git History'
    type: 'git-commits'
    minCommits: 10
    required: true
```

---

## Adding Custom Reporters

### Quick Start

1. Create a reporter class extending `BaseReporter`
2. Implement required methods
3. Register in reporter factory
4. Write tests

### Detailed Example: CSV Reporter

Let's create a reporter that outputs results as CSV.

#### Step 1: Create the Reporter Class

```typescript
// src/reporters/csv-reporter.ts
import { BaseReporter } from './base-reporter.js';
import { AuditReport } from '../types/result.js';
import { writeFile } from 'fs/promises';

export class CSVReporter extends BaseReporter {
  async generate(report: AuditReport, outputPath: string): Promise<void> {
    const csv = this.generateCSV(report);
    await this.ensureDirectoryExists(outputPath);
    await writeFile(outputPath, csv, 'utf-8');
  }

  getFormat(): string {
    return 'csv';
  }

  getExtension(): string {
    return '.csv';
  }

  private generateCSV(report: AuditReport): string {
    const lines: string[] = [];

    // Header
    lines.push('Service,Rule,Status,Score,Message');

    // Data rows
    for (const service of report.services) {
      for (const result of service.results) {
        const row = [
          this.escapeCSV(service.name),
          this.escapeCSV(result.ruleName),
          result.passed ? 'PASS' : 'FAIL',
          service.score.toString(),
          this.escapeCSV(result.message),
        ].join(',');
        lines.push(row);
      }
    }

    return lines.join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
```

#### Step 2: Register in Reporter Factory

```typescript
// src/reporters/reporter-factory.ts
import { CSVReporter } from './csv-reporter.js';

export class ReporterFactory {
  static createReporter(format: string): BaseReporter {
    switch (format) {
      case 'json':
        return new JSONReporter();
      case 'md':
        return new MarkdownReporter();
      case 'html':
        return new HTMLReporter();
      case 'csv': // Add new format
        return new CSVReporter();
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  static getSupportedFormats(): string[] {
    return ['json', 'md', 'html', 'csv', 'both'];
  }
}
```

#### Step 3: Update CLI

```typescript
// src/cli.ts
program.option('-o, --output <format>', 'Output format: json, md, html, csv, or both', 'json');
// ...
```

#### Step 4: Write Tests

```typescript
// tests/reporters/csv-reporter.test.ts
import { CSVReporter } from '../../src/reporters/csv-reporter';
import { AuditReport } from '../../src/types/result';

describe('CSVReporter', () => {
  it('should generate CSV with proper headers', async () => {
    const reporter = new CSVReporter();
    const report: AuditReport = {
      summary: {
        /* ... */
      },
      services: [
        {
          name: 'test-service',
          path: '/path',
          score: 100,
          status: 'compliant',
          results: [
            {
              ruleName: 'Test Rule',
              passed: true,
              message: 'All good',
            },
          ],
        },
      ],
    };

    const outputPath = '/tmp/test-report.csv';
    await reporter.generate(report, outputPath);

    const content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('Service,Rule,Status,Score,Message');
    expect(content).toContain('test-service,Test Rule,PASS,100,All good');
  });

  it('should escape special characters', async () => {
    const reporter = new CSVReporter();
    const report: AuditReport = {
      services: [
        {
          name: 'service,with,commas',
          results: [
            {
              ruleName: 'Rule "quoted"',
              message: 'Message\nwith\nnewlines',
              passed: true,
            },
          ],
        },
      ],
    };

    const csv = reporter['generateCSV'](report);
    expect(csv).toContain('"service,with,commas"');
    expect(csv).toContain('"Rule ""quoted"""');
  });
});
```

---

## Extending the Scanner

### Custom Service Detection

Modify `ServiceScanner` to detect additional project types:

```typescript
// src/scanner/service-scanner.ts
export class ServiceScanner {
  async scan(rootPath: string, options?: ScanOptions): Promise<Service[]> {
    // Existing logic...

    // Add custom detection
    const services = await this.detectServices(rootPath, options);
    return services.map((service) => this.enhanceService(service));
  }

  private async enhanceService(service: Service): Promise<Service> {
    // Detect Python projects
    if (await this.fileExists(path.join(service.path, 'pyproject.toml'))) {
      service.type = 'python';
      service.metadata.python = await this.parsePyProject(service.path);
    }

    // Detect Rust projects
    if (await this.fileExists(path.join(service.path, 'Cargo.toml'))) {
      service.type = 'rust';
      service.metadata.rust = await this.parseCargoToml(service.path);
    }

    return service;
  }

  private async parsePyProject(servicePath: string): Promise<any> {
    // Parse pyproject.toml
  }

  private async parseCargoToml(servicePath: string): Promise<any> {
    // Parse Cargo.toml
  }
}
```

---

## Adding New Configuration Options

### Step 1: Update Schema

```typescript
// src/config/schema.ts
const configSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  options: z
    .object({
      parallel: z.boolean().optional(),
      failFast: z.boolean().optional(),
      timeout: z.number().optional(), // New option
      retries: z.number().optional(), // New option
    })
    .optional(),
  rules: z.array(ruleConfigSchema),
});
```

### Step 2: Use in Implementation

```typescript
// src/auditor/auditor.ts
export class Auditor {
  async audit(config: AuditConfig): Promise<AuditReport> {
    const timeout = config.options?.timeout || 30000;
    const retries = config.options?.retries || 0;

    // Use new options in audit logic
  }
}
```

### Step 3: Document in Config Examples

```yaml
# examples/advanced-config.yml
name: 'Advanced Standards'
description: 'Config with advanced options'

options:
  parallel: true
  failFast: false
  timeout: 60000 # 60 seconds
  retries: 2 # Retry failed rules twice

rules:
  # ... your rules
```

---

## Plugin System (Future)

### Proposed Architecture

```typescript
// Future: Plugin interface
interface Plugin {
  name: string;
  version: string;
  rules?: RuleConstructor[];
  reporters?: ReporterConstructor[];
  hooks?: {
    beforeAudit?: (config: AuditConfig) => Promise<void>;
    afterAudit?: (report: AuditReport) => Promise<void>;
  };
}

// Future: Plugin loader
class PluginLoader {
  async loadPlugin(pluginPath: string): Promise<Plugin> {
    const plugin = await import(pluginPath);
    return plugin.default;
  }

  registerPlugin(plugin: Plugin): void {
    // Register plugin rules and reporters
    plugin.rules?.forEach((Rule) => {
      RuleFactory.registerRule(Rule);
    });

    plugin.reporters?.forEach((Reporter) => {
      ReporterFactory.registerReporter(Reporter);
    });
  }
}
```

### Usage Example

```yaml
# config.yml
plugins:
  - name: '@company/custom-rules'
    version: '^1.0.0'
  - name: '@company/security-rules'
    version: '^2.0.0'

rules:
  - name: 'Security Check'
    type: 'security-scan' # From plugin
    required: true
```

---

## Best Practices

### 1. Follow Existing Patterns

Study existing implementations before extending:

- Rules follow `BaseRule` interface
- Reporters follow `BaseReporter` interface
- Tests use consistent mocking patterns

### 2. Write Tests First (TDD)

```typescript
// 1. Write the test
it('should validate custom rule', async () => {
  const rule = new CustomRule('Test', true, {});
  const result = await rule.evaluate(mockService);
  expect(result.passed).toBe(true);
});

// 2. Implement to make test pass
export class CustomRule extends BaseRule {
  async evaluate(service: Service): Promise<RuleResult> {
    // Implementation
  }
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  // Your logic
} catch (error) {
  logger.error('Failed to process:', error);
  return {
    passed: false,
    message: `Error: ${error.message}`,
    details: { error: error.message },
  };
}
```

### 4. Document Everything

- Add JSDoc comments
- Update README
- Create examples
- Write inline comments for complex logic

### 5. Maintain Type Safety

```typescript
// ✅ Good: Type-safe
interface CustomConfig {
  threshold: number;
  pattern: string;
}

class CustomRule extends BaseRule {
  private config: CustomConfig;

  constructor(name: string, required: boolean, config: CustomConfig) {
    super(name, required);
    this.config = config;
  }
}

// ❌ Bad: Using 'any'
class CustomRule extends BaseRule {
  constructor(name: string, required: boolean, config: any) {
    super(name, required);
    this.config = config; // No type safety
  }
}
```

---

## Getting Help

- **Documentation:** Check `docs/` directory
- **Examples:** See `examples/` directory
- **Tests:** Review existing tests for patterns
- **Issues:** Open GitHub issue for bugs or questions
- **Discussions:** Use GitHub Discussions for design questions

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Maintainer:** Service Standards Auditor Team
