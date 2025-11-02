import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SemverRule } from '../../src/rules/implementations/semver-rule.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Service } from '../../src/types/service.js';

describe('SemverRule', () => {
  let testDir: string;
  let testService: Service;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-semver-test-${Date.now()}`);
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

  it('should pass with valid semver', async () => {
    const pkg = { name: 'test', version: '1.0.0' };
    await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('1.0.0');
  });

  it('should fail with invalid semver', async () => {
    const pkg = { name: 'test', version: 'invalid' };
    await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('Invalid');
  });

  it('should fail when package.json missing', async () => {
    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
  });

  it('should fail when version field missing', async () => {
    const pkg = { name: 'test' };
    await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('version field not found');
  });

  it('should validate complex semver versions', async () => {
    const versions = ['1.0.0', '0.1.0', '2.3.4', '1.0.0-alpha', '1.0.0-beta.1', '1.0.0+build.123'];

    for (const version of versions) {
      const pkg = { name: 'test', version };
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

      const rule = new SemverRule({
        name: 'valid-semver',
        type: 'semver',
        required: true,
      });

      const result = await rule.evaluate(testService);
      expect(result.passed).toBe(true);
    }
  });

  it('should reject invalid semver formats', async () => {
    const invalidVersions = ['1', '1.0', 'latest', '1.0.0.0', 'not-a-version'];

    for (const version of invalidVersions) {
      const pkg = { name: 'test', version };
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

      const rule = new SemverRule({
        name: 'valid-semver',
        type: 'semver',
        required: true,
      });

      const result = await rule.evaluate(testService);
      expect(result.passed).toBe(false);
    }
  });

  it('should provide version details in result', async () => {
    const pkg = { name: 'test', version: '2.3.4' };
    await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg));

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.details).toBeDefined();
    expect(result.details?.major).toBe(2);
    expect(result.details?.minor).toBe(3);
    expect(result.details?.patch).toBe(4);
  });

  it('should support custom target file', async () => {
    const pkg = { name: 'test', version: '1.0.0' };
    await writeFile(join(testDir, 'custom.json'), JSON.stringify(pkg));

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      target: 'custom.json',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
  });

  it('should handle malformed JSON', async () => {
    await writeFile(join(testDir, 'package.json'), 'invalid json {');

    const rule = new SemverRule({
      name: 'valid-semver',
      type: 'semver',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('Failed to read or parse');
  });
});
