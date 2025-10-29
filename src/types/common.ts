export type OutputFormat = 'json' | 'md' | 'both' | 'html';

export interface CLIOptions {
  path: string;
  config: string;
  output: OutputFormat;
  outdir: string;
}
