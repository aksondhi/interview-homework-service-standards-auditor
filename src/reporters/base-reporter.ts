import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { AuditReport } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';
import { ReportGenerationError, FileSystemError } from '../utils/errors.js';

/**
 * Abstract base class for all reporters
 *
 * Defines the interface for generating reports from audit data.
 * Concrete implementations must provide format-specific generation logic.
 *
 * @example
 * ```typescript
 * class CustomReporter extends BaseReporter {
 *   async generate(report: AuditReport, outputPath: string): Promise<void> {
 *     // Generate custom format
 *   }
 *   getFormat(): OutputFormat { return 'custom'; }
 *   getExtension(): string { return '.custom'; }
 * }
 * ```
 */
export abstract class BaseReporter {
  /**
   * Generate a report from audit data
   *
   * Implementations should write the report to the specified file path.
   * The output directory will be created automatically if needed.
   *
   * @param report - The audit report data to format
   * @param outputPath - Full path where the report should be written
   * @throws {ReportGenerationError} If report generation fails
   */
  abstract generate(report: AuditReport, outputPath: string): Promise<void>;

  /**
   * Get the output format this reporter handles
   *
   * @returns The format identifier (e.g., 'json', 'md', 'html')
   */
  abstract getFormat(): OutputFormat;

  /**
   * Get the file extension for this reporter's output
   *
   * @returns The file extension including the dot (e.g., '.json', '.md', '.html')
   */
  abstract getExtension(): string;

  /**
   * Ensure the output directory exists
   *
   * Creates the directory structure needed for the output file if it doesn't exist.
   *
   * @param filePath - Path to the output file
   * @throws {ReportGenerationError} If directory creation fails
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
