import type { RuleConfig } from '../types/config.js';
import type { Service } from '../types/service.js';
import type { RuleResult } from '../types/result.js';

/**
 * Abstract base class for all rules
 * Concrete rule implementations must extend this class
 */
export abstract class BaseRule {
  protected config: RuleConfig;

  constructor(config: RuleConfig) {
    this.config = config;
  }

  /**
   * Evaluate the rule against a service
   * @param service - The service to evaluate
   * @returns Promise resolving to the rule result
   */
  abstract evaluate(service: Service): Promise<RuleResult>;

  /**
   * Get the name of the rule
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Check if the rule is required (vs optional)
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
