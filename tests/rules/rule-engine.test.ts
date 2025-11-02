import { describe, it, expect } from '@jest/globals';
import { RuleEngine } from '../../src/rules/rule-engine.js';
import { BaseRule } from '../../src/rules/base-rule.js';
import type { RuleResult } from '../../src/types/result.js';
import type { Service } from '../../src/types/service.js';
import type { RuleConfig } from '../../src/types/config.js';

class MockPassingRule extends BaseRule {
  async evaluate(service: Service): Promise<RuleResult> {
    return {
      ruleName: this.config.name,
      passed: true,
      message: `Mock rule passed for ${service.name}`,
    };
  }
}

class MockFailingRule extends BaseRule {
  async evaluate(_service: Service): Promise<RuleResult> {
    return {
      ruleName: this.config.name,
      passed: false,
      message: 'Mock rule failed',
    };
  }
}

class MockErrorRule extends BaseRule {
  async evaluate(_service: Service): Promise<RuleResult> {
    throw new Error('Intentional error');
  }
}

describe('RuleEngine', () => {
  const testService: Service = {
    name: 'test-service',
    path: '/test/path',
    type: 'node',
  };

  const mockConfig: RuleConfig = {
    name: 'mock-rule',
    type: 'custom',
    script: 'mock.sh',
    required: true,
  };

  it('should execute a single rule for a service', async () => {
    const engine = new RuleEngine();
    const mockRule = new MockPassingRule(mockConfig);

    engine.registerRule(mockRule);

    const results = await engine.executeRules(testService);

    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].ruleName).toBe('mock-rule');
  });

  it('should execute multiple rules', async () => {
    const engine = new RuleEngine();
    engine.registerRule(
      new MockPassingRule({ name: 'rule-1', type: 'custom', script: 'test', required: true })
    );
    engine.registerRule(
      new MockPassingRule({ name: 'rule-2', type: 'custom', script: 'test', required: true })
    );

    const results = await engine.executeRules(testService);

    expect(results).toHaveLength(2);
    expect(results[0].ruleName).toBe('rule-1');
    expect(results[1].ruleName).toBe('rule-2');
  });

  it('should handle rule failures gracefully', async () => {
    const engine = new RuleEngine();
    engine.registerRule(
      new MockPassingRule({ name: 'passing', type: 'custom', script: 'test', required: true })
    );
    engine.registerRule(
      new MockFailingRule({ name: 'failing', type: 'custom', script: 'test', required: true })
    );

    const results = await engine.executeRules(testService);

    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it('should handle rule execution errors', async () => {
    const engine = new RuleEngine();
    engine.registerRule(
      new MockErrorRule({ name: 'error-rule', type: 'custom', script: 'test', required: true })
    );

    const results = await engine.executeRules(testService);

    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('Rule execution failed');
  });

  it('should execute rules in parallel', async () => {
    const engine = new RuleEngine();
    engine.registerRule(
      new MockPassingRule({ name: 'rule-1', type: 'custom', script: 'test', required: true })
    );
    engine.registerRule(
      new MockPassingRule({ name: 'rule-2', type: 'custom', script: 'test', required: true })
    );

    const results = await engine.executeRulesParallel(testService);

    expect(results).toHaveLength(2);
    expect(results.every((r: RuleResult) => r.passed)).toBe(true);
  });

  it('should handle errors in parallel execution', async () => {
    const engine = new RuleEngine();
    engine.registerRule(
      new MockPassingRule({ name: 'passing', type: 'custom', script: 'test', required: true })
    );
    engine.registerRule(
      new MockErrorRule({ name: 'error', type: 'custom', script: 'test', required: true })
    );

    const results = await engine.executeRulesParallel(testService);

    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it('should return empty array when no rules registered', async () => {
    const engine = new RuleEngine();
    const results = await engine.executeRules(testService);

    expect(results).toHaveLength(0);
  });
});

describe('BaseRule', () => {
  it('should expose rule name', () => {
    const config: RuleConfig = {
      name: 'test-rule',
      type: 'custom',
      script: 'test.sh',
      required: true,
    };
    const rule = new MockPassingRule(config);

    expect(rule.getName()).toBe('test-rule');
  });

  it('should expose required flag', () => {
    const requiredConfig: RuleConfig = {
      name: 'required-rule',
      type: 'custom',
      script: 'test.sh',
      required: true,
    };
    const optionalConfig: RuleConfig = {
      name: 'optional-rule',
      type: 'custom',
      script: 'test.sh',
      required: false,
    };

    const requiredRule = new MockPassingRule(requiredConfig);
    const optionalRule = new MockPassingRule(optionalConfig);

    expect(requiredRule.isRequired()).toBe(true);
    expect(optionalRule.isRequired()).toBe(false);
  });
});
