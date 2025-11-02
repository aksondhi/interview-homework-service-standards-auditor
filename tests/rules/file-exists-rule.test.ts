import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileExistsRule } from '../../src/rules/implementations/file-exists-rule.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Service } from '../../src/types/service.js';

describe('FileExistsRule', () => {
  let testDir: string;
  let testService: Service;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ssa-file-test-${Date.now()}`);
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

  it('should pass when file exists', async () => {
    await writeFile(join(testDir, 'README.md'), '# Test');

    const rule = new FileExistsRule({
      name: 'has-readme',
      type: 'file-exists',
      target: 'README.md',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('README.md exists');
  });

  it('should fail when file does not exist', async () => {
    const rule = new FileExistsRule({
      name: 'has-readme',
      type: 'file-exists',
      target: 'README.md',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('README.md not found');
  });

  it('should handle directory targets', async () => {
    await mkdir(join(testDir, 'tests'), { recursive: true });

    const rule = new FileExistsRule({
      name: 'has-tests',
      type: 'file-exists',
      target: 'tests',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('tests exists');
    expect(result.message).toContain('directory');
  });

  it('should handle glob patterns for test files', async () => {
    await mkdir(join(testDir, 'test'), { recursive: true });
    await writeFile(join(testDir, 'test', 'sample.test.ts'), 'test');

    const rule = new FileExistsRule({
      name: 'has-tests',
      type: 'file-exists',
      target: '{test,tests}/**/*.test.ts',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('matching pattern');
  });

  it('should fail when no files match glob pattern', async () => {
    const rule = new FileExistsRule({
      name: 'has-tests',
      type: 'file-exists',
      target: '**/*.test.ts',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('No files found matching pattern');
  });

  it('should provide details about matched files', async () => {
    await mkdir(join(testDir, 'src'), { recursive: true });
    await writeFile(join(testDir, 'src', 'index.ts'), 'code');
    await writeFile(join(testDir, 'src', 'utils.ts'), 'code');

    const rule = new FileExistsRule({
      name: 'has-source',
      type: 'file-exists',
      target: 'src/**/*.ts',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.details).toBeDefined();
    expect(result.details?.matches).toBeDefined();
  });

  it('should check for Dockerfile', async () => {
    await writeFile(join(testDir, 'Dockerfile'), 'FROM node:20');

    const rule = new FileExistsRule({
      name: 'has-dockerfile',
      type: 'file-exists',
      target: 'Dockerfile',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
  });

  it('should check for package.json', async () => {
    await writeFile(join(testDir, 'package.json'), '{"name": "test"}');

    const rule = new FileExistsRule({
      name: 'has-package-json',
      type: 'file-exists',
      target: 'package.json',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('package.json exists');
  });

  it('should include rule name in result', async () => {
    const rule = new FileExistsRule({
      name: 'custom-rule-name',
      type: 'file-exists',
      target: 'README.md',
      required: true,
    });

    const result = await rule.evaluate(testService);

    expect(result.ruleName).toBe('custom-rule-name');
  });
});
