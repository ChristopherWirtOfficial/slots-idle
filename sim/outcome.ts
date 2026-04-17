import Decimal from 'break_infinity.js';
import { LUCK_PRESSURE_K, SimSymbol } from './gameData';
import { DerivedValues } from './state';
import { RNG } from './rng';

export interface SpinOutcome {
  grid: SimSymbol[][];
  wins: Win[];
  totalPayout: Decimal;
  hasJackpot: boolean;
  /** Spin animation duration in ms — the sim uses this to advance time. */
  durationMs: number;
}

export interface Win {
  symbol: SimSymbol;
  matchCount: number;
  paylineIdx: number;
  payout: Decimal;
  isJackpot: boolean;
}

/**
 * Roll a single symbol with exponential luck pressure toward the rarest.
 *
 * Matches the game's engine/grid.ts formula exactly:
 *   weight_i = base_weight_i * exp(luck * rarity_i * K)
 * where rarity_i is i normalized to [0, 1] by symbol-list position.
 */
export function rollSymbol(symbols: SimSymbol[], luck: number, rng: RNG): SimSymbol {
  const weights = symbols.map((s, i) => {
    const rarity = i / Math.max(1, symbols.length - 1);
    return s.weight * Math.exp(luck * rarity * LUCK_PRESSURE_K);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < symbols.length; i++) {
    r -= weights[i];
    if (r <= 0) return symbols[i];
  }
  return symbols[0];
}

/** Generate the full [reelCount][rowCount] grid. */
export function generateGrid(
  symbols: SimSymbol[],
  reelCount: number,
  rowCount: number,
  luck: number,
  rng: RNG,
): SimSymbol[][] {
  const grid: SimSymbol[][] = [];
  for (let col = 0; col < reelCount; col++) {
    const column: SimSymbol[] = [];
    for (let row = 0; row < rowCount; row++) {
      column.push(rollSymbol(symbols, luck, rng));
    }
    grid.push(column);
  }
  return grid;
}

/**
 * Evaluate paylines left-to-right consecutive-match rule. Mirrors
 * machines/classic3x3/evaluate.ts exactly.
 */
export function evaluate(
  grid: SimSymbol[][],
  paylines: number[][],
  bet: number,
  globalMult: Decimal,
): Win[] {
  const wins: Win[] = [];

  for (let pIdx = 0; pIdx < paylines.length; pIdx++) {
    const payline = paylines[pIdx];
    const lineSyms = payline.map((row, col) => grid[col][row]);
    if (lineSyms.length === 0) continue;

    const first = lineSyms[0];
    let matchCount = 1;
    for (let i = 1; i < lineSyms.length; i++) {
      if (lineSyms[i].id === first.id) matchCount++;
      else break;
    }

    const multiplier = first.payouts[matchCount];
    if (multiplier === undefined || multiplier === 0) continue;

    const payout = globalMult.mul(bet * multiplier).floor();
    if (payout.lte(0)) continue;

    const isJackpot = first.id === 'seven' && matchCount === lineSyms.length;

    wins.push({
      symbol: first,
      matchCount,
      paylineIdx: pIdx,
      payout,
      isJackpot,
    });
  }

  return wins;
}

/**
 * Full spin outcome: grid + wins + totals + duration. Pure — no side
 * effects, no state mutation.
 */
export function rollSpinOutcome(derived: DerivedValues, rng: RNG): SpinOutcome {
  const grid = generateGrid(
    derived.symbols,
    derived.reelCount,
    derived.rowCount,
    derived.luck,
    rng,
  );
  const wins = evaluate(grid, derived.paylines, derived.bet, derived.multiplier);
  const totalPayout = wins.reduce<Decimal>((s, w) => s.add(w.payout), new Decimal(0));
  const hasJackpot = wins.some((w) => w.isJackpot);

  // Spin duration: worst-of-N reels, since all reels fire at once and we
  // wait for the last one. Approximated here as one draw from the range
  // (slightly inaccurate vs the game's per-reel independent durations,
  // but fine for sim-level time accounting).
  const durationMs = 1600 + rng.next() * (2800 - 1600);

  return { grid, wins, totalPayout, hasJackpot, durationMs };
}
