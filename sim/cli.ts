import { writeFileSync } from 'fs';
import { DEFAULT_BATCH, runBatch } from './batch';
import { printSummary, summarize } from './analysis/summary';
import { trajectoriesToCsv } from './analysis/csv';
import { incomeCurves, renderIncomeCurve } from './analysis/income';

interface CliArgs {
  seeds: number;
  csv: string | null;
  chart: boolean;
  incomeCsv: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    seeds: 100,
    csv: null,
    chart: false,
    incomeCsv: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--seeds' || a === '-n') {
      args.seeds = parseInt(argv[++i], 10);
    } else if (a === '--csv') {
      args.csv = argv[++i];
    } else if (a === '--chart') {
      args.chart = true;
    } else if (a === '--income-csv') {
      args.incomeCsv = argv[++i];
    }
  }
  return args;
}

function usage() {
  console.log(`Usage: tsx sim/cli.ts [options]
Options:
  --seeds, -n <N>      Runs per archetype (default 100)
  --csv <path>         Write full trajectory CSV to the given path
  --income-csv <path>  Write per-archetype income-rate curves to a CSV
  --chart              Print ASCII income curve per archetype
  --help, -h           Show this help
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

  const curves = incomeCurves(batch, batch.config.snapshotIntervalMs);

  if (args.chart) {
    console.log('');
    console.log('=== Income-Rate Curves (chips / minute) ===');
    for (const c of curves) {
      console.log('');
      console.log(renderIncomeCurve(c));
    }
  }

  console.log('');
  console.log(
    `--- Ran ${batch.trajectories.length} trajectories in ${(elapsedMs / 1000).toFixed(2)}s ---`,
  );

  if (args.csv) {
    const csv = trajectoriesToCsv(batch);
    writeFileSync(args.csv, csv, 'utf8');
    console.log(`Trajectory CSV: ${args.csv} (${(csv.length / 1024).toFixed(1)} KB)`);
  }

  if (args.incomeCsv) {
    const rows = ['archetype,tMin,rateChipsPerMin'];
    for (const c of curves) {
      for (const s of c.samples) {
        rows.push(`${c.archetypeId},${s.tMin.toFixed(2)},${s.rateChipsPerMin.toFixed(2)}`);
      }
    }
    const csv = rows.join('\n');
    writeFileSync(args.incomeCsv, csv, 'utf8');
    console.log(`Income-curve CSV: ${args.incomeCsv} (${(csv.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
