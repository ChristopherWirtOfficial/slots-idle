/**
 * Game data, copied from the game's source so the sim has no coupling to
 * the React/jotai runtime. When the game's balance changes, update this
 * file to match.
 *
 * This is intentionally duplicated rather than imported. The sim must
 * NOT depend on anything in ../src — not engine, not state, not even
 * the "pure" engine functions — because those files may evolve to
 * depend on React or other runtime concerns without us noticing.
 */

export interface SimSymbol {
  id: string;
  /** Relative weight for random rolls. */
  weight: number;
  /** Multiplier on bet, keyed by match count. */
  payouts: Record<number, number>;
}

/** Classic-3x3 symbols. Ordered by rarity (common → rare). */
export const SYMBOLS: SimSymbol[] = [
  { id: 'cherry',   weight: 40, payouts: { 3: 3,   4: 8,    5: 20 } },
  { id: 'lemon',    weight: 35, payouts: { 3: 4,   4: 12,   5: 30 } },
  { id: 'plum',     weight: 28, payouts: { 3: 7,   4: 20,   5: 50 } },
  { id: 'bell',     weight: 18, payouts: { 3: 12,  4: 35,   5: 90 } },
  { id: 'star',     weight: 10, payouts: { 3: 28,  4: 80,   5: 200 } },
  { id: 'diamond',  weight: 5,  payouts: { 3: 65,  4: 180,  5: 450 } },
  { id: 'seven',    weight: 2,  payouts: { 3: 250, 4: 700,  5: 1800 } },
];

/**
 * The 5 classic paylines as row-index-per-column shape rules.
 * Given (reelCount, rowCount), return the concrete rows array.
 */
const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));

export interface PaylineShape {
  id: string;
  extend: (reelCount: number, rowCount: number) => number[];
}

export const PAYLINE_SHAPES: PaylineShape[] = [
  { id: 'top', extend: (n) => Array(n).fill(0) },
  { id: 'mid', extend: (n, rows) => Array(n).fill(Math.floor((rows - 1) / 2)) },
  { id: 'bot', extend: (n, rows) => Array(n).fill(rows - 1) },
  {
    id: 'diag-dn',
    extend: (n, rows) => Array.from({ length: n }, (_, i) => clamp(i, rows - 1)),
  },
  {
    id: 'diag-up',
    extend: (n, rows) => Array.from({ length: n }, (_, i) => clamp(rows - 1 - i, rows - 1)),
  },
];

export const LUCK_PRESSURE_K = 6;

/**
 * Upgrade definitions. `effect` applied to level; machine-specific
 * upgrades (extraReel/extraRow) just produce int additions to base topology.
 *
 * Costs use the same base*costMult^lvl formula as the game.
 */
export interface SimUpgrade {
  id: string;
  baseCost: number;
  costMult: number;
  maxLevel: number;
  effect: (lvl: number) => number;
  /** Role tag — for analysis labels, not used in math. */
  role: 'bet' | 'luck' | 'multiplier' | 'passive-amount' | 'passive-rate' | 'autospin' | 'topology';
}

/**
 * Bet effect: sum of ceil(k/3) for k=1..lvl. Step-every-3 increment
 * pattern (+1,+1,+1,+2,+2,+2,+3,+3,+3,+4,...). Base bet is 1, so
 * wagered chips at level n = 1 + sum.
 */
function betEffect(lvl: number): number {
  let sum = 0;
  for (let k = 1; k <= lvl; k++) sum += Math.ceil(k / 3);
  return 1 + sum;
}

export const UPGRADES: SimUpgrade[] = [
  // Economic
  // bet: cheap base, step-every-3 effect pattern — "felt moments" at every
  //   third level. Moderate cost scaling. The "leveraged" lever: big wins
  //   AND big dry-streak cost.
  { id: 'bet',            baseCost: 35,   costMult: 1.5,  maxLevel: 8,  effect: betEffect,                                    role: 'bet' },
  // luck DISABLED for current tuning pass.
  { id: 'luck',           baseCost: 120,  costMult: 1.6,  maxLevel: 0,  effect: (l) => l * 0.02,                              role: 'luck' },
  // multiplier: 1.5^level effect. costMult 2.4 produces ratio shift of
  //   1.5/2.4 = 0.625 per level (each buy 37% worse value than last).
  //   Plateau behavior, tunable without blowing up.
  { id: 'multiplier',     baseCost: 300,  costMult: 3.0,  maxLevel: 10, effect: (l) => Math.pow(1.5, l),                      role: 'multiplier' },
  // Passive income — floor is on (1 chip / 10s baseline at level 0), but
  // upgrades are disabled. Role here is strictly anti-softlock insurance,
  // not an income driver.
  // Passive income — lifeline, not an income driver. Tuned so it offsets
  //   early bet costs and provides an AFK recovery path when the player
  //   has over-spent, but at max level is still a tiny fraction of primary
  //   income. Max state: 4 chips / 5.5s ≈ 43/min.
  { id: 'passiveAmount',  baseCost: 80,   costMult: 2.0,  maxLevel: 3,  effect: (l) => 1 + l,                                 role: 'passive-amount' },
  { id: 'passiveRate',    baseCost: 150,  costMult: 2.0,  maxLevel: 3,  effect: (l) => Math.max(5000, 10000 - l * 1500),      role: 'passive-rate' },
  // Automation
  // autospin: 150 base cost puts first-buy in tier-2 (100-300 band).
  { id: 'autospin',       baseCost: 150,  costMult: 1.8,  maxLevel: 10, effect: (l) => (l === 0 ? 0 : Math.max(200, 5000 - (l - 1) * 534)), role: 'autospin' },
  // Topology — DISABLED for this tuning pass. These are prestige-store
  //   items in the planned design, not base-run upgrades. Keep them
  //   defined so machine dimensions stay consistent at level 0.
  { id: 'extraReel',      baseCost: 15000, costMult: 4,   maxLevel: 0,  effect: (l) => 3 + l,                                 role: 'topology' },
  { id: 'extraRow',       baseCost: 25000, costMult: 5,   maxLevel: 0,  effect: (l) => 3 + l,                                 role: 'topology' },
];

export const STARTING_CHIPS = 30;
export const BASE_REEL_COUNT = 3;
export const BASE_ROW_COUNT = 3;

// Animation timing constants — taken from the game's engine/animation.ts.
// The sim cares about these because spin duration IS a real cost to the
// player (time during which they can't act).
export const SPIN_DURATION_MIN_MS = 1600;
export const SPIN_DURATION_MAX_MS = 2800;

export function getUpgrade(id: string): SimUpgrade {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown upgrade: ${id}`);
  return u;
}
