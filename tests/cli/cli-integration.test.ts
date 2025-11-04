import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseConfig } from '../../src/config/parser.js';
import { Auditor } from '../../src/auditor/auditor.js';
import { ReporterFactory } from '../../src/reporters/reporter-factory.js';
import type { OutputFormat } from '../../src/types/common.js';

describe('CLI Integration', () => {
  let testDir: string;
  let configPath: string;
  let reportDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `ssa-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    reportDir = path.join(testDir, 'reports');

    // Create a simple service structure
    const servicePath = path.join(testDir, 'test-service');
    await fs.mkdir(servicePath, { recursive: true });
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      JSON.stringify({ name: 'test-service', version: '1.0.0' }, null, 2)
    );
    await fs.writeFile(path.join(servicePath, 'README.md'), '# Test Service');

    // Create a simple config file
    configPath = path.join(testDir, 'rules.yml');
    await fs.writeFile(
      configPath,
      `
version: '1.0'
rules:
  - type: file-exists
    name: readme
    target: README.md
    required: true
  - type: file-exists
    name: dockerfile
    target: Dockerfile
    required: false
`
    );
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Basic Workflow', () => {
    it('should parse config, audit services, and generate report', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report).toBeDefined();
      expect(report.services.length).toBeGreaterThan(0);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalServices).toBe(1);
    });

    it('should detect service with README', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const service = report.services[0];
      expect(service.serviceName).toBe('test-service');

      const readmeResult = service.results.find((r) => r.ruleName === 'readme');
      expect(readmeResult).toBeDefined();
      expect(readmeResult?.passed).toBe(true);
    });

    it('should detect missing Dockerfile', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const service = report.services[0];
      const dockerfileResult = service.results.find((r) => r.ruleName === 'dockerfile');
      expect(dockerfileResult).toBeDefined();
      expect(dockerfileResult?.passed).toBe(false);
    });
  });

  describe('Report Generation', () => {
    it('should create JSON report in specified directory', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const reporters = ReporterFactory.createReporters('json' as OutputFormat);
      const reportPath = path.join(reportDir, 'audit-report.json');

      await reporters[0].generate(report, reportPath);

      const exists = await fs
        .access(reportPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should generate valid JSON report content', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const reporters = ReporterFactory.createReporters('json' as OutputFormat);
      const reportPath = path.join(reportDir, 'audit-report.json');

      await reporters[0].generate(report, reportPath);

      const content = await fs.readFile(reportPath, 'utf8');
      const parsedReport = JSON.parse(content);

      expect(parsedReport).toHaveProperty('summary');
      expect(parsedReport).toHaveProperty('services');
      expect(parsedReport).toHaveProperty('timestamp');
      expect(parsedReport.services.length).toBe(1);
    });

    it('should generate Markdown report', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const reporters = ReporterFactory.createReporters('md' as OutputFormat);
      const reportPath = path.join(reportDir, 'audit-report.md');

      await reporters[0].generate(report, reportPath);

      const exists = await fs
        .access(reportPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(reportPath, 'utf8');
      expect(content).toContain('# Service Standards Audit Report');
    });

    it('should generate HTML report', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const reporters = ReporterFactory.createReporters('html' as OutputFormat);
      const reportPath = path.join(reportDir, 'audit-report.html');

      await reporters[0].generate(report, reportPath);

      const exists = await fs
        .access(reportPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(reportPath, 'utf8');
      expect(content).toContain('Service Standards Audit Report');
      expect(content).toContain('chart.js');
    });

    it('should generate both JSON and Markdown with "both" format', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      const reporters = ReporterFactory.createReporters('both' as OutputFormat);
      expect(reporters.length).toBe(2);

      const jsonPath = path.join(reportDir, 'audit-report.json');
      const mdPath = path.join(reportDir, 'audit-report.md');

      await reporters[0].generate(report, jsonPath);
      await reporters[1].generate(report, mdPath);

      const jsonExists = await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false);
      const mdExists = await fs
        .access(mdPath)
        .then(() => true)
        .catch(() => false);

      expect(jsonExists).toBe(true);
      expect(mdExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should fail when config file is missing', async () => {
      await expect(parseConfig('/nonexistent/config.yml')).rejects.toThrow();
    });

    it('should fail when path does not exist', async () => {
      const config = await parseConfig(configPath);
      const auditor = new Auditor(config);

      await expect(auditor.audit('/nonexistent/path')).rejects.toThrow();
    });

    it('should reject invalid output format', () => {
      expect(ReporterFactory.isValidFormat('invalid' as OutputFormat)).toBe(false);
    });

    it('should throw error when creating reporter with invalid format', () => {
      expect(() => {
        ReporterFactory.createReporter('invalid' as OutputFormat);
      }).toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should validate supported formats', () => {
      const supported = ReporterFactory.getSupportedFormats();
      expect(supported).toContain('json');
      expect(supported).toContain('md');
      expect(supported).toContain('html');
      expect(supported).toContain('both');
    });

    it('should validate format correctly', () => {
      expect(ReporterFactory.isValidFormat('json' as OutputFormat)).toBe(true);
      expect(ReporterFactory.isValidFormat('md' as OutputFormat)).toBe(true);
      expect(ReporterFactory.isValidFormat('html' as OutputFormat)).toBe(true);
      expect(ReporterFactory.isValidFormat('both' as OutputFormat)).toBe(true);
      expect(ReporterFactory.isValidFormat('invalid' as OutputFormat)).toBe(false);
    });
  });
});
