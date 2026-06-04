import Decimal from 'break_infinity.js';
import { StoreTrackDef, UpgradeDef } from './types';

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
    // Cost curve retuned: previous 35 × 1.5^L meant L1 was affordable
    // in ~45s and every subsequent level scaled slower than the income
    // that level granted — making bet a "press whenever you can" dump
    // with no decision. Current 75 × 1.85 keeps the opener accessible
    // and scales gently:
    //   L1=75, L2=138, L4=474, L6=1625, L8=5562.
    // Pairs with the step-every-3 effect: later levels are more
    // powerful per level, so they SHOULD cost disproportionately more.
    baseCost: 75,
    costMult: 1.85,
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
    // Retuned: previous weight 2 × 1.5^(L-1) reached ~44% per-cell at
    // L10 which was overpowering — nearly every payline hit on nearly
    // every spin, removing the thrill of a wild reveal. Also too
    // cheap (base 400 × 2.0^L) for how game-warping it was.
    //
    // New curve 1.5 × 1.4^(L-1) tops out at ~24% per-cell; still
    // transformative at max level but not dominant. L1≈1.5%, L5≈5.4%,
    // L10≈23.6%. Base 600, mult 2.4 → L10 ≈ 1.6M chips, a proper
    // late-game commitment.
    baseCost: 600,
    costMult: 2.4,
    maxLevel: 10,
    // Effect = per-cell probability a cell is rolled as a wild, 0..1.
    effect: (lvl) => {
      if (lvl === 0) return 0;
      const w = 1.5 * Math.pow(1.4, lvl - 1);
      return w / (w + 100);
    },
    format: (lvl) => {
      if (lvl === 0) return 'Unlock at Lv 1';
      const w = 1.5 * Math.pow(1.4, lvl - 1);
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

// ─── Prestige points ──────────────────────────────────────────────────
// points = floor((lifetime / K) ^ exp). exp=1.0 is linear (pinned start);
// 1.05–1.1 later to reward plateau-pushing. K sets the points/prestige
// scale: with K=1000 a ~1M-lifetime cliff run yields ~1000 points.
// TUNABLE — proper calibration needs a prestige-loop sim (follow-up).
export const PRESTIGE_K = 1000;
export const PRESTIGE_EXP = 1.0;

// First prestige is gated to grant at least this many points — enough to
// actually afford a store purchase, so a new player is never tempted into
// a worthless 1-point cash-out. At K=1000 this lands the first prestige
// near the design's ~45-min cliff (≈50K lifetime). TUNABLE.
export const PRESTIGE_MIN_GAIN = 50;

/**
 * HRP granted at prestige time. Decimal because lifetimeWinnings grows
 * unbounded. Returns 0 (prestige disallowed) until the gain clears the
 * minimum — see PRESTIGE_MIN_GAIN.
 */
export function prestigeGain(lifetimeWinnings: Decimal): Decimal {
  if (lifetimeWinnings.lt(PRESTIGE_K)) return new Decimal(0);
  const gain = lifetimeWinnings.div(PRESTIGE_K).pow(PRESTIGE_EXP).floor();
  return gain.lt(PRESTIGE_MIN_GAIN) ? new Decimal(0) : gain;
}

// ─── Prestige store ───────────────────────────────────────────────────
// Two competing point sinks: per-upgrade cost-reduction tracks and one
// global payout-boost track (House Favor — absorbs the old flat prestige
// multiplier). All TUNABLE; point-cost balance pending the loop sim.
export const REDUCTION_SCALAR = 0.15;    // k in 1/(1 + level·k)
export const REDUCTION_POINT_BASE = 50;
export const REDUCTION_POINT_MULT = 1.6;
export const PAYOUT_SCALAR = 0.25;       // +25% payouts per level
export const PAYOUT_POINT_BASE = 100;
export const PAYOUT_POINT_MULT = 1.5;

/** Chip-cost reduction factor for an upgrade given its track level. */
export function reductionFactor(level: number, scalar = REDUCTION_SCALAR): number {
  return 1 / (1 + level * scalar);
}

/** Permanent payout multiplier from the House Favor store track. */
export function payoutTrackMult(level: number): Decimal {
  return new Decimal(1 + level * PAYOUT_SCALAR);
}

/** Point cost of the NEXT level of a store track (level = current). */
export function trackPointCost(track: StoreTrackDef, level: number): Decimal {
  return Decimal.mul(track.pointCostBase, Decimal.pow(track.pointCostMult, level)).ceil();
}

/** Build the cost-reduction track for a given base upgrade. */
export function reductionTrackFor(u: UpgradeDef): StoreTrackDef {
  return {
    id: `reduce:${u.id}`,
    name: u.name,
    blurb: `Permanently discount the chip cost of ${u.name}.`,
    pointCostBase: REDUCTION_POINT_BASE,
    pointCostMult: REDUCTION_POINT_MULT,
    maxLevel: 0,
    kind: 'reduction',
    target: u.id,
    scalar: REDUCTION_SCALAR,
    format: (lvl) => `−${Math.round((1 - reductionFactor(lvl)) * 100)}% cost`,
  };
}

/** The global payout-boost track (absorbs the old flat prestige multiplier). */
export const PAYOUT_TRACK: StoreTrackDef = {
  id: 'payout',
  name: 'House Favor',
  blurb: 'A permanent boost to every payout. Stacks atop your upgrades.',
  pointCostBase: PAYOUT_POINT_BASE,
  pointCostMult: PAYOUT_POINT_MULT,
  maxLevel: 0,
  kind: 'payout',
  scalar: PAYOUT_SCALAR,
  format: (lvl) => `×${(1 + lvl * PAYOUT_SCALAR).toFixed(2)} payouts`,
};
