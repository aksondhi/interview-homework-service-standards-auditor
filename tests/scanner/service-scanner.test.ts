import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ServiceScanner } from '../../src/scanner/service-scanner.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ServiceScanner', () => {
  let testDir: string;
  let scanner: ServiceScanner;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `ssa-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    scanner = new ServiceScanner();
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it('should detect a single service in root directory', async () => {
    // Create a service with package.json
    await writeFile(join(testDir, 'package.json'), '{"name": "test-service"}');

    const services = await scanner.scan(testDir);

    expect(services).toHaveLength(1);
    expect(services[0].name).toBe('test-service');
    expect(services[0].path).toBe(testDir);
  });

  it('should detect multiple services in subdirectories', async () => {
    // Create multiple services
    const service1Dir = join(testDir, 'service1');
    const service2Dir = join(testDir, 'service2');

    await mkdir(service1Dir, { recursive: true });
    await mkdir(service2Dir, { recursive: true });

    await writeFile(join(service1Dir, 'package.json'), '{"name": "service1"}');
    await writeFile(join(service2Dir, 'package.json'), '{"name": "service2"}');

    const services = await scanner.scan(testDir);

    expect(services).toHaveLength(2);
    expect(services.map((s) => s.name).sort()).toEqual(['service1', 'service2']);
  });

  it('should detect service type from package.json indicators', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'api-service',
        dependencies: { express: '^4.0.0' },
      })
    );

    const services = await scanner.scan(testDir);

    expect(services[0].type).toBe('node');
  });

  it('should handle directory without services', async () => {
    // Empty directory
    const services = await scanner.scan(testDir);

    expect(services).toHaveLength(0);
  });

  it('should ignore node_modules directories', async () => {
    // Create a package.json in node_modules (should be ignored)
    const nodeModulesDir = join(testDir, 'node_modules', 'some-package');
    await mkdir(nodeModulesDir, { recursive: true });
    await writeFile(join(nodeModulesDir, 'package.json'), '{"name": "some-package"}');

    // Create a legitimate service
    await writeFile(join(testDir, 'package.json'), '{"name": "my-service"}');

    const services = await scanner.scan(testDir);

    expect(services).toHaveLength(1);
    expect(services[0].name).toBe('my-service');
  });

  it('should ignore dist and build directories', async () => {
    // Create package.json in dist (should be ignored)
    const distDir = join(testDir, 'dist');
    await mkdir(distDir, { recursive: true });
    await writeFile(join(distDir, 'package.json'), '{"name": "dist-package"}');

    // Create legitimate service
    await writeFile(join(testDir, 'package.json'), '{"name": "real-service"}');

    const services = await scanner.scan(testDir);

    expect(services).toHaveLength(1);
    expect(services[0].name).toBe('real-service');
  });

  it('should extract service metadata from package.json', async () => {
    const packageJson = {
      name: 'my-api',
      version: '1.2.3',
      description: 'My API service',
    };

    await writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const services = await scanner.scan(testDir);

    expect(services[0].name).toBe('my-api');
    expect(services[0].version).toBe('1.2.3');
  });

  it('should handle invalid package.json gracefully', async () => {
    await writeFile(join(testDir, 'package.json'), 'invalid json {');

    const services = await scanner.scan(testDir);

    // Should still detect the service but with minimal info
    expect(services).toHaveLength(1);
    expect(services[0].name).toBe('unknown');
  });

  it('should handle non-existent directory', async () => {
    const nonExistentPath = join(testDir, 'does-not-exist');

    await expect(scanner.scan(nonExistentPath)).rejects.toThrow();
  });

  it('should respect maxDepth option', async () => {
    // Create nested services
    const level1Dir = join(testDir, 'level1');
    const level2Dir = join(level1Dir, 'level2');

    await mkdir(level2Dir, { recursive: true });
    await writeFile(join(testDir, 'package.json'), '{"name": "root"}');
    await writeFile(join(level1Dir, 'package.json'), '{"name": "level1"}');
    await writeFile(join(level2Dir, 'package.json'), '{"name": "level2"}');

    // maxDepth: 1 means go 1 level deep from cwd (finds level1 but not level2)
    const scannerWithDepth = new ServiceScanner({ maxDepth: 2 });
    const services = await scannerWithDepth.scan(testDir);

    // Should find root and level1, but not level2
    expect(services).toHaveLength(2);
    expect(services.map((s) => s.name).sort()).toEqual(['level1', 'root']);
  });
});
