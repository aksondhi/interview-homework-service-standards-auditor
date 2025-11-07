import { FileExistsRule } from './implementations/file-exists-rule.js';
import { SemverRule } from './implementations/semver-rule.js';
import { CoverageRule } from './implementations/coverage-rule.js';
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
    static createRule(config) {
        log.debug(`Creating rule: ${config.name} (type: ${config.type})`);
        switch (config.type) {
            case 'file-exists':
                return new FileExistsRule(config);
            case 'semver':
                return new SemverRule(config);
            case 'coverage':
                return new CoverageRule(config);
            case 'custom':
                // Custom rules not yet implemented
                throw new Error(`Custom rules are not yet implemented. Rule: ${config.name}`);
            default: {
                const unknownConfig = config;
                throw new Error(`Unsupported rule type: ${unknownConfig.type}. Rule: ${unknownConfig.name}`);
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
    static createRules(configs) {
        log.info(`Creating ${configs.length} rules`);
        return configs.map((config) => this.createRule(config));
    }
}
