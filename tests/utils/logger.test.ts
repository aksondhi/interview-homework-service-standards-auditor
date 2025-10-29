import { createLogger } from '../../src/utils/logger.js';

describe('Logger', () => {
  it('should create logger with namespace', () => {
    const logger = createLogger('test');
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should have error, info, and debug methods', () => {
    const logger = createLogger('scanner');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should create namespaced loggers for different components', () => {
    const scannerLogger = createLogger('scanner');
    const rulesLogger = createLogger('rules');

    expect(scannerLogger).toBeDefined();
    expect(rulesLogger).toBeDefined();
    expect(scannerLogger).not.toBe(rulesLogger);
  });

  it('should not throw errors when logging', () => {
    const logger = createLogger('test');

    expect(() => logger.error('error message')).not.toThrow();
    expect(() => logger.info('info message')).not.toThrow();
    expect(() => logger.debug('debug message')).not.toThrow();
  });

  it('should accept additional arguments', () => {
    const logger = createLogger('test');

    expect(() => logger.error('error', { detail: 'value' })).not.toThrow();
    expect(() => logger.info('info', 1, 2, 3)).not.toThrow();
    expect(() => logger.debug('debug', ['array'])).not.toThrow();
  });
});
