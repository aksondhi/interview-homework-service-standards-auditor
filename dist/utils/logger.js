import debug from 'debug';
const BASE_NAMESPACE = 'ssa';
export function createLogger(namespace) {
    const errorLogger = debug(`${BASE_NAMESPACE}:${namespace}:error`);
    const infoLogger = debug(`${BASE_NAMESPACE}:${namespace}:info`);
    const debugLogger = debug(`${BASE_NAMESPACE}:${namespace}:debug`);
    // Force error and info to stderr/stdout
    errorLogger.log = console.error.bind(console);
    infoLogger.log = console.log.bind(console);
    return {
        error: (message, ...args) => errorLogger(message, ...args),
        info: (message, ...args) => infoLogger(message, ...args),
        debug: (message, ...args) => debugLogger(message, ...args),
    };
}
