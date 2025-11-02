import { readFile } from 'fs/promises';
import { join } from 'path';
import { BaseRule } from '../base-rule.js';
import type { Service } from '../../types/service.js';
import type { RuleResult } from '../../types/result.js';
import type { CoverageRuleConfig } from '../../types/config.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('rules:coverage');

/**
 * Coverage data structure from Jest/Istanbul coverage reports
 */
interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
}

/**
 * Rule that checks code coverage against a minimum threshold
 * Reads Jest/Istanbul coverage-summary.json files
 */
export class CoverageRule extends BaseRule {
  private threshold: number;

  constructor(config: CoverageRuleConfig) {
    super(config);
    this.threshold = config.threshold;
  }

  async evaluate(service: Service): Promise<RuleResult> {
    const coveragePath = join(service.path, 'coverage', 'coverage-summary.json');

    log.debug(`Checking coverage against ${this.threshold}% threshold for ${service.name}`);

    try {
      const content = await readFile(coveragePath, 'utf-8');
      const summary: CoverageSummary = JSON.parse(content);

      const { lines, statements, functions, branches } = summary.total;
      const avgCoverage = (lines.pct + statements.pct + functions.pct + branches.pct) / 4;

      const passed = avgCoverage >= this.threshold;

      log.debug(`Coverage: ${avgCoverage.toFixed(1)}% (threshold: ${this.threshold}%)`);

      return {
        ruleName: this.config.name,
        passed,
        message: passed
          ? `Coverage ${avgCoverage.toFixed(1)}% meets threshold of ${this.threshold}%`
          : `Coverage ${avgCoverage.toFixed(1)}% is below threshold of ${this.threshold}%`,
        details: {
          coverage: {
            lines: lines.pct,
            statements: statements.pct,
            functions: functions.pct,
            branches: branches.pct,
            average: avgCoverage,
          },
          threshold: this.threshold,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to read coverage report: ${errorMessage}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `Coverage report not found or invalid at ${coveragePath}`,
        details: { error: errorMessage, expectedPath: coveragePath },
      };
    }
  }
}
