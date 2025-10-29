import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { ConfigSchema, type AuditorConfig } from './schema.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('config');

export async function parseConfig(configPath: string): Promise<AuditorConfig> {
  logger.info(`Loading config from: ${configPath}`);

  try {
    const fileContent = await readFile(configPath, 'utf-8');
    const rawConfig = YAML.parse(fileContent);

    const validatedConfig = ConfigSchema.parse(rawConfig);
    logger.debug(`Config validated successfully with ${validatedConfig.rules.length} rules`);

    return validatedConfig;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Config validation failed: ${error.message}`);
    }
    throw new Error(`Failed to parse config: ${error}`);
  }
}
