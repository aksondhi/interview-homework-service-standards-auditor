/**
 * Custom error classes for the Service Standards Auditor
 *
 * These error classes provide structured error information with context-specific
 * properties that help with debugging and error reporting.
 */
/**
 * Base error class for all auditor-specific errors
 *
 * All custom errors in the application extend this class.
 * Use the `isAuditorError` type guard to check if an error is an AuditorError.
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (error) {
 *   if (isAuditorError(error)) {
 *     console.log(`[${error.code}] ${error.message}`);
 *   }
 * }
 * ```
 */
export class AuditorError extends Error {
    /**
     * Create a new auditor error
     *
     * @param message - Human-readable error message
     * @param code - Optional error code for categorization
     */
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'AuditorError';
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Error thrown when configuration is invalid
 *
 * This error is thrown when the configuration file cannot be read,
 * contains invalid YAML, or fails schema validation.
 */
export class ConfigurationError extends AuditorError {
    /**
     * Create a new configuration error
     *
     * @param message - Description of the configuration problem
     * @param configPath - Optional path to the configuration file
     */
    constructor(message, configPath) {
        super(message, 'CONFIG_ERROR');
        this.configPath = configPath;
        this.name = 'ConfigurationError';
    }
}
/**
 * Error thrown when a service cannot be scanned
 *
 * This error is thrown when the scanner encounters problems
 * discovering or reading services.
 */
export class ServiceScanError extends AuditorError {
    /**
     * Create a new service scan error
     *
     * @param message - Description of the scan problem
     * @param servicePath - Path to the service that failed to scan
     * @param originalError - Optional underlying error that caused the scan to fail
     */
    constructor(message, servicePath, originalError) {
        super(message, 'SCAN_ERROR');
        this.servicePath = servicePath;
        this.originalError = originalError;
        this.name = 'ServiceScanError';
    }
}
/**
 * Error thrown when a rule fails to evaluate
 */
export class RuleEvaluationError extends AuditorError {
    constructor(message, ruleName, serviceName, originalError) {
        super(message, 'RULE_ERROR');
        this.ruleName = ruleName;
        this.serviceName = serviceName;
        this.originalError = originalError;
        this.name = 'RuleEvaluationError';
    }
}
/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends AuditorError {
    constructor(message, format, outputPath, originalError) {
        super(message, 'REPORT_ERROR');
        this.format = format;
        this.outputPath = outputPath;
        this.originalError = originalError;
        this.name = 'ReportGenerationError';
    }
}
/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends AuditorError {
    constructor(message, path, operation, originalError) {
        super(message, 'FS_ERROR');
        this.path = path;
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'FileSystemError';
    }
}
/**
 * Type guard to check if an error is an AuditorError
 */
export function isAuditorError(error) {
    return error instanceof AuditorError;
}
/**
 * Format error message with context
 */
export function formatErrorMessage(error) {
    if (isAuditorError(error)) {
        let message = `[${error.code || 'ERROR'}] ${error.message}`;
        if (error instanceof ConfigurationError && error.configPath) {
            message += `\n  Config file: ${error.configPath}`;
        }
        else if (error instanceof ServiceScanError) {
            message += `\n  Service path: ${error.servicePath}`;
            if (error.originalError) {
                message += `\n  Cause: ${error.originalError.message}`;
            }
        }
        else if (error instanceof RuleEvaluationError) {
            message += `\n  Rule: ${error.ruleName}`;
            message += `\n  Service: ${error.serviceName}`;
            if (error.originalError) {
                message += `\n  Cause: ${error.originalError.message}`;
            }
        }
        else if (error instanceof ReportGenerationError) {
            message += `\n  Format: ${error.format}`;
            if (error.outputPath) {
                message += `\n  Output: ${error.outputPath}`;
            }
            if (error.originalError) {
                message += `\n  Cause: ${error.originalError.message}`;
            }
        }
        else if (error instanceof FileSystemError) {
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
