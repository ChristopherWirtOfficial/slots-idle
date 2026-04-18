/**
 * Parameter sweep for upgrade tuning. Runs the sim across a grid of
 * (bet.costMult, multi.baseCost, multi.costMult) values and reports
 * the plateau-time for each config.
 *
 * Plateau-time definition: the first simulated minute at which the
 * grinder archetype's median ETA-to-next-upgrade exceeds 2× its
 * baseline (computed as the mean of its first 30 minutes).
 *
 * Run with: npx tsx sim/tools/sweep.ts
 */
import { UPGRADES } from '../gameData';
import { runBatch } from '../batch';
import { DEFAULT_CONFIG } from '../run';
import { ARCHETYPES } from '../archetypes';
import { Trajectory } from '../trajectory';

/**
 * Extract the ETA-over-time series for an archetype group of trajectories.
 * Bucketed into minute bins; median across runs per bucket.
 */
function etaSeries(runs: Trajectory[], binMinutes = 4): { tMin: number; eta: number }[] {
  const bins = new Map<number, number[]>();
  for (const t of runs) {
    for (const e of t.entries) {
      if (e.event.kind !== 'snapshot') continue;
      if (!isFinite(e.event.etaNextUpgradeSec)) continue;
      const tMin = e.simTimeMs / 60000;
      const binIdx = Math.floor(tMin / binMinutes);
      if (!bins.has(binIdx)) bins.set(binIdx, []);
      bins.get(binIdx)!.push(e.event.etaNextUpgradeSec);
    }
  }
  const result: { tMin: number; eta: number }[] = [];
  for (const [binIdx, vals] of [...bins].sort(([a], [b]) => a - b)) {
    const sorted = [...vals].sort((a, b) => a - b);
    result.push({
      tMin: binIdx * binMinutes + binMinutes / 2,
      eta: sorted[Math.floor(sorted.length / 2)],
    });
  }
  return result;
}

/**
 * Find plateau time as the first minute where ETA exceeds a fixed
 * absolute threshold. We use 90 seconds — roughly double the typical
 * "healthy early-game" ETA of ~50s. This catches the onset of the
 * plateau rather than the full inflection, which we care about as
 * designers ("when does it START to feel bad").
 *
 * Returns null if never crossed during the run window.
 */
function findPlateauTime(series: { tMin: number; eta: number }[]): number | null {
  const THRESHOLD_SEC = 90;
  for (const s of series) {
    if (s.tMin <= 20) continue; // ignore startup noise
    if (s.eta > THRESHOLD_SEC) return s.tMin;
  }
  return null;
}

interface SweepConfig {
  betCostMult: number;
  betMaxLevel: number;
  multiBaseCost: number;
  multiCostMult: number;
}

/** Apply a sweep config by mutating UPGRADES in-place. Yes, module state. */
function applyConfig(cfg: SweepConfig) {
  const bet = UPGRADES.find((u) => u.id === 'bet')!;
  const mult = UPGRADES.find((u) => u.id === 'multiplier')!;
  bet.costMult = cfg.betCostMult;
  bet.maxLevel = cfg.betMaxLevel;
  mult.baseCost = cfg.multiBaseCost;
  mult.costMult = cfg.multiCostMult;
}

async function main() {
  const sweeps: SweepConfig[] = [];
  for (const bml of [8, 10, 12, 15]) {
    for (const bcm of [1.5, 1.7]) {
      for (const mbc of [300, 700, 1500]) {
        for (const mcm of [2.4, 3.0]) {
          sweeps.push({
            betCostMult: bcm,
            betMaxLevel: bml,
            multiBaseCost: mbc,
            multiCostMult: mcm,
          });
        }
      }
    }
  }

  // Only run the grinder archetype — it's our reference for plateau time,
  // and it's the fast-player end of the spectrum we care about.
  const grinder = ARCHETYPES.find((a) => a.id === 'grinder')!;

  console.log(
    `Running ${sweeps.length} configs × 20 seeds = ${sweeps.length * 20} trajectories`,
  );
  console.log(
    `bet max / bet.cm / multi.bc / multi.cm | grinder plateau | final bet/multi | peak ETA`,
  );
  console.log('-'.repeat(90));

  const t0 = Date.now();
  for (const cfg of sweeps) {
    applyConfig(cfg);
    const batch = runBatch({
      ...DEFAULT_CONFIG,
      seedsPerArchetype: 20,
      seedStart: 1,
      archetypes: [grinder],
    });
    const series = etaSeries(batch.trajectories);
    const plateau = findPlateauTime(series);
    const peakEta = Math.max(...series.map((s) => s.eta));
    const finalBet = median(batch.trajectories.map((t) => t.final.levels['bet'] ?? 0));
    const finalMult = median(
      batch.trajectories.map((t) => t.final.levels['multiplier'] ?? 0),
    );
    const plateauStr = plateau === null ? '      none' : `${Math.round(plateau).toString().padStart(5)}m   `;
    console.log(
      `${String(cfg.betMaxLevel).padStart(3)}      ${cfg.betCostMult.toFixed(2)}     ${String(cfg.multiBaseCost).padStart(5)}     ${cfg.multiCostMult.toFixed(1)}    | ${plateauStr}     | ${String(finalBet).padStart(4)}/${String(finalMult).padStart(4)}       | ${Math.round(peakEta)}s`,
    );
  }
  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n(${elapsed.toFixed(1)}s total)`);
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
