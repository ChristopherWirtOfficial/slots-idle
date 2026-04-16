// Upgrades — the incremental meat. Costs scale; effects compound.

export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  baseCost: number;
  costMult: number;
  maxLevel: number;
  effect: (level: number) => number; // semantic varies per upgrade
  format: (level: number) => string; // human-readable current effect
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'passiveAmount',
    name: 'House Gratuity',
    blurb: 'The floor staff slip you chips between hands. +1 per payout.',
    baseCost: 30,
    costMult: 1.5,
    maxLevel: 25,
    effect: (lvl) => 1 + lvl, // chips per tick
    format: (lvl) => `+${1 + lvl} chip${1 + lvl === 1 ? '' : 's'} / tick`,
  },
  {
    id: 'passiveRate',
    name: 'Brisk Service',
    blurb: 'Shorter pours, more frequent tips. 5s baseline down to 0.5s.',
    baseCost: 100,
    costMult: 1.55,
    maxLevel: 18,
    effect: (lvl) => Math.max(500, 5000 - lvl * 250), // ms between ticks
    format: (lvl) => `${(Math.max(500, 5000 - lvl * 250) / 1000).toFixed(2)}s / tick`,
  },
  {
    id: 'bet',
    name: 'Table Stakes',
    blurb: 'Raise your base wager. Bigger bets, bigger payouts.',
    baseCost: 50,
    costMult: 1.45,
    maxLevel: 50,
    effect: (lvl) => 1 + lvl, // bet amount = 1 + level
    format: (lvl) => `Bet ${1 + lvl} chips`,
  },
  {
    id: 'luck',
    name: 'Crooked Dealer',
    blurb: 'Tilts the odds toward rarer symbols. +2% luck per level.',
    baseCost: 120,
    costMult: 1.6,
    maxLevel: 25,
    effect: (lvl) => lvl * 0.02,
    format: (lvl) => `+${(lvl * 2).toFixed(0)}% luck`,
  },
  {
    id: 'autospin',
    name: 'Auto-Spin Butler',
    blurb: 'Spins on their own. Each level adds one spin per tick.',
    baseCost: 300,
    costMult: 1.8,
    maxLevel: 10,
    effect: (lvl) => lvl,
    format: (lvl) => (lvl === 0 ? 'Disabled' : `${lvl} spin${lvl === 1 ? '' : 's'}/tick`),
  },
  {
    id: 'speed',
    name: 'Brass Clockwork',
    blurb: 'Reduces auto-spin tick interval. Ticks go from 2s down to 0.2s.',
    baseCost: 500,
    costMult: 1.7,
    maxLevel: 18,
    effect: (lvl) => Math.max(200, 2000 - lvl * 100),
    format: (lvl) => `${(Math.max(200, 2000 - lvl * 100) / 1000).toFixed(1)}s / tick`,
  },
  {
    id: 'multiplier',
    name: 'House Favor',
    blurb: 'Global payout multiplier. +10% winnings per level.',
    baseCost: 1000,
    costMult: 1.9,
    maxLevel: 30,
    effect: (lvl) => 1 + lvl * 0.1,
    format: (lvl) => `×${(1 + lvl * 0.1).toFixed(1)} payouts`,
  },
];

// Cost of the nth purchase of an upgrade (0-indexed level = next level to buy)
export function costOf(u: UpgradeDef, currentLevel: number): number {
  return Math.ceil(u.baseCost * Math.pow(u.costMult, currentLevel));
}

// Prestige
export interface PrestigeState {
  highRollerPoints: number; // permanent currency
  lifetimeWinnings: number;
}

export function prestigeGain(lifetimeWinnings: number): number {
  // Standard prestige curve: sqrt-ish, threshold gating.
  if (lifetimeWinnings < 10000) return 0;
  return Math.floor(Math.sqrt(lifetimeWinnings / 10000));
}

export function prestigeMultiplier(points: number): number {
  return 1 + points * 0.25; // each HRP gives +25% winnings
}
