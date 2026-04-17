import { writeFileSync } from 'fs';
import { DEFAULT_BATCH, runBatch } from './batch';
import { printSummary, summarize } from './analysis/summary';
import { trajectoriesToCsv } from './analysis/csv';

interface CliArgs {
  seeds: number;
  csv: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { seeds: 100, csv: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--seeds' || a === '-n') {
      args.seeds = parseInt(argv[++i], 10);
    } else if (a === '--csv') {
      args.csv = argv[++i];
    }
  }
  return args;
}

function usage() {
  console.log(`Usage: tsx sim/cli.ts [options]
Options:
  --seeds, -n <N>    Runs per archetype (default 100)
  --csv <path>       Write full trajectory CSV to the given path
  --help, -h         Show this help
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const t0 = Date.now();
  const batch = runBatch({
    ...DEFAULT_BATCH,
    seedsPerArchetype: args.seeds,
  });
  const elapsedMs = Date.now() - t0;

  const summaries = summarize(batch);
  console.log(printSummary(summaries));

  console.log('');
  console.log(
    `--- Ran ${batch.trajectories.length} trajectories in ${(elapsedMs / 1000).toFixed(2)}s ---`,
  );

  if (args.csv) {
    const csv = trajectoriesToCsv(batch);
    writeFileSync(args.csv, csv, 'utf8');
    console.log(`CSV written to ${args.csv} (${(csv.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
