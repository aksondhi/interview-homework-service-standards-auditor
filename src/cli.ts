#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { parseConfig } from './config/parser.js';
import { Auditor } from './auditor/auditor.js';
import { ReporterFactory } from './reporters/reporter-factory.js';
import { createLogger } from './utils/logger.js';
import { formatErrorMessage, isAuditorError } from './utils/errors.js';
import { ProgressFactory } from './utils/progress.js';
import type { OutputFormat } from './types/common.js';

const logger = createLogger('cli');

const program = new Command();

program
  .name('service-standards-auditor')
  .description('Audit services for compliance with engineering standards')
  .version('0.1.0')
  .requiredOption('--path <path>', 'Path to services root or a single service')
  .requiredOption('--config <path>', 'Path to YAML rules configuration file')
  .requiredOption('--output <format>', 'Report format: json, md, html, or both')
  .requiredOption('--outdir <dir>', 'Directory to write reports')
  .parse(process.argv);

const opts = program.opts() as {
  path: string;
  config: string;
  output: string;
  outdir: string;
};

async function validateInputs(): Promise<void> {
  // Validate path exists
  try {
    await fs.access(opts.path);
  } catch {
    throw new Error(`Path does not exist: ${opts.path}`);
  }

  // Validate config exists
  try {
    await fs.access(opts.config);
  } catch {
    throw new Error(`Config file does not exist: ${opts.config}`);
  }

  // Validate output format
  if (!ReporterFactory.isValidFormat(opts.output as OutputFormat)) {
    const supported = ReporterFactory.getSupportedFormats().join(', ');
    throw new Error(`Invalid output format: ${opts.output}. Supported formats: ${supported}`);
  }
}

async function main(): Promise<void> {
  try {
    logger.info('Starting Service Standards Auditor...');
    logger.debug(`Options: ${JSON.stringify(opts, null, 2)}`);

    // Create progress indicators
    const enableProgress = ProgressFactory.shouldEnable();
    const { spinner } = ProgressFactory.create(enableProgress);

    // Validate all inputs
    spinner.start('Validating inputs...');
    await validateInputs();
    spinner.succeed('Inputs validated');

    // Parse configuration
    spinner.start(`Loading configuration from ${path.basename(opts.config)}...`);
    logger.info(`Loading configuration from ${opts.config}`);
    const config = await parseConfig(opts.config);
    logger.debug(`Configuration loaded: ${config.rules.length} rules`);
    spinner.succeed(`Configuration loaded (${config.rules.length} rules)`);

    // Run audit with progress tracking
    spinner.start(`Scanning services in ${opts.path}...`);
    logger.info(`Scanning services in ${opts.path}`);
    const auditor = new Auditor(config);

    // Start audit and switch to progress bar once we know the count
    spinner.info(`Found services, starting audit...`);

    // Audit with progress callback
    const report = await auditor.audit(opts.path, (current, total, serviceName) => {
      // Show progress updates in debug mode
      logger.debug(`Progress: ${current}/${total} - ${serviceName}`);
    });

    logger.info(
      `Audit complete: ${report.services.length} services scanned, ` +
        `${report.summary.passedServices} passed, ${report.summary.failedServices} failed`
    );

    console.log(); // Empty line for spacing
    console.log(
      `✅ Audit complete: ${report.services.length} services scanned, ` +
        `${report.summary.passedServices} passed, ${report.summary.failedServices} failed`
    );

    // Generate reports
    const reporters = ReporterFactory.createReporters(opts.output as OutputFormat);
    const reportBaseName = 'audit-report';

    spinner.start('Generating reports...');
    for (const reporter of reporters) {
      const extension = reporter.getExtension();
      const reportPath = path.join(opts.outdir, `${reportBaseName}${extension}`);

      logger.info(`Generating ${reporter.getFormat()} report: ${reportPath}`);
      await reporter.generate(report, reportPath);
    }
    spinner.succeed(
      `Reports generated (${reporters.length} format${reporters.length > 1 ? 's' : ''})`
    );

    // Print summary to console
    console.log('\n✅ Audit complete!');
    console.log(`\nSummary:`);
    console.log(`  Total Services: ${report.summary.totalServices}`);
    console.log(`  Passed: ${report.summary.passedServices} ✅`);
    console.log(`  Failed: ${report.summary.failedServices} ❌`);
    console.log(`  Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log(`\nReports written to: ${opts.outdir}`);

    // Exit with appropriate code
    if (report.summary.failedServices > 0) {
      logger.info('Audit found failures, exiting with code 0 (non-blocking)');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Audit failed:', error);

    // Format error message with context
    if (isAuditorError(error)) {
      console.error(`\n❌ ${formatErrorMessage(error)}`);
    } else if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
      if (error.stack) {
        logger.debug(`Stack trace: ${error.stack}`);
      }
    } else {
      console.error('\n❌ An unknown error occurred');
      logger.debug(`Unknown error: ${String(error)}`);
    }

    process.exit(1);
  }
}

main();
