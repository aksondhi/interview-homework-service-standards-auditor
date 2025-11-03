import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MarkdownReporter } from '../../src/reporters/markdown-reporter.js';
import { mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AuditReport } from '../../src/types/result.js';

describe('MarkdownReporter', () => {
  let testDir: string;
  let reporter: MarkdownReporter;
  let mockReport: AuditReport;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-md-reporter-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    reporter = new MarkdownReporter();

    mockReport = {
      timestamp: '2025-11-03T12:00:00.000Z',
      services: [
        {
          serviceName: 'test-service',
          servicePath: '/path/to/test-service',
          results: [
            {
              ruleName: 'has-readme',
              passed: true,
              message: 'README.md exists',
            },
            {
              ruleName: 'has-tests',
              passed: false,
              message: 'No test files found',
            },
          ],
          passed: false,
          score: 50,
        },
      ],
      summary: {
        totalServices: 1,
        passedServices: 0,
        failedServices: 1,
        passRate: 0,
      },
    };
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('generate', () => {
    it('should generate Markdown report from audit data', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('# Service Standards Audit Report');
      expect(content).toContain('test-service');
    });

    it('should include summary statistics', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('## Summary');
      expect(content).toContain('Total Services');
      expect(content).toContain('Passed');
      expect(content).toContain('Failed');
      expect(content).toContain('Pass Rate');
    });

    it('should include timestamp', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('Generated:');
      expect(content).toContain('2025');
    });

    it('should show pass/fail indicators', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('✅'); // Pass indicator
      expect(content).toContain('❌'); // Fail indicator
    });

    it('should format service results as table', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      // Check for table structure
      expect(content).toContain('| Rule');
      expect(content).toContain('| Status');
      expect(content).toContain('| Message');
      expect(content).toContain('|---');
    });

    it('should include service scores', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('Score:');
      expect(content).toContain('50');
    });

    it('should handle multiple services', async () => {
      const multiServiceReport: AuditReport = {
        timestamp: '2025-11-03T12:00:00.000Z',
        services: [
          {
            serviceName: 'service-1',
            servicePath: '/path/to/service-1',
            results: [
              {
                ruleName: 'test-rule',
                passed: true,
                message: 'All good',
              },
            ],
            passed: true,
            score: 100,
          },
          {
            serviceName: 'service-2',
            servicePath: '/path/to/service-2',
            results: [
              {
                ruleName: 'test-rule',
                passed: false,
                message: 'Failed',
              },
            ],
            passed: false,
            score: 0,
          },
        ],
        summary: {
          totalServices: 2,
          passedServices: 1,
          failedServices: 1,
          passRate: 50,
        },
      };

      const outputPath = join(testDir, 'multi-report.md');
      await reporter.generate(multiServiceReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('service-1');
      expect(content).toContain('service-2');
    });

    it('should handle empty services array', async () => {
      const emptyReport: AuditReport = {
        timestamp: '2025-11-03T12:00:00.000Z',
        services: [],
        summary: {
          totalServices: 0,
          passedServices: 0,
          failedServices: 0,
          passRate: 0,
        },
      };

      const outputPath = join(testDir, 'empty-report.md');
      await reporter.generate(emptyReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('No services found');
    });

    it('should create output directory if it does not exist', async () => {
      const nestedDir = join(testDir, 'nested', 'reports');
      const outputPath = join(nestedDir, 'report.md');

      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('# Service Standards Audit Report');
    });

    it('should include rule details when present', async () => {
      const detailedReport: AuditReport = {
        timestamp: '2025-11-03T12:00:00.000Z',
        services: [
          {
            serviceName: 'detailed-service',
            servicePath: '/path/to/service',
            results: [
              {
                ruleName: 'coverage-check',
                passed: true,
                message: 'Coverage meets threshold',
                details: {
                  coverage: {
                    lines: 85,
                    statements: 87,
                  },
                },
              },
            ],
            passed: true,
            score: 100,
          },
        ],
        summary: {
          totalServices: 1,
          passedServices: 1,
          failedServices: 0,
          passRate: 100,
        },
      };

      const outputPath = join(testDir, 'detailed-report.md');
      await reporter.generate(detailedReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      // Details should be included in some form
      expect(content).toContain('coverage-check');
      expect(content).toContain('Coverage meets threshold');
    });

    it('should show overall status', async () => {
      const outputPath = join(testDir, 'report.md');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('test-service');
      expect(content).toMatch(/❌.*FAILED|FAILED.*❌/); // Service failed
    });
  });

  describe('getFormat', () => {
    it('should return md format', () => {
      expect(reporter.getFormat()).toBe('md');
    });
  });

  describe('getExtension', () => {
    it('should return .md extension', () => {
      expect(reporter.getExtension()).toBe('.md');
    });
  });
});
