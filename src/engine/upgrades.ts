import Decimal from 'break_infinity.js';
import { UpgradeDef } from './types';

/**
 * Engine-level (global) upgrades. Machines contribute their own via
 * Machine.upgrades; the engine merges both lists for UI + purchasing.
 *
 * Current tuning (post sim work): targets ~90m plateau for fast players,
 * ~2h for slow. Cost curves designed so ETA-to-next-upgrade stays flat
 * ~50s for first 80 min then inflects upward sharply. See /sim.
 *
 * Upgrades with maxLevel=0 are content-gated (prestige store, future
 * machines, etc) — the filter in allUpgradesAtom hides them from UI.
 */
export const GLOBAL_UPGRADES: UpgradeDef[] = [
  {
    id: 'bet',
    name: 'Table Stakes',
    blurb: 'Raise your wager. Every 3rd level bumps the increment.',
    baseCost: 35,
    costMult: 1.5,
    maxLevel: 8,
    // Step-every-3: +1,+1,+1,+2,+2,+2,+3,+3 (sum 15 over 8 levels; bet = 1+sum)
    effect: (lvl) => {
      let sum = 0;
      for (let k = 1; k <= lvl; k++) sum += Math.ceil(k / 3);
      return 1 + sum;
    },
    format: (lvl) => {
      let sum = 0;
      for (let k = 1; k <= lvl; k++) sum += Math.ceil(k / 3);
      return `Bet ${1 + sum} chips`;
    },
  },
  {
    id: 'multiplier',
    name: 'House Favor',
    blurb: 'Global payout multiplier. Each level is a 1.5× compounding boost.',
    baseCost: 300,
    costMult: 3.0,
    maxLevel: 10,
    effect: (lvl) => Math.pow(1.5, lvl),
    format: (lvl) => `×${Math.pow(1.5, lvl).toFixed(2)} payouts`,
  },
  {
    id: 'wildChance',
    name: 'Wild Card',
    blurb: 'A mystery card substitutes for anything on a payline.',
    baseCost: 400,
    costMult: 2.0,
    maxLevel: 10,
    // Effect = per-cell probability a cell is rolled as a wild, 0..1.
    // Curve: 2 * 1.5^(L-1) weight, normalized to weight/(weight+100).
    // Produces a tease at L1 (~2%), crossover at L5 (~9%), dominant
    // at L10 (~44%). See conversation 2026-04-17 for the math.
    effect: (lvl) => {
      if (lvl === 0) return 0;
      const w = 2 * Math.pow(1.5, lvl - 1);
      return w / (w + 100);
    },
    format: (lvl) => {
      if (lvl === 0) return 'Unlock at Lv 1';
      const w = 2 * Math.pow(1.5, lvl - 1);
      return `~${((w / (w + 100)) * 100).toFixed(1)}% per cell`;
    },
  },
  {
    id: 'autospin',
    name: 'Auto-Spin Butler',
    blurb:
      'Pulls the lever for you. Each level shortens the pause between spins.',
    baseCost: 150,
    costMult: 1.8,
    maxLevel: 10,
    effect: (lvl) => (lvl === 0 ? 0 : Math.max(200, 5000 - (lvl - 1) * 534)),
    format: (lvl) => {
      if (lvl === 0) return 'Disabled';
      const ms = Math.max(200, 5000 - (lvl - 1) * 534);
      return `${(ms / 1000).toFixed(1)}s between spins`;
    },
  },
  {
    id: 'passiveAmount',
    name: 'House Gratuity',
    blurb: 'The floor staff slip you a chip between hands.',
    baseCost: 80,
    costMult: 2.0,
    maxLevel: 3,
    effect: (lvl) => 1 + lvl,
    format: (lvl) => `+${1 + lvl} chip${1 + lvl === 1 ? '' : 's'} / tick`,
  },
  {
    id: 'passiveRate',
    name: 'Brisk Service',
    blurb: 'Shorter pours, more frequent tips.',
    baseCost: 150,
    costMult: 2.0,
    maxLevel: 3,
    effect: (lvl) => Math.max(5000, 10000 - lvl * 1500),
    format: (lvl) =>
      `${(Math.max(5000, 10000 - lvl * 1500) / 1000).toFixed(1)}s / tick`,
  },
  {
    id: 'luck',
    // DISABLED for now — will re-enable with different tuning or move
    // to prestige store. Kept defined so derive() still has a level-0
    // reference. Won't appear in UI (allUpgradesAtom filters maxLevel<=0).
    name: 'Crooked Dealer',
    blurb: 'Tilts the odds toward rarer symbols.',
    baseCost: 120,
    costMult: 1.6,
    maxLevel: 0,
    effect: (lvl) => lvl * 0.02,
    format: (lvl) => `+${(lvl * 2).toFixed(0)}% luck`,
  },
];

/**
 * Cost of the nth purchase of an upgrade (level = current, cost is for next).
 * Returns Decimal: with costMult values like 1.9 and deep upgrade levels,
 * costs easily exceed Number.MAX_SAFE_INTEGER (1.9^50 ≈ 1e14, 1.9^100 ≈ 1e26).
 */
export function costOf(u: UpgradeDef, currentLevel: number): Decimal {
  return Decimal.mul(u.baseCost, Decimal.pow(u.costMult, currentLevel)).ceil();
}

/**
 * HRP granted at prestige time. Decimal because lifetimeWinnings grows
 * unbounded, so sqrt(lifetimeWinnings / 10000) can go well past number range.
 * Floor'd to the nearest whole HRP.
 */
export function prestigeGain(lifetimeWinnings: Decimal): Decimal {
  if (lifetimeWinnings.lt(10000)) return new Decimal(0);
  return lifetimeWinnings.div(10000).sqrt().floor();
}

/** Permanent payout multiplier derived from HRP. Each point is +25%. */
export function prestigeMultiplier(points: Decimal): Decimal {
  return points.mul(0.25).add(1);
}
