import { writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { BaseReporter } from './base-reporter.js';
import { createLogger } from '../utils/logger.js';
import type { AuditReport } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';

const log = createLogger('reporters:html');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * HTML Reporter
 * Generates HTML format audit reports with Chart.js visualizations
 */
export class HTMLReporter extends BaseReporter {
  private template: HandlebarsTemplateDelegate | null = null;

  /**
   * Generate an HTML report from audit data
   * @param report - The audit report data
   * @param outputPath - Path where the HTML file should be written
   */
  async generate(report: AuditReport, outputPath: string): Promise<void> {
    log.info(`Generating HTML report: ${outputPath}`);

    try {
      // Ensure output directory exists
      await this.ensureDirectory(outputPath);

      // Load template if not already loaded
      if (!this.template) {
        await this.loadTemplate();
      }

      // Prepare data for template
      const templateData = this.prepareTemplateData(report);

      // Generate HTML from template
      const html = this.template!(templateData);

      // Write to file
      await writeFile(outputPath, html, 'utf-8');

      log.info(`HTML report written successfully to: ${outputPath}`);
    } catch (error) {
      log.error(`Failed to generate HTML report: ${error}`);
      this.handleGenerationError(error, outputPath);
    }
  }

  /**
   * Load the Handlebars template
   */
  private async loadTemplate(): Promise<void> {
    const templatePath = join(__dirname, '..', 'templates', 'report-template.hbs');
    try {
      const templateContent = await readFile(templatePath, 'utf-8');
      this.template = Handlebars.compile(templateContent);
      log.debug('HTML template loaded successfully');
    } catch (error) {
      log.error(`Failed to load HTML template: ${error}`);
      this.handleGenerationError(error, templatePath);
    }
  }

  /**
   * Prepare data for the Handlebars template
   * @param report - The audit report data
   * @returns Template data object
   */
  private prepareTemplateData(report: AuditReport): Record<string, unknown> {
    return {
      timestamp: new Date(report.timestamp).toLocaleString(),
      summary: {
        totalServices: report.summary.totalServices,
        passedServices: report.summary.passedServices,
        failedServices: report.summary.failedServices,
        passRate: report.summary.passRate.toFixed(2),
      },
      services: report.services,
      hasServices: report.services.length > 0,
    };
  }

  /**
   * Get the output format this reporter handles
   */
  getFormat(): OutputFormat {
    return 'html';
  }

  /**
   * Get the file extension for HTML reports
   */
  getExtension(): string {
    return '.html';
  }
}
