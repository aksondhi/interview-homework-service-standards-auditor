import { mkdir } from 'fs/promises';
import { dirname } from 'path';
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
export class BaseReporter {
    /**
     * Ensure the output directory exists
     *
     * Creates the directory structure needed for the output file if it doesn't exist.
     *
     * @param filePath - Path to the output file
     * @throws {ReportGenerationError} If directory creation fails
     */
    async ensureDirectory(filePath) {
        const dir = dirname(filePath);
        try {
            await mkdir(dir, { recursive: true });
        }
        catch (error) {
            const fsError = error;
            throw new FileSystemError(`Failed to create output directory: ${fsError.message}`, dir, 'write', fsError);
        }
    }
    /**
     * Handle errors during report generation
     * @param error - The error that occurred
     * @param outputPath - Path where the report was being written
     */
    handleGenerationError(error, outputPath) {
        if (error instanceof FileSystemError || error instanceof ReportGenerationError) {
            throw error;
        }
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new ReportGenerationError(`Failed to generate ${this.getFormat()} report: ${errorMsg}`, this.getFormat(), outputPath, error instanceof Error ? error : undefined);
    }
}
