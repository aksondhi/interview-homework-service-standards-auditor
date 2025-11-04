import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { ZodError } from 'zod';
import { ConfigSchema, type AuditorConfig } from './schema.js';
import { createLogger } from '../utils/logger.js';
import { ConfigurationError, FileSystemError } from '../utils/errors.js';

const logger = createLogger('config');

/**
 * Parse and validate an auditor configuration file
 *
 * @param configPath - Path to the YAML configuration file
 * @returns Validated auditor configuration
 * @throws {ConfigurationError} If the configuration file is invalid or validation fails
 * @throws {FileSystemError} If the configuration file cannot be read
 *
 * @example
 * ```typescript
 * const config = await parseConfig('./my-rules.yml');
 * console.log(`Loaded ${config.rules.length} rules`);
 * ```
 */
export async function parseConfig(configPath: string): Promise<AuditorConfig> {
  logger.info(`Loading config from: ${configPath}`);

  try {
    // Read config file
    let fileContent: string;
    try {
      fileContent = await readFile(configPath, 'utf-8');
    } catch (error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        throw new ConfigurationError(`Configuration file not found: ${configPath}`, configPath);
      }
      throw new FileSystemError(
        `Failed to read configuration file: ${fsError.message}`,
        configPath,
        'read',
        fsError
      );
    }

    // Parse YAML
    let rawConfig: unknown;
    try {
      rawConfig = YAML.parse(fileContent);
    } catch (error) {
      const yamlError = error as Error;
      throw new ConfigurationError(`Invalid YAML syntax: ${yamlError.message}`, configPath);
    }

    // Validate schema
    try {
      const validatedConfig = ConfigSchema.parse(rawConfig);
      logger.debug(`Config validated successfully with ${validatedConfig.rules.length} rules`);
      return validatedConfig;
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues
          .map((issue) => {
            const path = issue.path.join('.');
            return `  - ${path}: ${issue.message}`;
          })
          .join('\n');
        throw new ConfigurationError(`Configuration validation failed:\n${issues}`, configPath);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof FileSystemError) {
      logger.error(error.message);
      throw error;
    }
    logger.error(`Unexpected error parsing config: ${error}`);
    throw new ConfigurationError(`Unexpected error parsing configuration: ${error}`, configPath);
  }
}
