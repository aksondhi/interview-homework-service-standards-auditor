import { BaseRule } from './base-rule.js';
import { FileExistsRule } from './implementations/file-exists-rule.js';
import { SemverRule } from './implementations/semver-rule.js';
import { CoverageRule } from './implementations/coverage-rule.js';
import type {
  RuleConfig,
  FileExistsRuleConfig,
  SemverRuleConfig,
  CoverageRuleConfig,
} from '../types/config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('rules:factory');

/**
 * Factory for creating rule instances from configuration
 *
 * The RuleFactory maps rule type strings from the configuration file
 * to concrete rule implementation classes.
 *
 * @example
 * ```typescript
 * const config = { type: 'file-exists', name: 'README Check', target: 'README.md' };
 * const rule = RuleFactory.createRule(config);
 * const result = await rule.evaluate(service);
 * ```
 */
export class RuleFactory {
  /**
   * Create a single rule instance from configuration
   *
   * @param config - Rule configuration from the config file
   * @returns Instantiated rule ready for evaluation
   * @throws {Error} If the rule type is unsupported or custom rules are used
   */
  static createRule(config: RuleConfig): BaseRule {
    log.debug(`Creating rule: ${config.name} (type: ${config.type})`);

    switch (config.type) {
      case 'file-exists':
        return new FileExistsRule(config as FileExistsRuleConfig);

      case 'semver':
        return new SemverRule(config as SemverRuleConfig);

      case 'coverage':
        return new CoverageRule(config as CoverageRuleConfig);

      case 'custom':
        // Custom rules not yet implemented
        throw new Error(`Custom rules are not yet implemented. Rule: ${config.name}`);

      default: {
        const unknownConfig = config as { type: string; name: string };
        throw new Error(
          `Unsupported rule type: ${unknownConfig.type}. Rule: ${unknownConfig.name}`
        );
      }
    }
  }

  /**
   * Create multiple rule instances from an array of configurations
   *
   * @param configs - Array of rule configurations from the config file
   * @returns Array of instantiated rules ready for evaluation
   * @throws {Error} If any rule type is unsupported
   */
  static createRules(configs: RuleConfig[]): BaseRule[] {
    log.info(`Creating ${configs.length} rules`);

    return configs.map((config) => this.createRule(config));
  }
}
