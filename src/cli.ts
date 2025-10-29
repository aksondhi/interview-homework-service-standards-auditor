#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .description('Service Standards Auditor')
  .option('--path <path>', 'Path to services root or a single service', process.cwd())
  .option('--config <path>', 'YAML rules config', 'rules.yml')
  .option('--output <fmt>', 'Report format: json|md|both', 'json')
  .option('--outdir <dir>', 'Directory to write reports', 'reports');

program.parse(process.argv);
const opts = program.opts();

async function main() {
  console.log(`Placeholder for Service Standards Auditor`);
  // Simple echo of resolved options for visibility during dev
  console.log(JSON.stringify(opts, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
