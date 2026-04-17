import { UpgradeDef } from './types';

/**
 * Engine-level (global) upgrades. Machines contribute their own via
 * Machine.upgrades; the engine merges both lists for UI + purchasing.
 */
export const GLOBAL_UPGRADES: UpgradeDef[] = [
  {
    id: 'passiveAmount',
    name: 'House Gratuity',
    blurb: 'The floor staff slip you a chip between hands.',
    baseCost: 50,
    costMult: 1.55,
    maxLevel: 10,
    effect: (lvl) => 1 + lvl,
    format: (lvl) => `+${1 + lvl} chip${1 + lvl === 1 ? '' : 's'} / tick`,
  },
  {
    id: 'passiveRate',
    name: 'Brisk Service',
    blurb: 'Shorter pours, more frequent tips. 10s baseline down to 2s.',
    baseCost: 120,
    costMult: 1.6,
    maxLevel: 16,
    effect: (lvl) => Math.max(2000, 10000 - lvl * 500),
    format: (lvl) =>
      `${(Math.max(2000, 10000 - lvl * 500) / 1000).toFixed(1)}s / tick`,
  },
  {
    id: 'bet',
    name: 'Table Stakes',
    blurb: 'Raise your base wager. Bigger bets, bigger payouts.',
    baseCost: 50,
    costMult: 1.45,
    maxLevel: 50,
    effect: (lvl) => 1 + lvl,
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
    blurb:
      'Pulls the lever for you. Starts with a long pause between spins; each level shortens it.',
    baseCost: 300,
    costMult: 1.8,
    maxLevel: 10,
    // Level 0 = disabled. Level 1 = 5.0s pause. Level 10 = 0.2s.
    // Steps of ~533ms with the last step hitting the 200ms floor.
    effect: (lvl) => (lvl === 0 ? 0 : Math.max(200, 5000 - (lvl - 1) * 534)),
    format: (lvl) => {
      if (lvl === 0) return 'Disabled';
      const ms = Math.max(200, 5000 - (lvl - 1) * 534);
      return `${(ms / 1000).toFixed(1)}s between spins`;
    },
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

/** Cost of the nth purchase of an upgrade (level = current, cost is for next). */
export function costOf(u: UpgradeDef, currentLevel: number): number {
  return Math.ceil(u.baseCost * Math.pow(u.costMult, currentLevel));
}

// Prestige helpers — global concept, engine-level.

export function prestigeGain(lifetimeWinnings: number): number {
  if (lifetimeWinnings < 10000) return 0;
  return Math.floor(Math.sqrt(lifetimeWinnings / 10000));
}

export function prestigeMultiplier(points: number): number {
  return 1 + points * 0.25;
}
