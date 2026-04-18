import { UPGRADES } from '../gameData';
import { runBatch } from '../batch';
import { DEFAULT_CONFIG } from '../run';
import { ARCHETYPES } from '../archetypes';

const bet = UPGRADES.find((u) => u.id === 'bet')!;
const mult = UPGRADES.find((u) => u.id === 'multiplier')!;

// Config matching "bet max 8, bet.cm 1.5, multi.bc 300, multi.cm 3.0"
bet.maxLevel = 8;
bet.costMult = 1.5;
mult.baseCost = 300;
mult.costMult = 3.0;

const grinder = ARCHETYPES.find((a) => a.id === 'grinder')!;
const batch = runBatch({
  ...DEFAULT_CONFIG,
  seedsPerArchetype: 20,
  seedStart: 1,
  archetypes: [grinder],
});

// Collect (tMin, eta) per snapshot, binned by minute
const bins = new Map<number, number[]>();
for (const t of batch.trajectories) {
  for (const e of t.entries) {
    if (e.event.kind !== 'snapshot') continue;
    if (!isFinite(e.event.etaNextUpgradeSec)) continue;
    const binIdx = Math.floor(e.simTimeMs / 60000 / 4);
    if (!bins.has(binIdx)) bins.set(binIdx, []);
    bins.get(binIdx)!.push(e.event.etaNextUpgradeSec);
  }
}

console.log('tMin | median ETA (n=seeds hit this bin)');
for (const [binIdx, vals] of [...bins].sort(([a], [b]) => a - b)) {
  const sorted = [...vals].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  console.log(`${(binIdx * 4 + 2).toString().padStart(4)}m | ${med.toFixed(0).padStart(6)}s  (n=${vals.length})`);
  if (binIdx * 4 > 180) break; // first 3h
}
