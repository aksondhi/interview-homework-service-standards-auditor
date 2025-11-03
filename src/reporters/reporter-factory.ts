import { JSONReporter } from './json-reporter.js';
import { MarkdownReporter } from './markdown-reporter.js';
import { HTMLReporter } from './html-reporter.js';
import { createLogger } from '../utils/logger.js';
import type { BaseReporter } from './base-reporter.js';
import type { OutputFormat } from '../types/common.js';

const log = createLogger('reporters:factory');

/**
 * Factory for creating reporter instances
 * Handles creation of single or multiple reporters based on output format
 */
export class ReporterFactory {
  /**
   * Create a single reporter for a specific format
   * @param format - Output format (json, md, or html)
   * @returns Reporter instance
   * @throws Error if format is 'both' or invalid
   */
  static createReporter(format: OutputFormat): BaseReporter {
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
   * For 'both' format, creates JSON and Markdown reporters
   * @param format - Output format
   * @returns Array of reporter instances
   */
  static createReporters(format: OutputFormat): BaseReporter[] {
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
  static getExtensionForFormat(format: OutputFormat): string {
    if (format === 'both') {
      throw new Error(
        'Cannot get single extension for both format. Use createReporters() instead.'
      );
    }

    const reporter = this.createReporter(format);
    return reporter.getExtension();
  }

  /**
   * Get all supported output formats
   * @returns Array of supported format strings
   */
  static getSupportedFormats(): OutputFormat[] {
    return ['json', 'md', 'html', 'both'];
  }

  /**
   * Check if a format is valid
   * @param format - Format string to validate
   * @returns True if format is supported
   */
  static isValidFormat(format: string): format is OutputFormat {
    return this.getSupportedFormats().includes(format as OutputFormat);
  }
}
