import { ResolvedMachineConfig, SlotSymbol } from './types';

/**
 * Weighted random roll for one symbol, with `luck` biasing toward
 * rarer symbols (those later in the array).
 *
 * luck=0: baseline weights. luck=1: the rarest symbol gets ~4× its
 * baseline weight; common symbols get smaller boosts.
 */
export function rollSymbol(
  symbols: SlotSymbol[],
  luck: number,
  rng: () => number,
): SlotSymbol {
  const weights = symbols.map((s, i) => {
    const rarity = i / Math.max(1, symbols.length - 1);
    return s.weight * (1 + luck * rarity * 3);
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
