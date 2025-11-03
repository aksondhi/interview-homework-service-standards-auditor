import { ServiceScanner } from '../scanner/service-scanner.js';
import { RuleEngine } from '../rules/rule-engine.js';
import { RuleFactory } from '../rules/rule-factory.js';
import { createLogger } from '../utils/logger.js';
import type { AuditorConfig } from '../types/config.js';
import type { AuditReport, ServiceAuditResult } from '../types/result.js';

const log = createLogger('auditor');

/**
 * Main auditor orchestration class
 * Combines scanner, rule engine, and factory to audit services
 */
export class Auditor {
  private config: AuditorConfig;
  private scanner: ServiceScanner;

  constructor(config: AuditorConfig) {
    this.config = config;
    this.scanner = new ServiceScanner();
    log.info('Auditor initialized with config', {
      rulesCount: config.rules.length,
      parallel: config.parallel,
    });
  }

  /**
   * Audit all services in a directory
   * @param targetPath - Path to scan for services
   * @returns Complete audit report
   */
  async audit(targetPath: string): Promise<AuditReport> {
    log.info(`Starting audit of: ${targetPath}`);

    // Step 1: Discover services
    const services = await this.scanner.scan(targetPath);
    log.info(`Discovered ${services.length} services`);

    if (services.length === 0) {
      log.info('No services found, returning empty report');
      return this.createEmptyReport();
    }

    // Step 2: Create rules from config
    const rules = RuleFactory.createRules(this.config.rules);
    log.debug(`Created ${rules.length} rule instances`);

    // Step 3: Audit each service
    const serviceResults: ServiceAuditResult[] = [];

    for (const service of services) {
      log.info(`Auditing service: ${service.name}`);

      const engine = new RuleEngine();
      rules.forEach((rule) => engine.registerRule(rule));

      // Execute rules (parallel or sequential based on config)
      const ruleResults = this.config.parallel
        ? await engine.executeRulesParallel(service)
        : await engine.executeRules(service);

      // Calculate service audit result
      const passedRules = ruleResults.filter((r) => r.passed).length;
      const score = ruleResults.length > 0 ? (passedRules / ruleResults.length) * 100 : 0;
      const allRequiredPassed = this.checkRequiredRules(ruleResults);

      const serviceResult: ServiceAuditResult = {
        serviceName: service.name,
        servicePath: service.path,
        results: ruleResults,
        passed: allRequiredPassed,
        score: Math.round(score * 10) / 10, // Round to 1 decimal place
      };

      serviceResults.push(serviceResult);

      log.debug(`Service ${service.name} audit complete`, {
        passed: serviceResult.passed,
        score: serviceResult.score,
      });
    }

    // Step 4: Create final report with summary
    const report = this.createReport(serviceResults);

    log.info('Audit complete', {
      totalServices: report.summary.totalServices,
      passedServices: report.summary.passedServices,
      passRate: report.summary.passRate,
    });

    return report;
  }

  /**
   * Check if all required rules passed
   * @param results - Rule results
   * @returns True if all required rules passed
   */
  private checkRequiredRules(results: import('../types/result.js').RuleResult[]): boolean {
    // Find which rules are required
    const requiredRuleNames = new Set(
      this.config.rules.filter((r) => r.required).map((r) => r.name)
    );

    // Check if all required rules passed
    for (const result of results) {
      if (requiredRuleNames.has(result.ruleName) && !result.passed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create report from service results
   * @param serviceResults - Results for all services
   * @returns Complete audit report
   */
  private createReport(serviceResults: ServiceAuditResult[]): AuditReport {
    const passedServices = serviceResults.filter((s) => s.passed).length;
    const failedServices = serviceResults.length - passedServices;
    const passRate = serviceResults.length > 0 ? (passedServices / serviceResults.length) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      services: serviceResults,
      summary: {
        totalServices: serviceResults.length,
        passedServices,
        failedServices,
        passRate: Math.round(passRate * 100) / 100, // Round to 2 decimal places
      },
    };
  }

  /**
   * Create an empty report when no services are found
   * @returns Empty audit report
   */
  private createEmptyReport(): AuditReport {
    return {
      timestamp: new Date().toISOString(),
      services: [],
      summary: {
        totalServices: 0,
        passedServices: 0,
        failedServices: 0,
        passRate: 0,
      },
    };
  }
}
