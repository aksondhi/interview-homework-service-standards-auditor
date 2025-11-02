import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CoverageRule } from '../../src/rules/implementations/coverage-rule.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Service } from '../../src/types/service.js';

describe('CoverageRule', () => {
  let testDir: string;
  let testService: Service;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-coverage-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    testService = {
      name: 'test-service',
      path: testDir,
      type: 'node',
    };
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should pass when coverage meets threshold', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 85 },
        statements: { pct: 85 },
        functions: { pct: 85 },
        branches: { pct: 85 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('85');
    expect(result.message).toContain('meets threshold');
  });

  it('should fail when coverage below threshold', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 60 },
        statements: { pct: 60 },
        functions: { pct: 60 },
        branches: { pct: 60 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('below threshold');
    expect(result.message).toContain('60');
  });

  it('should fail when coverage file missing', async () => {
    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should provide detailed coverage breakdown', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 90 },
        statements: { pct: 88 },
        functions: { pct: 85 },
        branches: { pct: 82 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.details).toBeDefined();
    expect(result.details?.coverage).toBeDefined();
    const coverage = result.details?.coverage as Record<string, number>;
    expect(coverage.lines).toBe(90);
    expect(coverage.statements).toBe(88);
    expect(coverage.functions).toBe(85);
    expect(coverage.branches).toBe(82);
  });

  it('should calculate average coverage correctly', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 100 },
        statements: { pct: 80 },
        functions: { pct: 90 },
        branches: { pct: 70 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 85,
      required: true,
    });

    const result = await rule.evaluate(testService);

    // Average should be (100 + 80 + 90 + 70) / 4 = 85
    expect(result.passed).toBe(true);
    const coverage = result.details?.coverage as Record<string, number>;
    expect(coverage.average).toBe(85);
  });

  it('should handle malformed coverage JSON', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    await writeFile(join(coverageDir, 'coverage-summary.json'), 'invalid json {');

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('not found or invalid');
  });

  it('should work with different threshold values', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 75 },
        statements: { pct: 75 },
        functions: { pct: 75 },
        branches: { pct: 75 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    // Should pass with 70% threshold
    const rule70 = new CoverageRule({
      name: 'min-coverage-70',
      type: 'coverage',
      threshold: 70,
      required: true,
    });

    const result70 = await rule70.evaluate(testService);
    expect(result70.passed).toBe(true);

    // Should fail with 80% threshold
    const rule80 = new CoverageRule({
      name: 'min-coverage-80',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result80 = await rule80.evaluate(testService);
    expect(result80.passed).toBe(false);
  });

  it('should include threshold in result details', async () => {
    const coverageDir = join(testDir, 'coverage');
    await mkdir(coverageDir, { recursive: true });

    const coverageSummary = {
      total: {
        lines: { pct: 85 },
        statements: { pct: 85 },
        functions: { pct: 85 },
        branches: { pct: 85 },
      },
    };

    await writeFile(join(coverageDir, 'coverage-summary.json'), JSON.stringify(coverageSummary));

    const rule = new CoverageRule({
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.details?.threshold).toBe(80);
  });
});
