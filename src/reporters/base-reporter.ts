import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { AuditReport } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';
import { ReportGenerationError, FileSystemError } from '../utils/errors.js';

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
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      const fsError = error as NodeJS.ErrnoException;
      throw new FileSystemError(
        `Failed to create output directory: ${fsError.message}`,
        dir,
        'write',
        fsError
      );
    }
  }

  /**
   * Handle errors during report generation
   * @param error - The error that occurred
   * @param outputPath - Path where the report was being written
   */
  protected handleGenerationError(error: unknown, outputPath: string): never {
    if (error instanceof FileSystemError || error instanceof ReportGenerationError) {
      throw error;
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new ReportGenerationError(
      `Failed to generate ${this.getFormat()} report: ${errorMsg}`,
      this.getFormat(),
      outputPath,
      error instanceof Error ? error : undefined
    );
  }
}
