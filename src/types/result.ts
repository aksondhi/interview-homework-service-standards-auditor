/**
 * Result of a single rule evaluation
 */
export interface RuleResult {
  /** Name of the rule that was evaluated */
  ruleName: string;

  /** Whether the rule passed */
  passed: boolean;

  /** Human-readable message about the result */
  message: string;

  /** Additional details about the rule result */
  details?: Record<string, unknown>;
}

/**
 * Result of auditing a single service
 */
export interface ServiceAuditResult {
  /** Name of the service */
  serviceName: string;

  /** Path to the service */
  servicePath: string;

  /** Results from all rules evaluated */
  results: RuleResult[];

  /** Whether all required rules passed */
  passed: boolean;

  /** Score (percentage of passing rules) */
  score: number;
}

/**
 * Complete audit report for all services
 */
export interface AuditReport {
  /** Timestamp of when audit was run */
  timestamp: string;

  /** Results for each service */
  services: ServiceAuditResult[];

  /** Summary statistics */
  summary: {
    /** Total number of services audited */
    totalServices: number;

    /** Number of services that passed */
    passedServices: number;

    /** Number of services that failed */
    failedServices: number;

    /** Overall pass rate */
    passRate: number;
  };
}
