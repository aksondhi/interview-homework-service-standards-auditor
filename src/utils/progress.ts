import ora, { Ora } from 'ora';
import cliProgress from 'cli-progress';

/**
 * Progress indicator types for long-running operations
 */
export type ProgressType = 'spinner' | 'bar' | 'none';

/**
 * Spinner for indeterminate operations (loading, initializing, etc.)
 */
export class Spinner {
  private spinner: Ora | null = null;
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled && process.stdout.isTTY;
  }

  /**
   * Start a spinner with a message
   */
  start(message: string): void {
    if (!this.enabled) {
      console.log(message);
      return;
    }

    this.spinner = ora({
      text: message,
      color: 'cyan',
    }).start();
  }

  /**
   * Update spinner message
   */
  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    } else if (!this.enabled) {
      console.log(message);
    }
  }

  /**
   * Stop spinner with success message
   */
  succeed(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    } else if (!this.enabled && message) {
      console.log(`✓ ${message}`);
    }
  }

  /**
   * Stop spinner with failure message
   */
  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    } else if (!this.enabled && message) {
      console.log(`✗ ${message}`);
    }
  }

  /**
   * Stop spinner with warning message
   */
  warn(message?: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    } else if (!this.enabled && message) {
      console.log(`⚠ ${message}`);
    }
  }

  /**
   * Stop spinner with info message
   */
  info(message?: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    } else if (!this.enabled && message) {
      console.log(`ℹ ${message}`);
    }
  }

  /**
   * Stop spinner without any message
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

/**
 * Progress bar for operations with known total count
 */
export class ProgressBar {
  private bar: cliProgress.SingleBar | null = null;
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled && process.stdout.isTTY;
  }

  /**
   * Start a progress bar with a total count
   */
  start(total: number, message: string): void {
    if (!this.enabled) {
      console.log(`${message} (0/${total})`);
      return;
    }

    this.bar = new cliProgress.SingleBar(
      {
        format: `${message} |{bar}| {percentage}% | {value}/{total} services`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );

    this.bar.start(total, 0);
  }

  /**
   * Update progress bar to a specific value
   */
  update(current: number): void {
    if (this.bar) {
      this.bar.update(current);
    }
  }

  /**
   * Increment progress bar by 1
   */
  increment(): void {
    if (this.bar) {
      this.bar.increment();
    }
  }

  /**
   * Stop and clear the progress bar
   */
  stop(): void {
    if (this.bar) {
      this.bar.stop();
      this.bar = null;
    }
  }
}

/**
 * Factory for creating progress indicators based on context
 */
export class ProgressFactory {
  /**
   * Create appropriate progress indicator based on whether total is known
   */
  static create(enabled = true): {
    spinner: Spinner;
    createBar: (total: number, message: string) => ProgressBar;
  } {
    const spinner = new Spinner(enabled);

    return {
      spinner,
      createBar: (total: number, message: string) => {
        const bar = new ProgressBar(enabled);
        bar.start(total, message);
        return bar;
      },
    };
  }

  /**
   * Check if progress indicators should be enabled
   * (disabled in non-TTY environments like CI/CD)
   */
  static shouldEnable(): boolean {
    return process.stdout.isTTY && process.env.CI !== 'true';
  }
}
