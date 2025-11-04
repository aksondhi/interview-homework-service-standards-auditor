import type { RuleConfig } from '../types/config.js';
import type { Service } from '../types/service.js';
import type { RuleResult } from '../types/result.js';

/**
 * Abstract base class for all rules
 *
 * Concrete rule implementations must extend this class and implement the evaluate method.
 * The base class provides common functionality for accessing rule configuration and metadata.
 *
 * @example
 * ```typescript
 * class CustomRule extends BaseRule {
 *   async evaluate(service: Service): Promise<RuleResult> {
 *     // Rule implementation
 *     return {
 *       passed: true,
 *       ruleName: this.getName(),
 *       message: 'Rule passed'
 *     };
 *   }
 * }
 * ```
 */
export abstract class BaseRule {
  protected config: RuleConfig;

  /**
   * Create a new rule instance
   *
   * @param config - Rule configuration from the config file
   */
  constructor(config: RuleConfig) {
    this.config = config;
  }

  /**
   * Evaluate the rule against a service
   *
   * This method must be implemented by concrete rule classes.
   * It should perform the actual rule validation logic.
   *
   * @param service - The service to evaluate
   * @returns Promise resolving to the rule evaluation result
   */
  abstract evaluate(service: Service): Promise<RuleResult>;

  /**
   * Get the name of the rule
   *
   * @returns The human-readable name of the rule
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Check if the rule is required (vs optional)
   *
   * Required rules must pass for the audit to be considered successful.
   *
   * @returns True if the rule is required, false if optional
   */
  isRequired(): boolean {
    return this.config.required;
  }

  /**
   * Get the rule configuration
   */
  getConfig(): RuleConfig {
    return this.config;
  }
}
