import { ResolvedMachineConfig, SlotSymbol } from './types';

/**
 * Coefficient on the exponential luck-rarity pressure. Higher = more
 * aggressive concentration on rare symbols as luck rises.
 *
 * Calibration anchor: at the natural-max luck of 0.5 (upgrade level 25),
 * the rarest symbol gets exp(0.5 * 1 * 6) ≈ 20× its baseline weight.
 * That's enough for the rarest to become competitive with the most
 * common (whose starting weight is ~20× the rarest's) — meaning the
 * luck upgrade actually pays off visibly at max.
 *
 * At luck=1, the rarest gets exp(6) ≈ 400×. At luck=2+, it dominates
 * completely. Cheat slider goes to 5 for the "only sevens" experience.
 */
const LUCK_PRESSURE_K = 6;

/**
 * Weighted random roll for one symbol, with `luck` biasing toward
 * rarer symbols (those later in the array) via exponential pressure.
 *
 * Weight of symbol i = base_weight[i] * exp(luck * rarity[i] * K),
 * where rarity is the symbol's position normalized to [0, 1].
 *
 * - luck=0: baseline (exp(0) = 1, no change).
 * - Small luck: rare symbols climb gradually.
 * - Large luck: exponential pressure overwhelms the baseline weight
 *   differential; the single rarest symbol dominates asymptotically.
 *
 * Note: linear boosts can't concentrate on a single symbol (the ratio
 * between neighboring rarity tiers approaches a constant). Exponential
 * pressure is required for the "only sevens at max luck" behavior.
 */
export function rollSymbol(
  symbols: SlotSymbol[],
  luck: number,
  rng: () => number,
): SlotSymbol {
  const weights = symbols.map((s, i) => {
    const rarity = i / Math.max(1, symbols.length - 1);
    return s.weight * Math.exp(luck * rarity * LUCK_PRESSURE_K);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < symbols.length; i++) {
    r -= weights[i];
    if (r <= 0) return symbols[i];
  }
  return symbols[0];
}

/** Generate a fresh grid [reelCount][rowCount]. Machine-neutral. */
export function generateGrid(
  config: ResolvedMachineConfig,
  luck: number,
  rng: () => number = Math.random,
): SlotSymbol[][] {
  const { reelCount, rowCount } = config.topology;
  const grid: SlotSymbol[][] = [];
  for (let col = 0; col < reelCount; col++) {
    const column: SlotSymbol[] = [];
    for (let row = 0; row < rowCount; row++) {
      column.push(rollSymbol(config.symbols, luck, rng));
    }
    grid.push(column);
  }
  return grid;
}
