import { readFile } from 'fs/promises';
import { join } from 'path';
import semver from 'semver';
import { BaseRule } from '../base-rule.js';
import type { Service } from '../../types/service.js';
import type { RuleResult } from '../../types/result.js';
import type { SemverRuleConfig } from '../../types/config.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('rules:semver');

/**
 * Rule that validates semantic versioning in package.json
 * Checks that version field follows semver specification
 */
export class SemverRule extends BaseRule {
  private target: string;

  constructor(
    config: Partial<SemverRuleConfig> & { name: string; type: 'semver'; required: boolean }
  ) {
    super(config as SemverRuleConfig);
    this.target = config.target || 'package.json';
  }

  async evaluate(service: Service): Promise<RuleResult> {
    const pkgPath = join(service.path, this.target);

    log.debug(`Checking semver in ${this.target} for ${service.name}`);

    try {
      const content = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      if (!pkg.version) {
        log.debug('Version field not found in package.json');
        return {
          ruleName: this.config.name,
          passed: false,
          message: 'package.json version field not found',
          details: { path: pkgPath },
        };
      }

      const version = pkg.version;
      const isValid = semver.valid(version) !== null;

      if (isValid) {
        log.debug(`Valid semver found: ${version}`);

        return {
          ruleName: this.config.name,
          passed: true,
          message: `Valid semantic version: ${version}`,
          details: {
            version,
            major: semver.major(version),
            minor: semver.minor(version),
            patch: semver.patch(version),
          },
        };
      }

      log.debug(`Invalid semver: ${version}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `Invalid semantic version: ${version}`,
        details: { version, path: pkgPath },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to evaluate semver rule: ${errorMessage}`);

      return {
        ruleName: this.config.name,
        passed: false,
        message: `Failed to read or parse ${this.target}: ${errorMessage}`,
        details: { error: errorMessage, path: pkgPath },
      };
    }
  }
}
