#!/usr/bin/env node

/**
 * GitHub Action wrapper for Service Standards Auditor
 *
 * This script adapts the CLI tool for use as a GitHub Action,
 * providing action-specific features like outputs and PR comments.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { resolve, join } from 'path';
import { parseConfig } from './config/parser.js';
import { Auditor } from './auditor/auditor.js';
import { ReporterFactory } from './reporters/reporter-factory.js';
import type { OutputFormat } from './types/common.js';
import type { AuditReport } from './types/result.js';

async function run(): Promise<void> {
  try {
    // Get inputs
    const path = core.getInput('path') || '.';
    const configPath = core.getInput('config');
    const output = (core.getInput('output') || 'both') as OutputFormat;
    const outdir = core.getInput('outdir') || './reports';
    const failOnError = core.getInput('fail-on-error') === 'true';
    const commentPR = core.getInput('comment-pr') === 'true';

    core.info(`🔍 Service Standards Auditor`);
    core.info(`   Path: ${path}`);
    core.info(`   Config: ${configPath}`);
    core.info(`   Output: ${output} → ${outdir}`);

    // Parse configuration
    core.startGroup('📋 Loading configuration');
    const config = await parseConfig(configPath);
    core.info(`✓ Loaded ${config.rules.length} rules`);
    core.endGroup();

    // Run audit
    core.startGroup('🔎 Auditing services');
    const auditor = new Auditor(config);
    const report = await auditor.audit(resolve(path));
    core.info(`✓ Audited ${report.summary.totalServices} services`);
    core.endGroup();

    // Generate reports
    core.startGroup('📊 Generating reports');
    const reporters = ReporterFactory.createReporters(output);
    const reportPaths: string[] = [];

    for (const reporter of reporters) {
      const ext = reporter.getExtension();
      const filename = `audit-report${ext}`;
      const outputPath = join(outdir, filename);

      await reporter.generate(report, outputPath);
      reportPaths.push(outputPath);
      core.info(`✓ Generated ${reporter.getFormat()} report: ${outputPath}`);
    }
    core.endGroup();

    // Calculate overall pass status
    const allPassed = report.summary.passedServices === report.summary.totalServices;

    // Set outputs
    core.setOutput('report-path', reportPaths.join(','));
    core.setOutput('passed', allPassed.toString());
    core.setOutput('total-services', report.summary.totalServices.toString());
    core.setOutput('passed-services', report.summary.passedServices.toString());
    core.setOutput('pass-rate', report.summary.passRate.toFixed(2));

    // Display summary
    core.startGroup('📈 Audit Summary');
    core.info(`Total Services: ${report.summary.totalServices}`);
    core.info(`Passed: ${report.summary.passedServices}`);
    core.info(`Failed: ${report.summary.failedServices}`);
    core.info(`Pass Rate: ${report.summary.passRate.toFixed(2)}%`);
    core.info(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    core.endGroup();

    // Create GitHub Actions summary
    await createSummary(report, reportPaths);

    // Post PR comment if requested
    if (commentPR && github.context.payload.pull_request) {
      await postPRComment(report);
    }

    // Fail action if requested and audit failed
    if (failOnError && !allPassed) {
      core.setFailed(
        `❌ Audit failed: ${report.summary.failedServices} services did not meet required standards`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

/**
 * Create GitHub Actions job summary
 */
async function createSummary(report: AuditReport, reportPaths: string[]): Promise<void> {
  const summary = core.summary.addHeading('📊 Service Standards Audit Results', 2).addRaw('\n');

  // Calculate overall status and rule counts
  const allPassed = report.summary.passedServices === report.summary.totalServices;
  const statusEmoji = allPassed ? '✅' : '❌';
  const statusText = allPassed ? 'PASSED' : 'FAILED';

  const totalRules = report.services.reduce((sum, s) => sum + s.results.length, 0);
  const passedRules = report.services.reduce(
    (sum, s) => sum + s.results.filter((r) => r.passed).length,
    0
  );

  summary.addRaw(`## ${statusEmoji} Overall Status: ${statusText}\n\n`);

  // Summary table
  summary.addTable([
    [
      { data: 'Metric', header: true },
      { data: 'Value', header: true },
    ],
    ['Total Services', report.summary.totalServices.toString()],
    ['Passed Services', `${report.summary.passedServices} ✅`],
    ['Failed Services', `${report.summary.failedServices} ❌`],
    ['Pass Rate', `${report.summary.passRate.toFixed(2)}%`],
    ['Total Rules', totalRules.toString()],
    ['Passed Rules', passedRules.toString()],
  ]);

  // Service details
  if (report.services && report.services.length > 0) {
    summary.addHeading('Services', 3);

    const serviceRows = report.services.map((service) => {
      const passedRules = service.results.filter((r) => r.passed).length;
      const totalRules = service.results.length;
      return [
        service.serviceName,
        service.passed ? '✅' : '❌',
        `${service.score.toFixed(1)}%`,
        `${passedRules}/${totalRules}`,
      ];
    });

    summary.addTable([
      [
        { data: 'Service', header: true },
        { data: 'Status', header: true },
        { data: 'Score', header: true },
        { data: 'Rules', header: true },
      ],
      ...serviceRows,
    ]);
  }

  // Report links
  if (reportPaths.length > 0) {
    summary.addHeading('Reports', 3);
    summary.addList(reportPaths.map((path) => `📄 \`${path}\``));
  }

  await summary.write();
}

/**
 * Post audit results as PR comment
 */
async function postPRComment(report: AuditReport): Promise<void> {
  try {
    const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    if (!token) {
      core.warning('Cannot post PR comment: github-token not provided');
      return;
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      return;
    }

    const allPassed = report.summary.passedServices === report.summary.totalServices;
    const statusEmoji = allPassed ? '✅' : '❌';
    const statusText = allPassed ? 'PASSED' : 'FAILED';

    let comment = `## ${statusEmoji} Service Standards Audit: ${statusText}\n\n`;
    comment += `**Summary:**\n`;
    comment += `- Total Services: ${report.summary.totalServices}\n`;
    comment += `- Passed: ${report.summary.passedServices} ✅\n`;
    comment += `- Failed: ${report.summary.failedServices} ❌\n`;
    comment += `- Pass Rate: ${report.summary.passRate.toFixed(2)}%\n\n`;

    if (report.services && report.services.length > 0) {
      comment += `<details>\n<summary>📋 Service Details</summary>\n\n`;
      comment += `| Service | Status | Score | Rules Passed |\n`;
      comment += `|---------|--------|-------|-------------|\n`;

      for (const service of report.services) {
        const statusIcon = service.passed ? '✅' : '❌';
        const passedRules = service.results.filter((r) => r.passed).length;
        const totalRules = service.results.length;
        comment += `| ${service.serviceName} | ${statusIcon} | ${service.score.toFixed(1)}% | ${passedRules}/${totalRules} |\n`;
      }

      comment += `\n</details>\n`;
    }

    comment += `\n---\n*Audited with [Service Standards Auditor](https://github.com/aksondhi/service-standards-auditor)*`;

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: comment,
    });

    core.info('✓ Posted audit results to PR');
  } catch (error) {
    core.warning(`Failed to post PR comment: ${error}`);
  }
}

// Run the action
run();
