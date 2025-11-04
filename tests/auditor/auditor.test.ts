import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Auditor } from '../../src/auditor/auditor.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AuditorConfig } from '../../src/types/config.js';
import type { RuleResult } from '../../src/types/result.js';

describe('Auditor', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-auditor-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Service Discovery and Rule Execution', () => {
    it('should audit a single service with file-exists rules', async () => {
      // Create a service with package.json and README
      const serviceDir = join(testDir, 'test-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(join(serviceDir, 'package.json'), JSON.stringify({ name: 'test-service' }));
      await writeFile(join(serviceDir, 'README.md'), '# Test Service');

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'has-package-json',
            type: 'file-exists',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services).toHaveLength(1);
      expect(report.services[0].serviceName).toBe('test-service');
      expect(report.services[0].results).toHaveLength(2);
      expect(report.services[0].passed).toBe(true);
      expect(report.services[0].score).toBe(100);
    });

    it('should calculate correct score when some rules fail', async () => {
      const serviceDir = join(testDir, 'incomplete-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(
        join(serviceDir, 'package.json'),
        JSON.stringify({ name: 'incomplete-service' })
      );
      // No README.md created

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'has-package-json',
            type: 'file-exists',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services[0].passed).toBe(false);
      expect(report.services[0].score).toBe(50); // 1 out of 2 rules passed
      expect(report.services[0].results[0].passed).toBe(false); // README missing
      expect(report.services[0].results[1].passed).toBe(true); // package.json exists
    });

    it('should audit multiple services', async () => {
      // Create two services
      const service1Dir = join(testDir, 'service-1');
      const service2Dir = join(testDir, 'service-2');

      await mkdir(service1Dir, { recursive: true });
      await mkdir(service2Dir, { recursive: true });

      await writeFile(join(service1Dir, 'package.json'), JSON.stringify({ name: 'service-1' }));
      await writeFile(join(service1Dir, 'README.md'), '# Service 1');

      await writeFile(join(service2Dir, 'package.json'), JSON.stringify({ name: 'service-2' }));
      await writeFile(join(service2Dir, 'README.md'), '# Service 2');

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services).toHaveLength(2);
      expect(report.summary.totalServices).toBe(2);
      expect(report.summary.passedServices).toBe(2);
      expect(report.summary.failedServices).toBe(0);
    });
  });

  describe('Report Summary Generation', () => {
    it('should generate correct summary statistics', async () => {
      // Create 3 services: 2 passing, 1 failing
      const service1Dir = join(testDir, 'service-1');
      const service2Dir = join(testDir, 'service-2');
      const service3Dir = join(testDir, 'service-3');

      await mkdir(service1Dir, { recursive: true });
      await mkdir(service2Dir, { recursive: true });
      await mkdir(service3Dir, { recursive: true });

      await writeFile(join(service1Dir, 'package.json'), JSON.stringify({ name: 'service-1' }));
      await writeFile(join(service1Dir, 'README.md'), '# Service 1');

      await writeFile(join(service2Dir, 'package.json'), JSON.stringify({ name: 'service-2' }));
      await writeFile(join(service2Dir, 'README.md'), '# Service 2');

      await writeFile(join(service3Dir, 'package.json'), JSON.stringify({ name: 'service-3' }));
      // service-3 has no README

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.summary.totalServices).toBe(3);
      expect(report.summary.passedServices).toBe(2);
      expect(report.summary.failedServices).toBe(1);
      expect(report.summary.passRate).toBeCloseTo(66.67, 1);
    });

    it('should include timestamp in report', async () => {
      const serviceDir = join(testDir, 'test-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(join(serviceDir, 'package.json'), JSON.stringify({ name: 'test-service' }));

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-package-json',
            type: 'file-exists',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const beforeTime = new Date();
      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);
      const afterTime = new Date();

      expect(report.timestamp).toBeDefined();
      const reportTime = new Date(report.timestamp);
      expect(reportTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(reportTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Parallel Execution', () => {
    it('should execute rules in parallel when configured', async () => {
      const serviceDir = join(testDir, 'test-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(join(serviceDir, 'package.json'), JSON.stringify({ name: 'test-service' }));
      await writeFile(join(serviceDir, 'README.md'), '# Test');

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'has-package',
            type: 'file-exists',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: true,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services[0].results).toHaveLength(2);
      expect(report.services[0].results.every((r: RuleResult) => r.passed)).toBe(true);
    });

    it('should process multiple services in parallel when configured', async () => {
      // Create multiple services
      const service1Dir = join(testDir, 'service-1');
      const service2Dir = join(testDir, 'service-2');
      const service3Dir = join(testDir, 'service-3');

      await mkdir(service1Dir, { recursive: true });
      await mkdir(service2Dir, { recursive: true });
      await mkdir(service3Dir, { recursive: true });

      await writeFile(join(service1Dir, 'package.json'), JSON.stringify({ name: 'service-1' }));
      await writeFile(join(service1Dir, 'README.md'), '# Service 1');

      await writeFile(join(service2Dir, 'package.json'), JSON.stringify({ name: 'service-2' }));
      await writeFile(join(service2Dir, 'README.md'), '# Service 2');

      await writeFile(join(service3Dir, 'package.json'), JSON.stringify({ name: 'service-3' }));
      await writeFile(join(service3Dir, 'README.md'), '# Service 3');

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
        ],
        parallel: true,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const startTime = Date.now();
      const report = await auditor.audit(testDir);
      const duration = Date.now() - startTime;

      expect(report.services).toHaveLength(3);
      expect(report.summary.passedServices).toBe(3);
      // Parallel execution should be reasonably fast
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty directory with no services', async () => {
      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services).toHaveLength(0);
      expect(report.summary.totalServices).toBe(0);
      expect(report.summary.passedServices).toBe(0);
      expect(report.summary.failedServices).toBe(0);
    });

    it('should handle service with all rules passing', async () => {
      const serviceDir = join(testDir, 'perfect-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(
        join(serviceDir, 'package.json'),
        JSON.stringify({ name: 'perfect-service', version: '1.0.0' })
      );
      await writeFile(join(serviceDir, 'README.md'), '# Perfect Service');

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'valid-semver',
            type: 'semver',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services[0].passed).toBe(true);
      expect(report.services[0].score).toBe(100);
    });

    it('should handle service with all rules failing', async () => {
      const serviceDir = join(testDir, 'failing-service');
      await mkdir(serviceDir, { recursive: true });
      await writeFile(
        join(serviceDir, 'package.json'),
        JSON.stringify({ name: 'failing-service', version: 'invalid' })
      );
      // No README

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'valid-semver',
            type: 'semver',
            target: 'package.json',
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services[0].passed).toBe(false);
      expect(report.services[0].score).toBe(0);
    });
  });

  describe('Integration with Different Rule Types', () => {
    it('should integrate file-exists, semver, and coverage rules', async () => {
      const serviceDir = join(testDir, 'full-service');
      const coverageDir = join(serviceDir, 'coverage');

      await mkdir(coverageDir, { recursive: true });
      await writeFile(
        join(serviceDir, 'package.json'),
        JSON.stringify({ name: 'full-service', version: '2.1.0' })
      );
      await writeFile(join(serviceDir, 'README.md'), '# Full Service');

      const coverageSummary = {
        total: {
          lines: { pct: 85 },
          statements: { pct: 85 },
          functions: { pct: 85 },
          branches: { pct: 85 },
        },
      };
      await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

      const config: AuditorConfig = {
        rules: [
          {
            name: 'has-readme',
            type: 'file-exists',
            target: 'README.md',
            required: true,
          },
          {
            name: 'valid-semver',
            type: 'semver',
            target: 'package.json',
            required: true,
          },
          {
            name: 'min-coverage',
            type: 'coverage',
            threshold: 80,
            required: true,
          },
        ],
        parallel: false,
        failFast: false,
      };

      const auditor = new Auditor(config);
      const report = await auditor.audit(testDir);

      expect(report.services[0].results).toHaveLength(3);
      expect(report.services[0].results.every((r: RuleResult) => r.passed)).toBe(true);
      expect(report.services[0].score).toBe(100);
    });
  });
});
