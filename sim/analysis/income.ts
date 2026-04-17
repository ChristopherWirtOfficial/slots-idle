import { BatchResult } from '../batch';
import { Trajectory } from '../trajectory';

/**
 * Income rate curve — chips earned per minute, as a function of
 * simulated elapsed time. Derived from snapshot events.
 *
 * Output: per archetype, an array of (tMin, rateChipsPerMin) samples
 * aggregated across all runs in that archetype. The aggregation is
 * median: at each snapshot index, we take the median value across all
 * runs. This smooths out seed-to-seed variance while preserving the
 * shape of the typical progression curve.
 *
 * When snapshot output is unavailable or missing, that archetype
 * shows up with an empty series.
 */

export interface IncomeSample {
  /** Elapsed simulated time (minutes). */
  tMin: number;
  /** Chips earned during the preceding snapshot interval, in chips/min. */
  rateChipsPerMin: number;
}

export interface IncomeCurve {
  archetypeId: string;
  samples: IncomeSample[];
}

/** Extract per-run snapshot rates as (tMin, chipsPerMin) pairs. */
function snapshotRates(t: Trajectory, snapshotIntervalMs: number): IncomeSample[] {
  const minutesPerSnap = snapshotIntervalMs / 60000;
  const out: IncomeSample[] = [];
  for (const e of t.entries) {
    if (e.event.kind !== 'snapshot') continue;
    // chips-per-min = earnedSince / interval
    const rate = e.event.earnedSince.toNumber() / minutesPerSnap;
    out.push({ tMin: e.simTimeMs / 60000, rateChipsPerMin: rate });
  }
  return out;
}

/** Median of an array; returns 0 for empty. */
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Build median income curves per archetype. Aggregates snapshot rates
 * across all runs by snapshot index — run 1's 5min sample, run 2's
 * 5min sample, etc., take the median. That gives us "typical" income
 * rate at each time slice.
 */
export function incomeCurves(
  batch: BatchResult,
  snapshotIntervalMs: number,
): IncomeCurve[] {
  const groups = new Map<string, Trajectory[]>();
  for (const t of batch.trajectories) {
    if (!groups.has(t.archetypeId)) groups.set(t.archetypeId, []);
    groups.get(t.archetypeId)!.push(t);
  }

  const curves: IncomeCurve[] = [];
  for (const [archetypeId, runs] of groups) {
    const perRun = runs.map((t) => snapshotRates(t, snapshotIntervalMs));
    const maxSnaps = Math.max(...perRun.map((s) => s.length));

    const samples: IncomeSample[] = [];
    for (let i = 0; i < maxSnaps; i++) {
      const tMins: number[] = [];
      const rates: number[] = [];
      for (const runSamples of perRun) {
        if (runSamples[i]) {
          tMins.push(runSamples[i].tMin);
          rates.push(runSamples[i].rateChipsPerMin);
        }
      }
      if (rates.length === 0) continue;
      samples.push({
        tMin: median(tMins),
        rateChipsPerMin: median(rates),
      });
    }

    curves.push({ archetypeId, samples });
  }

  return curves;
}

/**
 * Simple text-based ASCII chart of an income curve. Low-fi but enough
 * to read the shape of the plateau at a glance in the terminal.
 */
export function renderIncomeCurve(curve: IncomeCurve, width = 60, height = 12): string {
  if (curve.samples.length === 0) {
    return `${curve.archetypeId}: (no samples)`;
  }

  const maxRate = Math.max(...curve.samples.map((s) => s.rateChipsPerMin));
  const maxT = curve.samples[curve.samples.length - 1].tMin;
  if (maxRate === 0) return `${curve.archetypeId}: (all zero)`;

  // Build grid: height rows, width cols. Row 0 is the top (highest rate).
  const grid: string[][] = [];
  for (let r = 0; r < height; r++) {
    grid.push(new Array(width).fill(' '));
  }

  for (const s of curve.samples) {
    const col = Math.min(width - 1, Math.floor((s.tMin / maxT) * (width - 1)));
    // Use log-scale for vertical axis so low rates are still visible
    const logVal = s.rateChipsPerMin > 0 ? Math.log10(s.rateChipsPerMin) : 0;
    const logMax = Math.log10(maxRate);
    const normalized = logMax > 0 ? logVal / logMax : 0;
    const row = Math.max(0, Math.min(height - 1, Math.floor((1 - normalized) * (height - 1))));
    grid[row][col] = '*';
  }

  const lines = [
    `${curve.archetypeId}  (y-axis log scale, max rate ${maxRate.toFixed(0)} chips/min, x-axis 0..${maxT.toFixed(0)}m)`,
  ];
  for (const row of grid) {
    lines.push('  |' + row.join(''));
  }
  lines.push('  +' + '-'.repeat(width));
  return lines.join('\n');
}
