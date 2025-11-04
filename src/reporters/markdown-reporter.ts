import { writeFile } from 'fs/promises';
import { BaseReporter } from './base-reporter.js';
import { createLogger } from '../utils/logger.js';
import type { AuditReport, ServiceAuditResult } from '../types/result.js';
import type { OutputFormat } from '../types/common.js';

const log = createLogger('reporters:markdown');

/**
 * Markdown Reporter
 * Generates Markdown format audit reports
 */
export class MarkdownReporter extends BaseReporter {
  /**
   * Generate a Markdown report from audit data
   * @param report - The audit report data
   * @param outputPath - Path where the Markdown file should be written
   */
  async generate(report: AuditReport, outputPath: string): Promise<void> {
    log.info(`Generating Markdown report: ${outputPath}`);

    try {
      // Ensure output directory exists
      await this.ensureDirectory(outputPath);

      // Generate Markdown content
      const markdown = this.buildMarkdown(report);

      // Write to file
      await writeFile(outputPath, markdown, 'utf-8');

      log.info(`Markdown report written successfully to: ${outputPath}`);
    } catch (error) {
      log.error(`Failed to generate Markdown report: ${error}`);
      this.handleGenerationError(error, outputPath);
    }
  }

  /**
   * Build Markdown content from audit report
   * @param report - The audit report data
   * @returns Markdown formatted string
   */
  private buildMarkdown(report: AuditReport): string {
    const sections: string[] = [];

    // Header
    sections.push('# Service Standards Audit Report\n');
    sections.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`);
    sections.push('---\n');

    // Summary
    sections.push(this.buildSummary(report));

    // Services
    if (report.services.length === 0) {
      sections.push('## Services\n');
      sections.push('No services found in the audit.\n');
    } else {
      sections.push('## Services\n');
      report.services.forEach((service) => {
        sections.push(this.buildServiceSection(service));
      });
    }

    return sections.join('\n');
  }

  /**
   * Build summary section
   * @param report - The audit report data
   * @returns Markdown summary section
   */
  private buildSummary(report: AuditReport): string {
    const { totalServices, passedServices, failedServices, passRate } = report.summary;

    const lines: string[] = [
      '## Summary\n',
      '| Metric | Value |',
      '|--------|-------|',
      `| Total Services | ${totalServices} |`,
      `| Passed | ${passedServices} ✅ |`,
      `| Failed | ${failedServices} ❌ |`,
      `| Pass Rate | ${passRate.toFixed(2)}% |`,
      '',
    ];

    return lines.join('\n');
  }

  /**
   * Build service section
   * @param service - Service audit result
   * @returns Markdown service section
   */
  private buildServiceSection(service: ServiceAuditResult): string {
    const statusIcon = service.passed ? '✅' : '❌';
    const statusText = service.passed ? 'PASSED' : 'FAILED';

    const lines: string[] = [
      `### ${statusIcon} ${service.serviceName} - ${statusText}\n`,
      `**Path:** \`${service.servicePath}\`  `,
      `**Score:** ${service.score}%\n`,
    ];

    // Rules table
    if (service.results.length > 0) {
      lines.push('#### Rules\n');
      lines.push('| Rule | Status | Message |');
      lines.push('|------|--------|---------|');

      service.results.forEach((result) => {
        const status = result.passed ? '✅ Pass' : '❌ Fail';
        const message = this.escapeMarkdown(result.message);
        lines.push(`| ${result.ruleName} | ${status} | ${message} |`);
      });

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Escape special Markdown characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/\r/g, '');
  }

  /**
   * Get the output format this reporter handles
   */
  getFormat(): OutputFormat {
    return 'md';
  }

  /**
   * Get the file extension for Markdown reports
   */
  getExtension(): string {
    return '.md';
  }
}
