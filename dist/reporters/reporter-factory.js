import { JSONReporter } from './json-reporter.js';
import { MarkdownReporter } from './markdown-reporter.js';
import { HTMLReporter } from './html-reporter.js';
import { createLogger } from '../utils/logger.js';
const log = createLogger('reporters:factory');
/**
 * Factory for creating reporter instances
 *
 * The ReporterFactory maps output format strings to concrete reporter implementations.
 * It supports creating single or multiple reporters based on the format.
 *
 * @example
 * ```typescript
 * // Create a single reporter
 * const reporter = ReporterFactory.createReporter('json');
 * await reporter.generate(report, './report.json');
 *
 * // Create multiple reporters for 'both' format
 * const reporters = ReporterFactory.createReporters('both');
 * ```
 */
export class ReporterFactory {
    /**
     * Create a single reporter for a specific format
     *
     * @param format - Output format (json, md, or html)
     * @returns Reporter instance for the specified format
     * @throws {Error} If format is 'both' (use createReporters instead) or unsupported
     */
    static createReporter(format) {
        if (format === 'both') {
            throw new Error('Invalid format for single reporter. Use createReporters() for both format.');
        }
        log.debug(`Creating reporter for format: ${format}`);
        switch (format) {
            case 'json':
                return new JSONReporter();
            case 'md':
                return new MarkdownReporter();
            case 'html':
                return new HTMLReporter();
            default:
                throw new Error(`Unsupported output format: ${format}`);
        }
    }
    /**
     * Create reporters for the specified format
     *
     * For 'both' format, creates both JSON and Markdown reporters.
     * For single formats, returns an array with one reporter.
     *
     * @param format - Output format (json, md, html, or both)
     * @returns Array of reporter instances
     * @throws {Error} If format is unsupported
     */
    static createReporters(format) {
        log.debug(`Creating reporters for format: ${format}`);
        if (format === 'both') {
            log.debug('Creating both JSON and Markdown reporters');
            return [new JSONReporter(), new MarkdownReporter()];
        }
        return [this.createReporter(format)];
    }
    /**
     * Get the file extension for a specific format
     * @param format - Output format (not 'both')
     * @returns File extension with leading dot
     * @throws Error if format is 'both' or invalid
     */
    static getExtensionForFormat(format) {
        if (format === 'both') {
            throw new Error('Cannot get single extension for both format. Use createReporters() instead.');
        }
        const reporter = this.createReporter(format);
        return reporter.getExtension();
    }
    /**
     * Get all supported output formats
     * @returns Array of supported format strings
     */
    static getSupportedFormats() {
        return ['json', 'md', 'html', 'both'];
    }
    /**
     * Check if a format is valid
     * @param format - Format string to validate
     * @returns True if format is supported
     */
    static isValidFormat(format) {
        return this.getSupportedFormats().includes(format);
    }
}
