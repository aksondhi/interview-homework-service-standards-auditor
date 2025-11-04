/**
 * Custom error classes for the Service Standards Auditor
 */

/**
 * Base error class for all auditor-specific errors
 */
export class AuditorError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AuditorError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends AuditorError {
  constructor(
    message: string,
    public readonly configPath?: string
  ) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when a service cannot be scanned
 */
export class ServiceScanError extends AuditorError {
  constructor(
    message: string,
    public readonly servicePath: string,
    public readonly originalError?: Error
  ) {
    super(message, 'SCAN_ERROR');
    this.name = 'ServiceScanError';
  }
}

/**
 * Error thrown when a rule fails to evaluate
 */
export class RuleEvaluationError extends AuditorError {
  constructor(
    message: string,
    public readonly ruleName: string,
    public readonly serviceName: string,
    public readonly originalError?: Error
  ) {
    super(message, 'RULE_ERROR');
    this.name = 'RuleEvaluationError';
  }
}

/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends AuditorError {
  constructor(
    message: string,
    public readonly format: string,
    public readonly outputPath?: string,
    public readonly originalError?: Error
  ) {
    super(message, 'REPORT_ERROR');
    this.name = 'ReportGenerationError';
  }
}

/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends AuditorError {
  constructor(
    message: string,
    public readonly path: string,
    public readonly operation: 'read' | 'write' | 'access',
    public readonly originalError?: Error
  ) {
    super(message, 'FS_ERROR');
    this.name = 'FileSystemError';
  }
}

/**
 * Type guard to check if an error is an AuditorError
 */
export function isAuditorError(error: unknown): error is AuditorError {
  return error instanceof AuditorError;
}

/**
 * Format error message with context
 */
export function formatErrorMessage(error: unknown): string {
  if (isAuditorError(error)) {
    let message = `[${error.code || 'ERROR'}] ${error.message}`;

    if (error instanceof ConfigurationError && error.configPath) {
      message += `\n  Config file: ${error.configPath}`;
    } else if (error instanceof ServiceScanError) {
      message += `\n  Service path: ${error.servicePath}`;
      if (error.originalError) {
        message += `\n  Cause: ${error.originalError.message}`;
      }
    } else if (error instanceof RuleEvaluationError) {
      message += `\n  Rule: ${error.ruleName}`;
      message += `\n  Service: ${error.serviceName}`;
      if (error.originalError) {
        message += `\n  Cause: ${error.originalError.message}`;
      }
    } else if (error instanceof ReportGenerationError) {
      message += `\n  Format: ${error.format}`;
      if (error.outputPath) {
        message += `\n  Output: ${error.outputPath}`;
      }
      if (error.originalError) {
        message += `\n  Cause: ${error.originalError.message}`;
      }
    } else if (error instanceof FileSystemError) {
      message += `\n  Path: ${error.path}`;
      message += `\n  Operation: ${error.operation}`;
      if (error.originalError) {
        message += `\n  Cause: ${error.originalError.message}`;
      }
    }

    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
