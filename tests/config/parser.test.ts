import { parseConfig } from '../../src/config/parser.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Config Parser', () => {
  const testConfigPath = join(process.cwd(), 'test-config.yml');

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  it('should parse valid YAML config', async () => {
    const validConfig = `
rules:
  - name: has-readme
    type: file-exists
    target: README.md
    required: true
`;
    writeFileSync(testConfigPath, validConfig);

    const config = await parseConfig(testConfigPath);
    expect(config.rules).toHaveLength(1);
    expect(config.rules[0].name).toBe('has-readme');
    expect(config.rules[0].type).toBe('file-exists');
  });

  it('should reject invalid config schema', async () => {
    const invalidConfig = `
rules:
  - name: 123
    type: invalid-type
`;
    writeFileSync(testConfigPath, invalidConfig);

    await expect(parseConfig(testConfigPath)).rejects.toThrow();
  });

  it('should apply default values', async () => {
    const configWithDefaults = `
rules:
  - name: has-tests
    type: file-exists
    target: tests/
`;
    writeFileSync(testConfigPath, configWithDefaults);

    const config = await parseConfig(testConfigPath);
    expect(config.rules[0].required).toBe(true); // default value
  });

  it('should parse file-exists rule', async () => {
    const config = `
rules:
  - name: has-dockerfile
    type: file-exists
    target: Dockerfile
    required: true
    description: Docker configuration required
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.rules[0].type).toBe('file-exists');
    expect(result.rules[0].description).toBe('Docker configuration required');
  });

  it('should parse coverage rule with threshold', async () => {
    const config = `
rules:
  - name: min-coverage
    type: coverage
    threshold: 80
    required: true
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.rules[0].type).toBe('coverage');
    expect((result.rules[0] as any).threshold).toBe(80);
  });

  it('should parse semver rule', async () => {
    const config = `
rules:
  - name: valid-version
    type: semver
    target: package.json
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.rules[0].type).toBe('semver');
  });

  it('should parse multiple rules', async () => {
    const config = `
rules:
  - name: has-readme
    type: file-exists
    target: README.md
  - name: min-coverage
    type: coverage
    threshold: 80
  - name: valid-version
    type: semver
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.rules).toHaveLength(3);
  });

  it('should fail when config file does not exist', async () => {
    await expect(parseConfig('/nonexistent/config.yml')).rejects.toThrow();
  });

  it('should fail when YAML is invalid', async () => {
    const invalidYaml = `
rules:
  - name: test
    type: file-exists
    invalid yaml structure {{[
`;
    writeFileSync(testConfigPath, invalidYaml);

    await expect(parseConfig(testConfigPath)).rejects.toThrow();
  });

  it('should parse parallel and failFast options', async () => {
    const config = `
parallel: true
failFast: false
rules:
  - name: test
    type: file-exists
    target: test.txt
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.parallel).toBe(true);
    expect(result.failFast).toBe(false);
  });

  it('should use default values for parallel and failFast', async () => {
    const config = `
rules:
  - name: test
    type: file-exists
    target: test.txt
`;
    writeFileSync(testConfigPath, config);

    const result = await parseConfig(testConfigPath);
    expect(result.parallel).toBe(false);
    expect(result.failFast).toBe(false);
  });
});
