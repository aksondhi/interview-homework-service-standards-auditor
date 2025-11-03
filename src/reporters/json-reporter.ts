import { writeFile } from 'fs/promises';
import { BaseReporter } from './base-reporter.js';
import { createLogger } from '../utils/logger.js';
import type { AuditReport } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';

const log = createLogger('reporters:json');

/**
 * JSON Reporter
 * Generates JSON format audit reports
 */
export class JSONReporter extends BaseReporter {
  /**
   * Generate a JSON report from audit data
   * @param report - The audit report data
   * @param outputPath - Path where the JSON file should be written
   */
  async generate(report: AuditReport, outputPath: string): Promise<void> {
    log.info(`Generating JSON report: ${outputPath}`);

    try {
      // Ensure output directory exists
      await this.ensureDirectory(outputPath);

      // Convert report to pretty-printed JSON
      const jsonContent = JSON.stringify(report, null, 2);

      // Write to file
      await writeFile(outputPath, jsonContent, 'utf-8');

      log.info(`JSON report written successfully to: ${outputPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to generate JSON report: ${errorMessage}`);
      throw new Error(`Failed to generate JSON report: ${errorMessage}`);
    }
  }

  /**
   * Get the output format this reporter handles
   */
  getFormat(): OutputFormat {
    return 'json';
  }

  /**
   * Get the file extension for JSON reports
   */
  getExtension(): string {
    return '.json';
  }
}
