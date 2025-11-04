import {
  AuditorError,
  ConfigurationError,
  ServiceScanError,
  RuleEvaluationError,
  ReportGenerationError,
  FileSystemError,
  isAuditorError,
  formatErrorMessage,
} from '../../src/utils/errors';

describe('Error Classes', () => {
  describe('AuditorError', () => {
    it('should create error with message and code', () => {
      const error = new AuditorError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AuditorError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error without code', () => {
      const error = new AuditorError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
    });

    it('should capture stack trace', () => {
      const error = new AuditorError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AuditorError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create error with config path', () => {
      const error = new ConfigurationError('Invalid config', '/path/to/config.yml');

      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.configPath).toBe('/path/to/config.yml');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should create error without config path', () => {
      const error = new ConfigurationError('Invalid config');

      expect(error.message).toBe('Invalid config');
      expect(error.configPath).toBeUndefined();
    });
  });

  describe('ServiceScanError', () => {
    it('should create error with service path', () => {
      const error = new ServiceScanError('Scan failed', '/path/to/service');

      expect(error.message).toBe('Scan failed');
      expect(error.code).toBe('SCAN_ERROR');
      expect(error.servicePath).toBe('/path/to/service');
      expect(error.name).toBe('ServiceScanError');
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new ServiceScanError('Scan failed', '/path/to/service', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('RuleEvaluationError', () => {
    it('should create error with rule and service names', () => {
      const error = new RuleEvaluationError('Rule failed', 'Test Rule', 'test-service');

      expect(error.message).toBe('Rule failed');
      expect(error.code).toBe('RULE_ERROR');
      expect(error.ruleName).toBe('Test Rule');
      expect(error.serviceName).toBe('test-service');
      expect(error.name).toBe('RuleEvaluationError');
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new RuleEvaluationError(
        'Rule failed',
        'Test Rule',
        'test-service',
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ReportGenerationError', () => {
    it('should create error with format and output path', () => {
      const error = new ReportGenerationError('Report failed', 'json', '/path/to/report.json');

      expect(error.message).toBe('Report failed');
      expect(error.code).toBe('REPORT_ERROR');
      expect(error.format).toBe('json');
      expect(error.outputPath).toBe('/path/to/report.json');
      expect(error.name).toBe('ReportGenerationError');
    });

    it('should create error without output path', () => {
      const error = new ReportGenerationError('Report failed', 'json');

      expect(error.outputPath).toBeUndefined();
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new ReportGenerationError(
        'Report failed',
        'json',
        '/path/to/report.json',
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('FileSystemError', () => {
    it('should create error with path and operation', () => {
      const error = new FileSystemError('File not found', '/path/to/file', 'read');

      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FS_ERROR');
      expect(error.path).toBe('/path/to/file');
      expect(error.operation).toBe('read');
      expect(error.name).toBe('FileSystemError');
    });

    it('should support different operations', () => {
      const readError = new FileSystemError('Read failed', '/path', 'read');
      const writeError = new FileSystemError('Write failed', '/path', 'write');
      const accessError = new FileSystemError('Access failed', '/path', 'access');

      expect(readError.operation).toBe('read');
      expect(writeError.operation).toBe('write');
      expect(accessError.operation).toBe('access');
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new FileSystemError('File not found', '/path/to/file', 'read', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });
});

describe('isAuditorError', () => {
  it('should return true for AuditorError instances', () => {
    const error = new AuditorError('Test error');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return true for ConfigurationError instances', () => {
    const error = new ConfigurationError('Config error');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return true for ServiceScanError instances', () => {
    const error = new ServiceScanError('Scan error', '/path');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return true for RuleEvaluationError instances', () => {
    const error = new RuleEvaluationError('Rule error', 'rule', 'service');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return true for ReportGenerationError instances', () => {
    const error = new ReportGenerationError('Report error', 'json');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return true for FileSystemError instances', () => {
    const error = new FileSystemError('FS error', '/path', 'read');
    expect(isAuditorError(error)).toBe(true);
  });

  it('should return false for standard Error', () => {
    const error = new Error('Standard error');
    expect(isAuditorError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isAuditorError('string')).toBe(false);
    expect(isAuditorError(123)).toBe(false);
    expect(isAuditorError(null)).toBe(false);
    expect(isAuditorError(undefined)).toBe(false);
    expect(isAuditorError({})).toBe(false);
  });
});

describe('formatErrorMessage', () => {
  it('should format AuditorError with code', () => {
    const error = new AuditorError('Test error', 'TEST_CODE');
    const message = formatErrorMessage(error);

    expect(message).toBe('[TEST_CODE] Test error');
  });

  it('should format AuditorError without code', () => {
    const error = new AuditorError('Test error');
    const message = formatErrorMessage(error);

    expect(message).toBe('[ERROR] Test error');
  });

  it('should format ConfigurationError with config path', () => {
    const error = new ConfigurationError('Invalid config', '/path/to/config.yml');
    const message = formatErrorMessage(error);

    expect(message).toContain('[CONFIG_ERROR] Invalid config');
    expect(message).toContain('Config file: /path/to/config.yml');
  });

  it('should format ConfigurationError without config path', () => {
    const error = new ConfigurationError('Invalid config');
    const message = formatErrorMessage(error);

    expect(message).toBe('[CONFIG_ERROR] Invalid config');
  });

  it('should format ServiceScanError with service path', () => {
    const error = new ServiceScanError('Scan failed', '/path/to/service');
    const message = formatErrorMessage(error);

    expect(message).toContain('[SCAN_ERROR] Scan failed');
    expect(message).toContain('Service path: /path/to/service');
  });

  it('should format ServiceScanError with original error', () => {
    const originalError = new Error('Original error');
    const error = new ServiceScanError('Scan failed', '/path/to/service', originalError);
    const message = formatErrorMessage(error);

    expect(message).toContain('[SCAN_ERROR] Scan failed');
    expect(message).toContain('Service path: /path/to/service');
    expect(message).toContain('Cause: Original error');
  });

  it('should format RuleEvaluationError with rule and service names', () => {
    const error = new RuleEvaluationError('Rule failed', 'Test Rule', 'test-service');
    const message = formatErrorMessage(error);

    expect(message).toContain('[RULE_ERROR] Rule failed');
    expect(message).toContain('Rule: Test Rule');
    expect(message).toContain('Service: test-service');
  });

  it('should format RuleEvaluationError with original error', () => {
    const originalError = new Error('Original error');
    const error = new RuleEvaluationError(
      'Rule failed',
      'Test Rule',
      'test-service',
      originalError
    );
    const message = formatErrorMessage(error);

    expect(message).toContain('Cause: Original error');
  });

  it('should format ReportGenerationError with format and output path', () => {
    const error = new ReportGenerationError('Report failed', 'json', '/path/to/report.json');
    const message = formatErrorMessage(error);

    expect(message).toContain('[REPORT_ERROR] Report failed');
    expect(message).toContain('Format: json');
    expect(message).toContain('Output: /path/to/report.json');
  });

  it('should format ReportGenerationError without output path', () => {
    const error = new ReportGenerationError('Report failed', 'json');
    const message = formatErrorMessage(error);

    expect(message).toContain('[REPORT_ERROR] Report failed');
    expect(message).toContain('Format: json');
    expect(message).not.toContain('Output:');
  });

  it('should format ReportGenerationError with original error', () => {
    const originalError = new Error('Original error');
    const error = new ReportGenerationError('Report failed', 'json', undefined, originalError);
    const message = formatErrorMessage(error);

    expect(message).toContain('Cause: Original error');
  });

  it('should format FileSystemError with path and operation', () => {
    const error = new FileSystemError('File not found', '/path/to/file', 'read');
    const message = formatErrorMessage(error);

    expect(message).toContain('[FS_ERROR] File not found');
    expect(message).toContain('Path: /path/to/file');
    expect(message).toContain('Operation: read');
  });

  it('should format FileSystemError with original error', () => {
    const originalError = new Error('Original error');
    const error = new FileSystemError('File not found', '/path/to/file', 'read', originalError);
    const message = formatErrorMessage(error);

    expect(message).toContain('Cause: Original error');
  });

  it('should format standard Error', () => {
    const error = new Error('Standard error');
    const message = formatErrorMessage(error);

    expect(message).toBe('Standard error');
  });

  it('should format non-error values as strings', () => {
    expect(formatErrorMessage('string error')).toBe('string error');
    expect(formatErrorMessage(123)).toBe('123');
    expect(formatErrorMessage(null)).toBe('null');
    expect(formatErrorMessage(undefined)).toBe('undefined');
  });

  it('should format objects as strings', () => {
    const obj = { error: 'test' };
    const message = formatErrorMessage(obj);

    expect(message).toBe('[object Object]');
  });
});
