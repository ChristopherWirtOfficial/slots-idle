import Decimal from 'break_infinity.js';
import {
  BASE_REEL_COUNT,
  BASE_ROW_COUNT,
  PAYLINE_SHAPES,
  STARTING_CHIPS,
  SimSymbol,
  SYMBOLS,
  UPGRADES,
  getUpgrade,
} from './gameData';

export interface SimState {
  // Persistent player state
  chips: Decimal;
  lifetimeWinnings: Decimal;
  levels: Record<string, number>;

  // Run counters
  spinCount: number;
  jackpots: number;

  // Time anchor (ms since sim start)
  simTimeMs: number;
  /** Last simulated-time at which a passive-income tick fired. */
  lastPassiveTickMs: number;
}

export function initialState(): SimState {
  return {
    chips: new Decimal(STARTING_CHIPS),
    lifetimeWinnings: new Decimal(0),
    levels: {},
    spinCount: 0,
    jackpots: 0,
    simTimeMs: 0,
    lastPassiveTickMs: 0,
  };
}

/**
 * Derived values from upgrade levels. Recompute on demand — cheap.
 * These are deliberately separate from state because they're functions
 * of state, not new state, and caching them would be another layer of
 * possible inconsistency.
 */
export interface DerivedValues {
  bet: number;
  luck: number;
  multiplier: Decimal;
  passiveAmount: number;
  passiveRateMs: number;
  autospinDelayMs: number;
  autospinUnlocked: boolean;
  reelCount: number;
  rowCount: number;
  symbols: SimSymbol[];
  paylines: number[][];
}

export function derive(state: SimState): DerivedValues {
  const lvl = (id: string) => state.levels[id] ?? 0;

  const reelCount = BASE_REEL_COUNT + lvl('extraReel');
  const rowCount = BASE_ROW_COUNT + lvl('extraRow');
  const paylines = PAYLINE_SHAPES.map((s) => s.extend(reelCount, rowCount));

  return {
    bet: getUpgrade('bet').effect(lvl('bet')),
    luck: getUpgrade('luck').effect(lvl('luck')),
    multiplier: new Decimal(getUpgrade('multiplier').effect(lvl('multiplier'))),
    passiveAmount: lvl('passiveAmount') === 0 ? 0 : getUpgrade('passiveAmount').effect(lvl('passiveAmount')),
    passiveRateMs: getUpgrade('passiveRate').effect(lvl('passiveRate')),
    autospinDelayMs: getUpgrade('autospin').effect(lvl('autospin')),
    autospinUnlocked: lvl('autospin') > 0,
    reelCount,
    rowCount,
    symbols: SYMBOLS,
    paylines,
  };
}

/** Cost of the next purchase of an upgrade, given current levels. */
export function nextCost(state: SimState, upgradeId: string): Decimal {
  const u = getUpgrade(upgradeId);
  const lvl = state.levels[upgradeId] ?? 0;
  return Decimal.mul(u.baseCost, Decimal.pow(u.costMult, lvl)).ceil();
}

/** Can this upgrade be purchased right now? (Below max, chips sufficient.) */
export function canBuy(state: SimState, upgradeId: string): boolean {
  const u = getUpgrade(upgradeId);
  const lvl = state.levels[upgradeId] ?? 0;
  if (lvl >= u.maxLevel) return false;
  return state.chips.gte(nextCost(state, upgradeId));
}

/** List of upgrade IDs currently affordable. */
export function affordableUpgrades(state: SimState): string[] {
  return UPGRADES.filter((u) => canBuy(state, u.id)).map((u) => u.id);
}
