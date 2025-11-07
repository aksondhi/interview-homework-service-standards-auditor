import glob from 'fast-glob';
import { readFile, stat } from 'fs/promises';
import { dirname, relative } from 'path';
import { createLogger } from '../utils/logger.js';
import { ServiceScanError, FileSystemError } from '../utils/errors.js';
const log = createLogger('scanner');
/**
 * Scans repositories to discover services based on package.json files
 *
 * The scanner recursively searches for package.json files and extracts service metadata.
 * It automatically ignores common build directories and node_modules.
 *
 * @example
 * ```typescript
 * const scanner = new ServiceScanner({ maxDepth: 3 });
 * const services = await scanner.scan('./my-monorepo');
 * console.log(`Found ${services.length} services`);
 * ```
 */
export class ServiceScanner {
    /**
     * Create a new service scanner
     *
     * @param options - Scanner configuration options
     * @param options.maxDepth - Maximum directory depth to scan
     * @param options.exclude - Glob patterns for directories to exclude
     */
    constructor(options = {}) {
        this.options = {
            maxDepth: options.maxDepth,
            exclude: options.exclude || [
                '**/node_modules/**',
                '**/dist/**',
                '**/build/**',
                '**/.git/**',
                '**/coverage/**',
            ],
        };
    }
    /**
     * Scan a directory for services
     *
     * Recursively searches for package.json files and extracts service metadata.
     * Each package.json found is treated as a separate service.
     *
     * @param targetPath - Path to scan for services
     * @returns Array of discovered services with metadata
     * @throws {ServiceScanError} If scanning fails
     * @throws {FileSystemError} If the target path cannot be accessed
     */
    async scan(targetPath) {
        log.info('Scanning for services', { path: targetPath });
        // Verify target path exists
        try {
            const stats = await stat(targetPath);
            if (!stats.isDirectory()) {
                throw new FileSystemError(`Path is not a directory: ${targetPath}`, targetPath, 'access');
            }
        }
        catch (error) {
            if (error instanceof FileSystemError) {
                throw error;
            }
            const fsError = error;
            log.error('Failed to access target path', { path: targetPath, error: fsError.message });
            if (fsError.code === 'ENOENT') {
                throw new FileSystemError(`Path does not exist: ${targetPath}`, targetPath, 'access', fsError);
            }
            throw new ServiceScanError(`Failed to scan directory: ${fsError.message}`, targetPath, fsError);
        }
        // Find all package.json files
        const pattern = this.buildGlobPattern();
        const globOptions = {
            cwd: targetPath,
            absolute: true,
            ignore: this.options.exclude,
            onlyFiles: true,
            deep: this.options.maxDepth,
        };
        const packageFiles = await glob(pattern, globOptions);
        log.debug('Found package.json files', { count: packageFiles.length });
        // Parse each package.json and create Service objects
        // Using Promise.all for parallel parsing improves performance
        const services = await Promise.all(packageFiles.map((pkgPath) => this.parseService(String(pkgPath), targetPath)));
        // Filter out any failed parses (null values)
        const validServices = services.filter((service) => service !== null);
        log.info('Service scan complete', {
            total: validServices.length,
            services: validServices.map((s) => s.name),
        });
        return validServices;
    }
    /**
     * Build glob pattern based on maxDepth option
     */
    buildGlobPattern() {
        if (this.options.maxDepth !== undefined) {
            // Build pattern with limited depth
            const parts = ['**/package.json'];
            return parts.join('/');
        }
        return '**/package.json';
    }
    /**
     * Parse a package.json file into a Service object
     */
    async parseService(pkgPath, basePath) {
        const servicePath = dirname(pkgPath);
        const relativePath = relative(basePath, servicePath);
        try {
            const content = await readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(content);
            const service = {
                name: pkg.name || 'unknown',
                path: servicePath,
                type: this.detectServiceType(pkg),
                version: pkg.version,
                description: pkg.description,
            };
            log.debug('Parsed service', { name: service.name, path: relativePath });
            return service;
        }
        catch (error) {
            log.error('Failed to parse package.json', {
                path: relativePath,
                error,
            });
            // Return a minimal service object for invalid package.json
            return {
                name: 'unknown',
                path: servicePath,
                type: 'unknown',
            };
        }
    }
    /**
     * Detect service type from package.json contents
     */
    detectServiceType(pkg) {
        // Check for common frameworks/dependencies
        const dependencies = pkg.dependencies || {};
        const devDependencies = pkg.devDependencies || {};
        const allDeps = { ...dependencies, ...devDependencies };
        if (allDeps.express || allDeps.koa || allDeps.fastify || allDeps.hapi) {
            return 'node';
        }
        if (allDeps.react || allDeps.vue || allDeps['@angular/core']) {
            return 'frontend';
        }
        if (allDeps.typescript) {
            return 'node';
        }
        // Default to node if it has a package.json
        return 'node';
    }
}
