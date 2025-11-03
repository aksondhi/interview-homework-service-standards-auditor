import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { HTMLReporter } from '../../src/reporters/html-reporter.js';
import { mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AuditReport } from '../../src/types/result.js';

describe('HTMLReporter', () => {
  let testDir: string;
  let reporter: HTMLReporter;
  let mockReport: AuditReport;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-html-reporter-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    reporter = new HTMLReporter();

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
    it('should generate HTML report from audit data', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('Service Standards Audit Report');
    });

    it('should include Chart.js library', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('chart.js');
    });

    it('should embed styles in HTML', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('<style>');
      expect(content).toContain('</style>');
    });

    it('should include summary statistics', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('Total Services');
      expect(content).toContain('Passed');
      expect(content).toContain('Failed');
    });

    it('should include service details', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('test-service');
      expect(content).toContain('has-readme');
      expect(content).toContain('has-tests');
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

      const outputPath = join(testDir, 'multi-report.html');
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

      const outputPath = join(testDir, 'empty-report.html');
      await reporter.generate(emptyReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('No services');
    });

    it('should create output directory if it does not exist', async () => {
      const nestedDir = join(testDir, 'nested', 'reports');
      const outputPath = join(nestedDir, 'report.html');

      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
    });

    it('should include timestamp in report', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('2025');
    });

    it('should include chart data in script', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      // Should include script tag with chart initialization
      expect(content).toContain('<script>');
      expect(content).toContain('</script>');
    });

    it('should be valid HTML', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      // Basic HTML structure validation
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('<head>');
      expect(content).toContain('</head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</body>');
      expect(content).toContain('</html>');
    });

    it('should include service scores', async () => {
      const outputPath = join(testDir, 'report.html');
      await reporter.generate(mockReport, outputPath);

      const content = await readFile(outputPath, 'utf-8');

      expect(content).toContain('50'); // score
    });
  });

  describe('getFormat', () => {
    it('should return html format', () => {
      expect(reporter.getFormat()).toBe('html');
    });
  });

  describe('getExtension', () => {
    it('should return .html extension', () => {
      expect(reporter.getExtension()).toBe('.html');
    });
  });
});
