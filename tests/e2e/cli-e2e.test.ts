import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Set longer timeout for E2E tests
jest.setTimeout(40000);

/**
 * End-to-End CLI tests
 *
 * These tests spawn the actual CLI process and verify complete workflows
 * from command-line invocation through report generation.
 */
describe('CLI E2E Tests', () => {
  let testDir: string;
  let servicesDir: string;
  let configPath: string;
  let reportDir: string;

  beforeAll(async () => {
    // Create temporary test environment
    testDir = path.join(os.tmpdir(), `ssa-e2e-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    servicesDir = path.join(testDir, 'services');
    reportDir = path.join(testDir, 'reports');
    await fs.mkdir(servicesDir, { recursive: true });
    await fs.mkdir(reportDir, { recursive: true });

    // Create multiple test services with different compliance levels
    await createCompliantService();
    await createNonCompliantService();
    await createPartiallyCompliantService();

    // Create comprehensive config
    await createTestConfig();
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  /**
   * Create a fully compliant service
   */
  async function createCompliantService(): Promise<void> {
    const servicePath = path.join(servicesDir, 'compliant-service');
    await fs.mkdir(servicePath, { recursive: true });

    // package.json with valid semver
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      JSON.stringify(
        {
          name: 'compliant-service',
          version: '1.2.3',
          description: 'A fully compliant service',
        },
        null,
        2
      )
    );

    // README.md
    await fs.writeFile(
      path.join(servicePath, 'README.md'),
      '# Compliant Service\n\nThis service meets all standards.'
    );

    // Dockerfile
    await fs.writeFile(
      path.join(servicePath, 'Dockerfile'),
      'FROM node:20\nWORKDIR /app\nCOPY . .\nCMD ["node", "index.js"]'
    );

    // Coverage file
    const coveragePath = path.join(servicePath, 'coverage');
    await fs.mkdir(coveragePath, { recursive: true });
    await fs.writeFile(
      path.join(coveragePath, 'coverage-summary.json'),
      JSON.stringify(
        {
          total: {
            lines: { pct: 95 },
            statements: { pct: 94 },
            functions: { pct: 96 },
            branches: { pct: 92 },
          },
        },
        null,
        2
      )
    );
  }

  /**
   * Create a non-compliant service (missing required files)
   */
  async function createNonCompliantService(): Promise<void> {
    const servicePath = path.join(servicesDir, 'non-compliant-service');
    await fs.mkdir(servicePath, { recursive: true });

    // Only package.json with invalid semver
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      JSON.stringify(
        {
          name: 'non-compliant-service',
          version: 'not-a-version',
        },
        null,
        2
      )
    );
    // Missing: README.md, Dockerfile, coverage
  }

  /**
   * Create a partially compliant service
   */
  async function createPartiallyCompliantService(): Promise<void> {
    const servicePath = path.join(servicesDir, 'partial-service');
    await fs.mkdir(servicePath, { recursive: true });

    // Valid package.json
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      JSON.stringify(
        {
          name: 'partial-service',
          version: '0.1.0',
        },
        null,
        2
      )
    );

    // Has README
    await fs.writeFile(path.join(servicePath, 'README.md'), '# Partial Service');

    // Missing: Dockerfile, coverage below threshold
    const coveragePath = path.join(servicePath, 'coverage');
    await fs.mkdir(coveragePath, { recursive: true });
    await fs.writeFile(
      path.join(coveragePath, 'coverage-summary.json'),
      JSON.stringify(
        {
          total: {
            lines: { pct: 45 },
            statements: { pct: 42 },
            functions: { pct: 50 },
            branches: { pct: 40 },
          },
        },
        null,
        2
      )
    );
  }

  /**
   * Create test configuration file
   */
  async function createTestConfig(): Promise<void> {
    configPath = path.join(testDir, 'test-config.yml');
    const configContent = `
version: '1.0'
parallel: true
failFast: false

rules:
  - type: file-exists
    name: readme-required
    target: README.md
    required: true
    
  - type: file-exists
    name: dockerfile-required
    target: Dockerfile
    required: true
    
  - type: semver
    name: valid-version
    required: true
    
  - type: coverage
    name: test-coverage
    threshold: 80
    required: false
`;
    await fs.writeFile(configPath, configContent);
  }

  /**
   * Helper to run CLI command
   */
  function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const cliPath = path.join(process.cwd(), 'dist', 'cli.js');
      const child = spawn('node', [cliPath, ...args], {
        env: { ...process.env, CI: 'true' }, // Disable progress indicators in tests
        detached: false,
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!resolved) {
          resolved = true;
          // Clean up explicitly
          child.stdout.removeAllListeners();
          child.stderr.removeAllListeners();
          child.removeAllListeners();
          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0,
          });
        }
      });

      child.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          child.kill();
          reject(error);
        }
      });

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 1000);
          reject(new Error('CLI command timed out'));
        }
      }, 30000);

      // Clear timeout on close
      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  describe('Complete Audit Workflow', () => {
    it('should successfully audit services and generate JSON report', async () => {
      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Audit complete');

      // Verify report file was created
      const reportPath = path.join(reportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('services');
      expect(report.services.length).toBe(3);
      expect(report.summary.totalServices).toBe(3);
    });

    it('should generate Markdown report', async () => {
      const mdReportDir = path.join(testDir, 'reports-md');
      await fs.mkdir(mdReportDir, { recursive: true });

      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'md',
        '--outdir',
        mdReportDir,
      ]);

      expect(result.exitCode).toBe(0);

      const reportPath = path.join(mdReportDir, 'audit-report.md');
      const reportContent = await fs.readFile(reportPath, 'utf8');

      expect(reportContent).toContain('# Service Standards Audit Report');
      expect(reportContent).toContain('compliant-service');
      expect(reportContent).toContain('non-compliant-service');
      expect(reportContent).toContain('partial-service');
    });

    it('should generate HTML report', async () => {
      const htmlReportDir = path.join(testDir, 'reports-html');
      await fs.mkdir(htmlReportDir, { recursive: true });

      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'html',
        '--outdir',
        htmlReportDir,
      ]);

      if (result.exitCode !== 0) {
        console.log('STDOUT:', result.stdout);
        console.log('STDERR:', result.stderr);
      }
      expect(result.exitCode).toBe(0);

      const reportPath = path.join(htmlReportDir, 'audit-report.html');
      const reportContent = await fs.readFile(reportPath, 'utf8');

      expect(reportContent).toContain('Service Standards Audit Report');
      expect(reportContent).toContain('chart.js');
      expect(reportContent).toContain('compliant-service');
    });

    it('should generate both JSON and Markdown reports', async () => {
      const bothReportDir = path.join(testDir, 'reports-both');
      await fs.mkdir(bothReportDir, { recursive: true });

      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'both',
        '--outdir',
        bothReportDir,
      ]);

      expect(result.exitCode).toBe(0);

      // Check both files exist
      const jsonPath = path.join(bothReportDir, 'audit-report.json');
      const mdPath = path.join(bothReportDir, 'audit-report.md');

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
    it('should fail with non-existent path', async () => {
      const result = await runCLI([
        '--path',
        '/nonexistent/path',
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr || result.stdout).toContain('Error');
    });

    it('should fail with non-existent config', async () => {
      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        '/nonexistent/config.yml',
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr || result.stdout).toContain('Error');
    });

    it('should fail with invalid output format', async () => {
      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'invalid',
        '--outdir',
        reportDir,
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr || result.stdout).toContain('Invalid output format');
    });

    it('should handle missing required arguments', async () => {
      const result = await runCLI(['--path', servicesDir]);

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Service Detection and Validation', () => {
    it('should correctly identify compliant service', async () => {
      await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      const reportPath = path.join(reportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      const compliantService = report.services.find(
        (s: { serviceName: string }) => s.serviceName === 'compliant-service'
      );

      expect(compliantService).toBeDefined();
      expect(compliantService.passed).toBe(true);
      expect(compliantService.score).toBeGreaterThanOrEqual(75);
    });

    it('should correctly identify non-compliant service', async () => {
      await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      const reportPath = path.join(reportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      const nonCompliantService = report.services.find(
        (s: { serviceName: string }) => s.serviceName === 'non-compliant-service'
      );

      expect(nonCompliantService).toBeDefined();
      expect(nonCompliantService.passed).toBe(false);
    });

    it('should validate all rule types', async () => {
      await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        reportDir,
      ]);

      const reportPath = path.join(reportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      const service = report.services[0];
      const ruleTypes = service.results.map((r: { ruleName: string }) => r.ruleName);

      expect(ruleTypes).toContain('readme-required');
      expect(ruleTypes).toContain('dockerfile-required');
      expect(ruleTypes).toContain('valid-version');
      expect(ruleTypes).toContain('test-coverage');
    });
  });

  describe('Single Service Audit', () => {
    it('should audit a single service directory', async () => {
      const singleReportDir = path.join(testDir, 'reports-single');
      await fs.mkdir(singleReportDir, { recursive: true });

      const singleServicePath = path.join(servicesDir, 'compliant-service');

      const result = await runCLI([
        '--path',
        singleServicePath,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        singleReportDir,
      ]);

      expect(result.exitCode).toBe(0);

      const reportPath = path.join(singleReportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      expect(report.services.length).toBe(1);
      expect(report.services[0].serviceName).toBe('compliant-service');
    });
  });

  describe('Parallel Execution', () => {
    it('should process multiple services in parallel', async () => {
      const parallelReportDir = path.join(testDir, 'reports-parallel');
      await fs.mkdir(parallelReportDir, { recursive: true });

      const startTime = Date.now();

      const result = await runCLI([
        '--path',
        servicesDir,
        '--config',
        configPath,
        '--output',
        'json',
        '--outdir',
        parallelReportDir,
      ]);

      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);

      const reportPath = path.join(parallelReportDir, 'audit-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      expect(report.services.length).toBe(3);
      // Parallel execution should be reasonably fast
      expect(duration).toBeLessThan(20000);
    });
  });
});
