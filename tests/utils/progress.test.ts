import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Spinner, ProgressBar, ProgressFactory } from '../../src/utils/progress.js';

// Mock process.stdout.isTTY
const originalIsTTY = process.stdout.isTTY;
const originalCI = process.env.CI;

describe('Spinner', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('TTY environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });

    it('should create spinner when enabled', () => {
      const spinner = new Spinner(true);
      expect(spinner).toBeDefined();
    });

    it('should start spinner with message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should update spinner message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.update('Still loading...');
      spinner.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should succeed spinner', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.succeed('Done!');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should fail spinner', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.fail('Failed!');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should warn spinner', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.warn('Warning!');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should info spinner', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.info('Info!');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should stop spinner', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      spinner.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('non-TTY environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });

    it('should fallback to console.log when disabled', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Loading...');
    });

    it('should print succeed message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      consoleLogSpy.mockClear();
      spinner.succeed('Done!');
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Done!');
    });

    it('should print fail message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      consoleLogSpy.mockClear();
      spinner.fail('Failed!');
      expect(consoleLogSpy).toHaveBeenCalledWith('✗ Failed!');
    });

    it('should print warn message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      consoleLogSpy.mockClear();
      spinner.warn('Warning!');
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠ Warning!');
    });

    it('should print info message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      consoleLogSpy.mockClear();
      spinner.info('Info!');
      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ Info!');
    });

    it('should not print anything when stopped without message', () => {
      const spinner = new Spinner(true);
      spinner.start('Loading...');
      consoleLogSpy.mockClear();
      spinner.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('disabled spinner', () => {
    it('should use console.log when explicitly disabled', () => {
      const spinner = new Spinner(false);
      spinner.start('Loading...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Loading...');
    });
  });
});

describe('ProgressBar', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('TTY environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });

    it('should create progress bar', () => {
      const bar = new ProgressBar(true);
      expect(bar).toBeDefined();
    });

    it('should start progress bar', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      bar.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should update progress bar', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      bar.update(5);
      bar.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should increment progress bar', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      bar.increment();
      bar.increment();
      bar.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should stop progress bar', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      bar.stop();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('non-TTY environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });

    it('should fallback to console.log when disabled', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing (0/10)');
    });

    it('should not print updates in non-TTY', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Processing');
      consoleLogSpy.mockClear();
      bar.update(5);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('disabled progress bar', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });

    it('should use console.log when explicitly disabled', () => {
      const bar = new ProgressBar(false);
      bar.start(10, 'Processing');
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing (0/10)');
    });
  });
});

describe('ProgressFactory', () => {
  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
    process.env.CI = originalCI;
  });

  it('should create progress indicators', () => {
    const { spinner, createBar } = ProgressFactory.create(true);
    expect(spinner).toBeDefined();
    expect(createBar).toBeDefined();
  });

  it('should create bar with factory', () => {
    const { createBar } = ProgressFactory.create(true);
    const bar = createBar(10, 'Test');
    expect(bar).toBeDefined();
    bar.stop();
  });

  it('should detect TTY environment', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    process.env.CI = 'false';
    expect(ProgressFactory.shouldEnable()).toBe(true);
  });

  it('should detect non-TTY environment', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(ProgressFactory.shouldEnable()).toBe(false);
  });

  it('should detect CI environment', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    process.env.CI = 'true';
    expect(ProgressFactory.shouldEnable()).toBe(false);
  });
});
