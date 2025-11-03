import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { AuditReport } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';

/**
 * Abstract base class for all reporters
 * Defines the interface for generating reports from audit data
 */
export abstract class BaseReporter {
  /**
   * Generate a report from audit data
   * @param report - The audit report data
   * @param outputPath - Path where the report should be written
   */
  abstract generate(report: AuditReport, outputPath: string): Promise<void>;

  /**
   * Get the output format this reporter handles
   */
  abstract getFormat(): OutputFormat;

  /**
   * Get the file extension for this reporter's output
   */
  abstract getExtension(): string;

  /**
   * Ensure the output directory exists
   * @param filePath - Path to the output file
   */
  protected async ensureDirectory(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }
}
