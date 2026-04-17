/**
 * Standalone curve visualizer for upgrade tuning. Plots cost-per-level
 * and effect-per-level for the current upgrade set. Run with:
 *
 *   npx tsx sim/tools/curves.ts
 *
 * This is a dev tool — no dependency on sim runs. Just pure math on
 * whatever UPGRADES is currently set to.
 */
import { UPGRADES } from '../gameData';

function fmt(n: number): string {
  if (n < 1000) return n.toFixed(1);
  if (n < 1e6) return `${(n / 1e3).toFixed(1)}K`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)}M`;
  if (n < 1e12) return `${(n / 1e9).toFixed(1)}B`;
  if (n < 1e15) return `${(n / 1e12).toFixed(1)}T`;
  return n.toExponential(1);
}

/** ASCII chart: one row per level, two bars (cost + effect) log-scale. */
function chart(id: string) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) throw new Error(`no upgrade ${id}`);

  const levels = Math.min(u.maxLevel, 30);
  const rows: { lvl: number; cost: number; effect: number }[] = [];
  for (let lvl = 0; lvl < levels; lvl++) {
    const cost = u.baseCost * Math.pow(u.costMult, lvl);
    const effect = u.effect(lvl + 1);
    rows.push({ lvl: lvl + 1, cost, effect });
  }

  const maxLog = Math.max(
    ...rows.map((r) => Math.log10(Math.max(r.cost, r.effect || 0.1))),
  );
  const width = 50;

  console.log(`\n=== ${id} (baseCost ${u.baseCost}, costMult ${u.costMult}, max ${u.maxLevel}) ===`);
  console.log(`Level  | Cost          | Effect       | log-scale (cost=C, effect=E)`);
  console.log('-'.repeat(90));
  for (const r of rows) {
    const cCol = Math.floor((Math.log10(Math.max(r.cost, 0.1)) / maxLog) * width);
    const eCol = Math.floor((Math.log10(Math.max(r.effect, 0.1)) / maxLog) * width);
    const bar = new Array(width + 1).fill(' ');
    for (let i = 0; i <= Math.max(cCol, eCol); i++) {
      if (i === cCol && i === eCol) bar[i] = '#';
      else if (i === cCol) bar[i] = 'C';
      else if (i === eCol) bar[i] = 'E';
      else if (i < Math.min(cCol, eCol)) bar[i] = '.';
    }
    console.log(
      `  ${String(r.lvl).padStart(3)}  | ${fmt(r.cost).padEnd(13)} | ${fmt(r.effect).padEnd(12)} | ${bar.join('')}`,
    );
  }

  // Ratio-of-growth summary: if cost grows faster than effect, diminishing returns.
  const costRatio = u.costMult;
  const effectSamples = [u.effect(1), u.effect(5), u.effect(10), u.effect(20)];
  const effectRatios = [
    u.effect(2) / u.effect(1),
    u.effect(10) / u.effect(5),
  ];
  console.log(
    `  cost grows ${costRatio}×/level; effect grows ${effectRatios[0].toFixed(2)}×/level (early) → ${effectRatios[1].toFixed(2)}×/5-level (mid)`,
  );
  console.log(
    `  effect at L1/L5/L10/L20: ${effectSamples.map(fmt).join(' / ')}`,
  );
}

// Chart the economic upgrades
for (const id of ['bet', 'multiplier', 'luck', 'passiveAmount', 'autospin']) {
  chart(id);
}
