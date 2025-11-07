import { createLogger } from '../utils/logger.js';
const log = createLogger('rules:engine');
/**
 * Rule execution orchestrator
 *
 * The RuleEngine manages the execution of rules against services.
 * It supports both sequential and parallel execution modes.
 *
 * @example
 * ```typescript
 * const engine = RuleEngine.create([rule1, rule2]);
 * const results = await engine.executeRules(service);
 * console.log(`${results.filter(r => r.passed).length} rules passed`);
 * ```
 */
export class RuleEngine {
    constructor() {
        this.rules = [];
    }
    /**
     * Register a rule for execution
     *
     * @param rule - Rule instance to register
     */
    registerRule(rule) {
        this.rules.push(rule);
        log.debug(`Registered rule: ${rule.getName()}`);
    }
    /**
     * Execute all registered rules sequentially for a service
     *
     * Rules are evaluated one at a time in registration order.
     * If a rule throws an error, it is caught and recorded as a failure.
     *
     * @param service - Service to evaluate against all rules
     * @returns Array of rule results, one per registered rule
     */
    async executeRules(service) {
        log.info(`Executing ${this.rules.length} rules for service: ${service.name}`);
        const results = [];
        for (const rule of this.rules) {
            try {
                log.debug(`Evaluating rule: ${rule.getName()}`);
                const result = await rule.evaluate(service);
                results.push(result);
                if (!result.passed) {
                    log.debug(`Rule failed: ${rule.getName()} - ${result.message}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Rule ${rule.getName()} failed with error: ${errorMessage}`);
                results.push({
                    ruleName: rule.getName(),
                    passed: false,
                    message: `Rule execution failed: ${errorMessage}`,
                });
            }
        }
        const passedCount = results.filter((r) => r.passed).length;
        log.info(`Rule execution complete: ${passedCount}/${results.length} passed`);
        return results;
    }
    /**
     * Execute all registered rules in parallel for a service
     * @param service - Service to evaluate
     * @returns Array of rule results
     */
    async executeRulesParallel(service) {
        log.info(`Executing ${this.rules.length} rules in parallel for: ${service.name}`);
        const promises = this.rules.map(async (rule) => {
            try {
                log.debug(`Evaluating rule: ${rule.getName()}`);
                const result = await rule.evaluate(service);
                if (!result.passed) {
                    log.debug(`Rule failed: ${rule.getName()} - ${result.message}`);
                }
                return result;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Rule ${rule.getName()} failed with error: ${errorMessage}`);
                return {
                    ruleName: rule.getName(),
                    passed: false,
                    message: `Rule execution failed: ${errorMessage}`,
                };
            }
        });
        const results = await Promise.all(promises);
        const passedCount = results.filter((r) => r.passed).length;
        log.info(`Rule execution complete: ${passedCount}/${results.length} passed`);
        return results;
    }
    /**
     * Get all registered rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Clear all registered rules
     */
    clearRules() {
        this.rules = [];
        log.debug('Cleared all registered rules');
    }
}
