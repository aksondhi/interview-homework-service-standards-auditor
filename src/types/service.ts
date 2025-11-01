/**
 * Represents a scanned service in the repository
 */
export interface Service {
  /** Service name (from package.json or directory name) */
  name: string;

  /** Absolute path to the service directory */
  path: string;

  /** Service type (node, python, docker, etc.) */
  type: string;

  /** Service version (if available) */
  version?: string;

  /** Service description */
  description?: string;
}

/**
 * Options for configuring the service scanner
 */
export interface ScannerOptions {
  /** Maximum directory depth to scan (default: unlimited) */
  maxDepth?: number;

  /** Patterns to exclude from scanning */
  exclude?: string[];
}
