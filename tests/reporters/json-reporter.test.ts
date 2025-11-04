import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSONReporter } from '../../src/reporters/json-reporter.js';
import { mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AuditReport } from '../../src/types/result.js';

describe('JSONReporter', () => {
  let testDir: string;
  let reporter: JSONReporter;
  let mockReport: AuditReport;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-reporter-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    reporter = new JSONReporter();

    // Create a mock audit report
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
    it('should generate JSON report from audit data', async () => {
      const outputPath = join(testDir, 'report.json');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(mockReport);
    });

    it('should create output directory if it does not exist', async () => {
      const nestedDir = join(testDir, 'nested', 'reports');
      const outputPath = join(nestedDir, 'report.json');

      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      expect(JSON.parse(content)).toEqual(mockReport);
    });

    it('should format JSON with pretty printing', async () => {
      const outputPath = join(testDir, 'report.json');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      // Check for indentation (pretty printing)
      expect(content).toContain('  "timestamp"');
      expect(content).toContain('  "services"');
      expect(content).toContain('    "serviceName"');
    });

    it('should include all report fields', async () => {
      const outputPath = join(testDir, 'report.json');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.services).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalServices).toBe(1);
      expect(parsed.summary.passRate).toBe(0);
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

      const outputPath = join(testDir, 'empty-report.json');
      await reporter.generate(emptyReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.services).toHaveLength(0);
      expect(parsed.summary.totalServices).toBe(0);
    });

    it('should handle multiple services', async () => {
      const multiServiceReport: AuditReport = {
        timestamp: '2025-11-03T12:00:00.000Z',
        services: [
          {
            serviceName: 'service-1',
            servicePath: '/path/to/service-1',
            results: [],
            passed: true,
            score: 100,
          },
          {
            serviceName: 'service-2',
            servicePath: '/path/to/service-2',
            results: [],
            passed: true,
            score: 100,
          },
        ],
        summary: {
          totalServices: 2,
          passedServices: 2,
          failedServices: 0,
          passRate: 100,
        },
      };

      const outputPath = join(testDir, 'multi-report.json');
      await reporter.generate(multiServiceReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.services).toHaveLength(2);
      expect(parsed.summary.totalServices).toBe(2);
    });

    it('should preserve rule result details', async () => {
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
                    functions: 90,
                    branches: 80,
                  },
                  threshold: 80,
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

      const outputPath = join(testDir, 'detailed-report.json');
      await reporter.generate(detailedReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.services[0].results[0].details).toBeDefined();
      expect(parsed.services[0].results[0].details.coverage.lines).toBe(85);
    });

    it('should overwrite existing file', async () => {
      const outputPath = join(testDir, 'report.json');

      // Write first report
      await reporter.generate(mockReport, outputPath);

      // Modify report and write again
      mockReport.summary.totalServices = 999;
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.summary.totalServices).toBe(999);
    });

    it('should handle write errors gracefully', async () => {
      const invalidPath = '/nonexistent/directory/that/does/not/exist/report.json';

      await expect(reporter.generate(mockReport, invalidPath)).rejects.toThrow();
    });
  });

  describe('getFormat', () => {
    it('should return json format', () => {
      expect(reporter.getFormat()).toBe('json');
    });
  });

  describe('getExtension', () => {
    it('should return .json extension', () => {
      expect(reporter.getExtension()).toBe('.json');
    });
  });
});
