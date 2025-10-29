import debug from 'debug';

const BASE_NAMESPACE = 'ssa';

export type LogLevel = 'error' | 'info' | 'debug';

export interface Logger {
  error: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

export function createLogger(namespace: string): Logger {
  const errorLogger = debug(`${BASE_NAMESPACE}:${namespace}:error`);
  const infoLogger = debug(`${BASE_NAMESPACE}:${namespace}:info`);
  const debugLogger = debug(`${BASE_NAMESPACE}:${namespace}:debug`);

  // Force error and info to stderr/stdout
  errorLogger.log = console.error.bind(console);
  infoLogger.log = console.log.bind(console);

  return {
    error: (message: string, ...args: unknown[]) => errorLogger(message, ...args),
    info: (message: string, ...args: unknown[]) => infoLogger(message, ...args),
    debug: (message: string, ...args: unknown[]) => debugLogger(message, ...args),
  };
}
