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
export class BaseRule {
    /**
     * Create a new rule instance
     *
     * @param config - Rule configuration from the config file
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * Get the name of the rule
     *
     * @returns The human-readable name of the rule
     */
    getName() {
        return this.config.name;
    }
    /**
     * Check if the rule is required (vs optional)
     *
     * Required rules must pass for the audit to be considered successful.
     *
     * @returns True if the rule is required, false if optional
     */
    isRequired() {
        return this.config.required;
    }
    /**
     * Get the rule configuration
     */
    getConfig() {
        return this.config;
    }
}
