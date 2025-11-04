import { ServiceScanner } from '../scanner/service-scanner.js';
import { RuleEngine } from '../rules/rule-engine.js';
import { RuleFactory } from '../rules/rule-factory.js';
import { createLogger } from '../utils/logger.js';
import type { AuditorConfig } from '../types/config.js';
import type { AuditReport, ServiceAuditResult } from '../types/result.js';

const log = createLogger('auditor');

/**
 * Main auditor orchestration class
 *
 * The Auditor combines the scanner, rule engine, and factory to:
 * 1. Discover services in a directory
 * 2. Evaluate rules against each service
 * 3. Generate a comprehensive audit report
 *
 * @example
 * ```typescript
 * const config = await parseConfig('./rules.yml');
 * const auditor = new Auditor(config);
 * const report = await auditor.audit('./services');
 * console.log(`Audited ${report.summary.totalServices} services`);
 * ```
 */
export class Auditor {
  private config: AuditorConfig;
  private scanner: ServiceScanner;

  /**
   * Create a new auditor instance
   *
   * @param config - Validated auditor configuration with rules and options
   */
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
   *
   * Discovers services, evaluates configured rules against each service,
   * and generates a comprehensive audit report with scores and statistics.
   *
   * @param targetPath - Path to scan for services
   * @returns Complete audit report with service results and summary
   * @throws {ServiceScanError} If service discovery fails
   * @throws {RuleEvaluationError} If rule execution fails
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

    // Step 3: Audit each service (parallel or sequential based on config)
    const serviceResults = this.config.parallel
      ? await this.auditServicesParallel(services, rules)
      : await this.auditServicesSequential(services, rules);

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
   * Audit services sequentially
   * @param services - Services to audit
   * @param rules - Rules to execute
   * @returns Service audit results
   */
  private async auditServicesSequential(
    services: import('../types/service.js').Service[],
    rules: import('../rules/base-rule.js').BaseRule[]
  ): Promise<ServiceAuditResult[]> {
    const serviceResults: ServiceAuditResult[] = [];

    for (const service of services) {
      const result = await this.auditSingleService(service, rules);
      serviceResults.push(result);
    }

    return serviceResults;
  }

  /**
   * Audit services in parallel
   * @param services - Services to audit
   * @param rules - Rules to execute
   * @returns Service audit results
   */
  private async auditServicesParallel(
    services: import('../types/service.js').Service[],
    rules: import('../rules/base-rule.js').BaseRule[]
  ): Promise<ServiceAuditResult[]> {
    log.info(`Processing ${services.length} services in parallel`);

    const auditPromises = services.map((service) => this.auditSingleService(service, rules));

    return Promise.all(auditPromises);
  }

  /**
   * Audit a single service
   * @param service - Service to audit
   * @param rules - Rules to execute
   * @returns Service audit result
   */
  private async auditSingleService(
    service: import('../types/service.js').Service,
    rules: import('../rules/base-rule.js').BaseRule[]
  ): Promise<ServiceAuditResult> {
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

    log.debug(`Service ${service.name} audit complete`, {
      passed: serviceResult.passed,
      score: serviceResult.score,
    });

    return serviceResult;
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
