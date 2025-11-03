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
 */
export class RuleFactory {
  /**
   * Create a single rule instance from configuration
   * @param config - Rule configuration
   * @returns Rule instance
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
   * @param configs - Array of rule configurations
   * @returns Array of rule instances
   */
  static createRules(configs: RuleConfig[]): BaseRule[] {
    log.info(`Creating ${configs.length} rules`);

    return configs.map((config) => this.createRule(config));
  }
}
