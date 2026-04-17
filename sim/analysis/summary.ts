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
  /** Spins between consecutive purchases, aggregated across all runs. */
  interPurchaseSpins: Stats;
  /** Minutes between consecutive purchases. Same events as above, wall-time. */
  interPurchaseMin: Stats;
  /** Per-upgrade: first-purchase spin count (runs that never bought it excluded). */
  firstPurchaseSpin: Record<string, Stats>;
  /** Per-upgrade: first-purchase sim-minutes (same dataset). */
  firstPurchaseMin: Record<string, Stats>;
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

function interPurchaseSpans(t: Trajectory): { spins: number[]; simMin: number[] } {
  const spins: number[] = [];
  const simMin: number[] = [];
  let lastBuySpin: number | null = null;
  let lastBuyMs: number | null = null;
  for (const e of t.entries) {
    if (e.event.kind !== 'buy') continue;
    if (lastBuySpin !== null && lastBuyMs !== null) {
      spins.push(e.spinCount - lastBuySpin);
      simMin.push((e.simTimeMs - lastBuyMs) / 60000);
    }
    lastBuySpin = e.spinCount;
    lastBuyMs = e.simTimeMs;
  }
  return { spins, simMin };
}

function firstPurchaseBy(
  t: Trajectory,
): Record<string, { spin: number; simMin: number }> {
  const out: Record<string, { spin: number; simMin: number }> = {};
  for (const e of t.entries) {
    if (e.event.kind !== 'buy') continue;
    if (out[e.event.upgradeId] === undefined) {
      out[e.event.upgradeId] = {
        spin: e.spinCount,
        simMin: e.simTimeMs / 60000,
      };
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
    const allSpansSpins: number[] = [];
    const allSpansMin: number[] = [];
    const firstSpinByUpgrade: Record<string, number[]> = {};
    const firstMinByUpgrade: Record<string, number[]> = {};
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

      const spans = interPurchaseSpans(t);
      allSpansSpins.push(...spans.spins);
      allSpansMin.push(...spans.simMin);

      const firstByUpgrade = firstPurchaseBy(t);
      for (const id of knownUpgrades) {
        const fp = firstByUpgrade[id];
        if (fp !== undefined) {
          if (!firstSpinByUpgrade[id]) firstSpinByUpgrade[id] = [];
          firstSpinByUpgrade[id].push(fp.spin);
          if (!firstMinByUpgrade[id]) firstMinByUpgrade[id] = [];
          firstMinByUpgrade[id].push(fp.simMin);
        } else {
          neverPurchased[id] = (neverPurchased[id] ?? 0) + 1;
        }
      }
    }

    const finalLevelsStats: Record<string, Stats> = {};
    for (const [id, xs] of Object.entries(finalLevels)) {
      finalLevelsStats[id] = statsOf(xs);
    }

    const firstSpinStats: Record<string, Stats> = {};
    for (const [id, xs] of Object.entries(firstSpinByUpgrade)) {
      firstSpinStats[id] = statsOf(xs);
    }
    const firstMinStats: Record<string, Stats> = {};
    for (const [id, xs] of Object.entries(firstMinByUpgrade)) {
      firstMinStats[id] = statsOf(xs);
    }

    summaries.push({
      archetypeId,
      nRuns: runs.length,
      terminateCounts,
      spinCount: statsOf(spinCounts),
      simTimeMin: statsOf(simTimes),
      lifetimeWinningsLog10: statsOf(logWinnings),
      finalLevels: finalLevelsStats,
      interPurchaseSpins: statsOf(allSpansSpins),
      interPurchaseMin: statsOf(allSpansMin),
      firstPurchaseSpin: firstSpinStats,
      firstPurchaseMin: firstMinStats,
      firstPurchaseNeverCount: neverPurchased,
    });
  }

  return summaries;
}

/** Format a minute count with unit suffix, picking sensible precision. */
function fmtMin(m: number): string {
  if (m < 1) return `${(m * 60).toFixed(0)}s`;
  if (m < 10) return `${m.toFixed(1)}m`;
  if (m < 60) return `${m.toFixed(0)}m`;
  const hrs = m / 60;
  return `${hrs.toFixed(1)}h`;
}

/** Format a log10 winnings value as a friendly suffix number. */
function fmtLog10(log: number): string {
  if (log <= 0) return '0';
  const v = Math.pow(10, log);
  if (v < 1000) return v.toFixed(0);
  if (v < 1e6) return `${(v / 1e3).toFixed(1)}K`;
  if (v < 1e9) return `${(v / 1e6).toFixed(1)}M`;
  if (v < 1e12) return `${(v / 1e9).toFixed(1)}B`;
  return `1e${log.toFixed(1)}`;
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
      `  run length: ${fmtMin(s.simTimeMin.median)} median, ` +
      `${fmtMin(s.simTimeMin.p5)}-${fmtMin(s.simTimeMin.p95)} p5-p95 ` +
      `(${s.spinCount.median} spins median)`,
    );
    lines.push(
      `  lifetime chips earned: ${fmtLog10(s.lifetimeWinningsLog10.median)} median, ` +
      `${fmtLog10(s.lifetimeWinningsLog10.p5)}-${fmtLog10(s.lifetimeWinningsLog10.p95)} p5-p95`,
    );
    lines.push(
      `  inter-purchase gap: ${fmtMin(s.interPurchaseMin.median)} median, ` +
      `${fmtMin(s.interPurchaseMin.p5)}-${fmtMin(s.interPurchaseMin.p95)} p5-p95 ` +
      `(${s.interPurchaseSpins.median} spins median)`,
    );
    lines.push('  first-purchase time (median / p5-p95 / never):');
    const upgradeIds = Object.keys({
      ...s.firstPurchaseMin,
      ...s.firstPurchaseNeverCount,
    });
    upgradeIds.sort();
    for (const id of upgradeIds) {
      const fp = s.firstPurchaseMin[id];
      const fs = s.firstPurchaseSpin[id];
      const never = s.firstPurchaseNeverCount[id] ?? 0;
      if (fp && fs) {
        const label = `${fmtMin(fp.median)} / ${fs.median}sp`.padEnd(16);
        const range = `[${fmtMin(fp.p5)}-${fmtMin(fp.p95)}]`.padEnd(20);
        lines.push(
          `    ${id.padEnd(16)} ${label} ${range} never=${never}`,
        );
      } else {
        lines.push(
          `    ${id.padEnd(16)} (never purchased)                         never=${never}`,
        );
      }
    }
    lines.push('  final levels (median / p5-p95):');
    for (const [id, st] of Object.entries(s.finalLevels)) {
      lines.push(
        `    ${id.padEnd(16)} ${String(st.median).padStart(3)}  [${st.p5}..${st.p95}]`,
      );
    }
  }
  return lines.join('\n');
}
