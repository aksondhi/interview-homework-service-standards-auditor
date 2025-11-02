import { createLogger } from '../utils/logger.js';
import type { Service } from '../types/service.js';
import type { RuleResult } from '../types/result.js';
import type { BaseRule } from './base-rule.js';

const log = createLogger('rules:engine');

/**
 * Rule execution orchestrator
 * Manages rule registration and execution
 */
export class RuleEngine {
  private rules: BaseRule[] = [];

  /**
   * Register a rule for execution
   * @param rule - Rule to register
   */
  registerRule(rule: BaseRule): void {
    this.rules.push(rule);
    log.debug(`Registered rule: ${rule.getName()}`);
  }

  /**
   * Execute all registered rules sequentially for a service
   * @param service - Service to evaluate
   * @returns Array of rule results
   */
  async executeRules(service: Service): Promise<RuleResult[]> {
    log.info(`Executing ${this.rules.length} rules for service: ${service.name}`);

    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      try {
        log.debug(`Evaluating rule: ${rule.getName()}`);
        const result = await rule.evaluate(service);
        results.push(result);

        if (!result.passed) {
          log.debug(`Rule failed: ${rule.getName()} - ${result.message}`);
        }
      } catch (error) {
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
  async executeRulesParallel(service: Service): Promise<RuleResult[]> {
    log.info(`Executing ${this.rules.length} rules in parallel for: ${service.name}`);

    const promises = this.rules.map(async (rule) => {
      try {
        log.debug(`Evaluating rule: ${rule.getName()}`);
        const result = await rule.evaluate(service);

        if (!result.passed) {
          log.debug(`Rule failed: ${rule.getName()} - ${result.message}`);
        }

        return result;
      } catch (error) {
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
  getRules(): BaseRule[] {
    return [...this.rules];
  }

  /**
   * Clear all registered rules
   */
  clearRules(): void {
    this.rules = [];
    log.debug('Cleared all registered rules');
  }
}
