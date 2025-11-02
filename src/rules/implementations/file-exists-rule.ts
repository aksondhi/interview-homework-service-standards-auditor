import { access, stat } from 'fs/promises';
import { join } from 'path';
import glob from 'fast-glob';
import { BaseRule } from '../base-rule.js';
import type { Service } from '../../types/service.js';
import type { RuleResult } from '../../types/result.js';
import type { FileExistsRuleConfig } from '../../types/config.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('rules:file-exists');

/**
 * Rule that checks if a file or directory exists in a service
 * Supports simple paths and glob patterns
 */
export class FileExistsRule extends BaseRule {
  private target: string;

  constructor(config: FileExistsRuleConfig) {
    super(config);
    this.target = config.target;
  }

  async evaluate(service: Service): Promise<RuleResult> {
    log.debug(`Checking for ${this.target} in ${service.name}`);

    const isGlobPattern = this.target.includes('*') || this.target.includes('{');

    if (isGlobPattern) {
      return this.evaluateGlob(service);
    }

    return this.evaluateSimplePath(service);
  }

  /**
   * Evaluate a simple file or directory path
   */
  private async evaluateSimplePath(service: Service): Promise<RuleResult> {
    const targetPath = join(service.path, this.target);

    try {
      await access(targetPath);
      const stats = await stat(targetPath);
      const type = stats.isDirectory() ? 'directory' : 'file';

      log.debug(`Found ${type}: ${this.target}`);

      return {
        ruleName: this.config.name,
        passed: true,
        message: `${this.target} exists (${type})`,
        details: { path: targetPath, type },
      };
    } catch {
      log.debug(`Not found: ${this.target}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `${this.target} not found`,
        details: { expectedPath: targetPath },
      };
    }
  }

  /**
   * Evaluate using glob pattern matching
   */
  private async evaluateGlob(service: Service): Promise<RuleResult> {
    try {
      const matches = await glob(this.target, {
        cwd: service.path,
        absolute: true,
        onlyFiles: false,
      });

      if (matches.length > 0) {
        log.debug(`Found ${matches.length} matches for pattern: ${this.target}`);

        // Convert absolute paths to relative for cleaner display
        const relativeMatches = matches.map((match) => match.replace(service.path + '/', ''));

        return {
          ruleName: this.config.name,
          passed: true,
          message: `Found ${matches.length} file(s) matching pattern: ${this.target}`,
          details: { matches: relativeMatches, count: matches.length },
        };
      }

      log.debug(`No matches for pattern: ${this.target}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `No files found matching pattern: ${this.target}`,
        details: { pattern: this.target },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Error evaluating glob pattern: ${errorMessage}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `Error evaluating pattern: ${errorMessage}`,
        details: { pattern: this.target, error: errorMessage },
      };
    }
  }
}
