import { describe, it, expect } from '@jest/globals';
import { ReporterFactory } from '../../src/reporters/reporter-factory.js';
import { JSONReporter } from '../../src/reporters/json-reporter.js';
import { MarkdownReporter } from '../../src/reporters/markdown-reporter.js';
import { HTMLReporter } from '../../src/reporters/html-reporter.js';
import type { OutputFormat } from '../../src/types/common.js';

describe('ReporterFactory', () => {
  describe('createReporter', () => {
    it('should create JSONReporter for json format', () => {
      const reporter = ReporterFactory.createReporter('json');
      expect(reporter).toBeInstanceOf(JSONReporter);
    });

    it('should create MarkdownReporter for md format', () => {
      const reporter = ReporterFactory.createReporter('md');
      expect(reporter).toBeInstanceOf(MarkdownReporter);
    });

    it('should create HTMLReporter for html format', () => {
      const reporter = ReporterFactory.createReporter('html');
      expect(reporter).toBeInstanceOf(HTMLReporter);
    });

    it('should throw error for both format', () => {
      // 'both' should be handled by createReporters, not createReporter
      expect(() => ReporterFactory.createReporter('both' as OutputFormat)).toThrow(
        'Invalid format for single reporter'
      );
    });

    it('should throw error for invalid format', () => {
      expect(() => ReporterFactory.createReporter('invalid' as OutputFormat)).toThrow(
        'Unsupported output format'
      );
    });
  });

  describe('createReporters', () => {
    it('should create single reporter for json format', () => {
      const reporters = ReporterFactory.createReporters('json');
      expect(reporters).toHaveLength(1);
      expect(reporters[0]).toBeInstanceOf(JSONReporter);
    });

    it('should create single reporter for md format', () => {
      const reporters = ReporterFactory.createReporters('md');
      expect(reporters).toHaveLength(1);
      expect(reporters[0]).toBeInstanceOf(MarkdownReporter);
    });

    it('should create single reporter for html format', () => {
      const reporters = ReporterFactory.createReporters('html');
      expect(reporters).toHaveLength(1);
      expect(reporters[0]).toBeInstanceOf(HTMLReporter);
    });

    it('should create multiple reporters for both format', () => {
      const reporters = ReporterFactory.createReporters('both');
      expect(reporters).toHaveLength(2);
      expect(reporters[0]).toBeInstanceOf(JSONReporter);
      expect(reporters[1]).toBeInstanceOf(MarkdownReporter);
    });

    it('should throw error for invalid format', () => {
      expect(() => ReporterFactory.createReporters('invalid' as OutputFormat)).toThrow(
        'Unsupported output format'
      );
    });
  });

  describe('getExtensionForFormat', () => {
    it('should return .json for json format', () => {
      expect(ReporterFactory.getExtensionForFormat('json')).toBe('.json');
    });

    it('should return .md for md format', () => {
      expect(ReporterFactory.getExtensionForFormat('md')).toBe('.md');
    });

    it('should return .html for html format', () => {
      expect(ReporterFactory.getExtensionForFormat('html')).toBe('.html');
    });

    it('should throw error for both format', () => {
      expect(() => ReporterFactory.getExtensionForFormat('both')).toThrow(
        'Cannot get single extension for both format'
      );
    });

    it('should throw error for invalid format', () => {
      expect(() => ReporterFactory.getExtensionForFormat('invalid' as OutputFormat)).toThrow(
        'Unsupported output format'
      );
    });
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported formats', () => {
      const formats = ReporterFactory.getSupportedFormats();
      expect(formats).toContain('json');
      expect(formats).toContain('md');
      expect(formats).toContain('html');
      expect(formats).toContain('both');
      expect(formats).toHaveLength(4);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for json', () => {
      expect(ReporterFactory.isValidFormat('json')).toBe(true);
    });

    it('should return true for md', () => {
      expect(ReporterFactory.isValidFormat('md')).toBe(true);
    });

    it('should return true for html', () => {
      expect(ReporterFactory.isValidFormat('html')).toBe(true);
    });

    it('should return true for both', () => {
      expect(ReporterFactory.isValidFormat('both')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(ReporterFactory.isValidFormat('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(ReporterFactory.isValidFormat('')).toBe(false);
    });
  });
});
