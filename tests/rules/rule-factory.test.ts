import { describe, it, expect } from '@jest/globals';
import { RuleFactory } from '../../src/rules/rule-factory.js';
import { FileExistsRule } from '../../src/rules/implementations/file-exists-rule.js';
import { SemverRule } from '../../src/rules/implementations/semver-rule.js';
import { CoverageRule } from '../../src/rules/implementations/coverage-rule.js';
import type { RuleConfig } from '../../src/types/config.js';

describe('RuleFactory', () => {
  it('should create FileExistsRule from config', () => {
    const config: RuleConfig = {
      name: 'has-readme',
      type: 'file-exists',
      target: 'README.md',
      required: true,
    };

    const rule = RuleFactory.createRule(config);

    expect(rule).toBeInstanceOf(FileExistsRule);
    expect(rule.getName()).toBe('has-readme');
    expect(rule.isRequired()).toBe(true);
  });

  it('should create SemverRule from config', () => {
    const config: RuleConfig = {
      name: 'valid-semver',
      type: 'semver',
      target: 'package.json',
      required: true,
    };

    const rule = RuleFactory.createRule(config);

    expect(rule).toBeInstanceOf(SemverRule);
    expect(rule.getName()).toBe('valid-semver');
  });

  it('should create CoverageRule from config', () => {
    const config: RuleConfig = {
      name: 'min-coverage',
      type: 'coverage',
      threshold: 80,
      required: true,
    };

    const rule = RuleFactory.createRule(config);

    expect(rule).toBeInstanceOf(CoverageRule);
    expect(rule.getName()).toBe('min-coverage');
  });

  it('should throw error for unsupported rule type', () => {
    const config = {
      name: 'unknown-rule',
      type: 'unsupported',
      required: true,
    } as unknown as RuleConfig;

    expect(() => RuleFactory.createRule(config)).toThrow('Unsupported rule type');
  });

  it('should create multiple rules from configs', () => {
    const configs: RuleConfig[] = [
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
    ];

    const rules = RuleFactory.createRules(configs);

    expect(rules).toHaveLength(3);
    expect(rules[0]).toBeInstanceOf(FileExistsRule);
    expect(rules[1]).toBeInstanceOf(SemverRule);
    expect(rules[2]).toBeInstanceOf(CoverageRule);
  });

  it('should handle empty config array', () => {
    const rules = RuleFactory.createRules([]);

    expect(rules).toHaveLength(0);
  });

  it('should preserve rule order from config', () => {
    const configs: RuleConfig[] = [
      {
        name: 'rule-1',
        type: 'semver',
        target: 'package.json',
        required: true,
      },
      {
        name: 'rule-2',
        type: 'file-exists',
        target: 'test',
        required: true,
      },
    ];

    const rules = RuleFactory.createRules(configs);

    expect(rules[0].getName()).toBe('rule-1');
    expect(rules[1].getName()).toBe('rule-2');
  });
});
