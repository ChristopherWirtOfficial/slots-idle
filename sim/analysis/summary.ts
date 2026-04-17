import { BatchResult } from '../batch';
import { Trajectory } from '../trajectory';

/** Percentile of a sorted-ascending numeric array. */
function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * p)));
  return sorted[idx];
}

function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export interface ArchetypeSummary {
  archetypeId: string;
  nRuns: number;
  terminateCounts: Record<string, number>;
  spinCount: Stats;
  simTimeMin: Stats;
  lifetimeWinningsLog10: Stats;
  finalLevels: Record<string, Stats>;
  /** Time (in spins) between consecutive purchases, aggregated across all runs. */
  interPurchaseSpins: Stats;
  /** Per-upgrade: across all runs, at what spin count was it first purchased?
   *  Runs that never bought it are NOT in the dataset (they're counted separately). */
  firstPurchaseSpin: Record<string, Stats>;
  firstPurchaseNeverCount: Record<string, number>;
}

export interface Stats {
  n: number;
  mean: number;
  median: number;
  p5: number;
  p95: number;
  min: number;
  max: number;
}

function statsOf(xs: number[]): Stats {
  const sorted = [...xs].sort((a, b) => a - b);
  return {
    n: xs.length,
    mean: mean(xs),
    median: pct(sorted, 0.5),
    p5: pct(sorted, 0.05),
    p95: pct(sorted, 0.95),
    min: sorted.length ? sorted[0] : NaN,
    max: sorted.length ? sorted[sorted.length - 1] : NaN,
  };
}

function interPurchaseSpans(t: Trajectory): number[] {
  const spans: number[] = [];
  let lastBuySpin: number | null = null;
  for (const e of t.entries) {
    if (e.event.kind !== 'buy') continue;
    if (lastBuySpin !== null) {
      spans.push(e.spinCount - lastBuySpin);
    }
    lastBuySpin = e.spinCount;
  }
  return spans;
}

function firstPurchaseSpins(t: Trajectory): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of t.entries) {
    if (e.event.kind !== 'buy') continue;
    if (out[e.event.upgradeId] === undefined) {
      out[e.event.upgradeId] = e.spinCount;
    }
  }
  return out;
}

export function summarize(result: BatchResult): ArchetypeSummary[] {
  // Group trajectories by archetype
  const groups = new Map<string, Trajectory[]>();
  for (const t of result.trajectories) {
    if (!groups.has(t.archetypeId)) groups.set(t.archetypeId, []);
    groups.get(t.archetypeId)!.push(t);
  }

  const summaries: ArchetypeSummary[] = [];
  for (const [archetypeId, runs] of groups) {
    const terminateCounts: Record<string, number> = {};
    const spinCounts: number[] = [];
    const simTimes: number[] = [];
    const logWinnings: number[] = [];
    const finalLevels: Record<string, number[]> = {};
    const allSpans: number[] = [];
    const firstPurchaseByUpgrade: Record<string, number[]> = {};
    const neverPurchased: Record<string, number> = {};

    // Gather all upgrade IDs we see across runs
    const knownUpgrades = new Set<string>();
    for (const t of runs) {
      for (const id of Object.keys(t.final.levels)) knownUpgrades.add(id);
      for (const e of t.entries) {
        if (e.event.kind === 'buy') knownUpgrades.add(e.event.upgradeId);
      }
    }

    for (const t of runs) {
      terminateCounts[t.final.terminateReason] =
        (terminateCounts[t.final.terminateReason] ?? 0) + 1;
      spinCounts.push(t.final.spinCount);
      simTimes.push(t.final.simTimeMs / 60000); // minutes
      logWinnings.push(
        t.final.lifetimeWinnings.gt(0) ? Math.log10(t.final.lifetimeWinnings.toNumber() || 1) : 0,
      );

      for (const id of knownUpgrades) {
        if (!finalLevels[id]) finalLevels[id] = [];
        finalLevels[id].push(t.final.levels[id] ?? 0);
      }

      allSpans.push(...interPurchaseSpans(t));

      const firstByUpgrade = firstPurchaseSpins(t);
      for (const id of knownUpgrades) {
        if (firstByUpgrade[id] !== undefined) {
          if (!firstPurchaseByUpgrade[id]) firstPurchaseByUpgrade[id] = [];
          firstPurchaseByUpgrade[id].push(firstByUpgrade[id]);
        } else {
          neverPurchased[id] = (neverPurchased[id] ?? 0) + 1;
        }
      }
    }

    const finalLevelsStats: Record<string, Stats> = {};
    for (const [id, xs] of Object.entries(finalLevels)) {
      finalLevelsStats[id] = statsOf(xs);
    }

    const firstPurchaseStats: Record<string, Stats> = {};
    for (const [id, xs] of Object.entries(firstPurchaseByUpgrade)) {
      firstPurchaseStats[id] = statsOf(xs);
    }

    summaries.push({
      archetypeId,
      nRuns: runs.length,
      terminateCounts,
      spinCount: statsOf(spinCounts),
      simTimeMin: statsOf(simTimes),
      lifetimeWinningsLog10: statsOf(logWinnings),
      finalLevels: finalLevelsStats,
      interPurchaseSpins: statsOf(allSpans),
      firstPurchaseSpin: firstPurchaseStats,
      firstPurchaseNeverCount: neverPurchased,
    });
  }

  return summaries;
}

/** Human-readable text dump of a summary set. */
export function printSummary(summaries: ArchetypeSummary[]): string {
  const lines: string[] = [];
  lines.push(`=== Simulation Summary (${summaries.length} archetypes) ===`);
  for (const s of summaries) {
    lines.push('');
    lines.push(`## ${s.archetypeId} (n=${s.nRuns})`);
    lines.push(
      `  terminated: ${Object.entries(s.terminateCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`,
    );
    lines.push(
      `  spins: mean=${s.spinCount.mean.toFixed(0)} median=${s.spinCount.median} p5=${s.spinCount.p5} p95=${s.spinCount.p95}`,
    );
    lines.push(
      `  sim-time (min): median=${s.simTimeMin.median.toFixed(1)} p5=${s.simTimeMin.p5.toFixed(1)} p95=${s.simTimeMin.p95.toFixed(1)}`,
    );
    lines.push(
      `  log10(lifetime): median=${s.lifetimeWinningsLog10.median.toFixed(2)} p5=${s.lifetimeWinningsLog10.p5.toFixed(2)} p95=${s.lifetimeWinningsLog10.p95.toFixed(2)}`,
    );
    lines.push(
      `  inter-purchase-spins: median=${s.interPurchaseSpins.median} p5=${s.interPurchaseSpins.p5} p95=${s.interPurchaseSpins.p95}`,
    );
    lines.push('  first-purchase-spin (median / p5–p95 / never):');
    const upgradeIds = Object.keys({ ...s.firstPurchaseSpin, ...s.firstPurchaseNeverCount });
    upgradeIds.sort();
    for (const id of upgradeIds) {
      const fp = s.firstPurchaseSpin[id];
      const never = s.firstPurchaseNeverCount[id] ?? 0;
      if (fp) {
        lines.push(
          `    ${id.padEnd(18)} ${String(fp.median).padStart(5)}  [${fp.p5}..${fp.p95}]  never=${never}`,
        );
      } else {
        lines.push(`    ${id.padEnd(18)} (never purchased) never=${never}`);
      }
    }
    lines.push('  final levels (median):');
    for (const [id, st] of Object.entries(s.finalLevels)) {
      lines.push(`    ${id.padEnd(18)} median=${st.median}  p5=${st.p5} p95=${st.p95}`);
    }
  }
  return lines.join('\n');
}
