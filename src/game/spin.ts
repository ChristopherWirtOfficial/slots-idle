import { PAYLINES, Payline } from './paylines';
import { REEL_COUNT, ROW_COUNT, SlotSymbol, SYMBOLS } from './symbols';

export interface WinLine {
  paylineId: string;
  symbol: SlotSymbol;
  matchCount: 3;
  payout: number;
}

export interface SpinResult {
  /** grid[col][row] — left→right, top→bottom. */
  grid: SlotSymbol[][];
  wins: WinLine[];
  totalPayout: number;
  hasJackpot: boolean;
}

/**
 * Roll one symbol with `luck` shifting mass toward rarer symbols.
 * luck in [0, 1+]; 0 = baseline, higher = rarer symbols more likely.
 */
function rollWithLuck(rng: () => number, luck: number): SlotSymbol {
  const weights = SYMBOLS.map((s, i) => {
    const rarityFactor = i / (SYMBOLS.length - 1); // 0..1
    return s.weight * (1 + luck * rarityFactor * 3);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function evaluatePayline(
  grid: SlotSymbol[][],
  payline: Payline,
  bet: number,
  globalMult: number,
): WinLine | null {
  const [r0, r1, r2] = payline.rows;
  const a = grid[0][r0];
  const b = grid[1][r1];
  const c = grid[2][r2];

  if (a.id === b.id && b.id === c.id) {
    const payout = Math.floor(bet * a.payout3 * globalMult);
    if (payout === 0) return null;
    return { paylineId: payline.id, symbol: a, matchCount: 3, payout };
  }
  return null;
}

export function spin(
  bet: number,
  luck: number,
  globalMult: number,
  rng: () => number = Math.random,
): SpinResult {
  // Build 3×3 grid column-first.
  const grid: SlotSymbol[][] = [];
  for (let col = 0; col < REEL_COUNT; col++) {
    const column: SlotSymbol[] = [];
    for (let row = 0; row < ROW_COUNT; row++) {
      column.push(rollWithLuck(rng, luck));
    }
    grid.push(column);
  }

  const wins: WinLine[] = [];
  for (const p of PAYLINES) {
    const w = evaluatePayline(grid, p, bet, globalMult);
    if (w) wins.push(w);
  }

  const totalPayout = wins.reduce((s, w) => s + w.payout, 0);
  const hasJackpot = wins.some((w) => w.matchCount === 3 && w.symbol.id === 'seven');

  return { grid, wins, totalPayout, hasJackpot };
}
