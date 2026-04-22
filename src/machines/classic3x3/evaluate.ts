import Decimal from 'break_infinity.js';
import { Cell, MachineWin, ResolvedMachineConfig, SlotSymbol } from '../../engine/types';
import { paylineNameById } from './paylines';

/**
 * Evaluate all active paylines. For each payline, walk left-to-right:
 * the first non-wild cell establishes the "anchor" symbol. Subsequent
 * cells match if they are the same symbol OR a wild. The run ends at
 * the first cell that doesn't match.
 *
 * Edge case: if every cell on the line is a wild, the line is emitted
 * as a wild-only win. The engine resolves it later by rolling a
 * substitute symbol (luck-weighted). Until then, payout is 0 and
 * meta.wildOnly = true.
 */
export function evaluate(ctx: {
  grid: Cell[][];
  config: ResolvedMachineConfig;
  bet: number;
  globalMult: Decimal;
}): MachineWin[] {
  const { grid, config, bet, globalMult } = ctx;
  const wins: MachineWin[] = [];

  for (const payline of config.paylines) {
    const lineCells: Cell[] = payline.rows.map((row, col) => grid[col][row]);
    if (lineCells.length === 0) continue;

    // Find the anchor — first non-wild cell. If there isn't one, the
    // entire line is wild, which is a special case handled below.
    const anchorIdx = lineCells.findIndex((c) => c.kind !== 'wild');

    if (anchorIdx === -1) {
      // Wild-only line. Emit with a placeholder symbol (first config
      // symbol) — the reroll will replace this before payout commits.
      wins.push({
        name: paylineNameById(payline.id),
        symbol: config.symbols[0],
        payout: new Decimal(0),
        isJackpot: false,
        meta: { paylineId: payline.id, matchCount: lineCells.length, wildOnly: true },
      });
      continue;
    }

    // The anchor must be a symbol cell since anchorIdx !== -1.
    const anchor = lineCells[anchorIdx] as Extract<Cell, { kind: 'symbol' }>;
    const anchorSymbol: SlotSymbol = anchor.symbol;

    // Walk from col 0 counting consecutive matches. A wild matches
    // anything; a symbol cell must equal the anchor. If the anchor
    // isn't at col 0 (i.e. wilds precede it), those wilds count toward
    // the run too, since they substitute for the anchor symbol.
    let matchCount = 0;
    for (const cell of lineCells) {
      if (cell.kind === 'wild') {
        matchCount++;
      } else if (cell.symbol.id === anchorSymbol.id) {
        matchCount++;
      } else {
        break;
      }
    }

    const multiplier = anchorSymbol.payouts[matchCount];
    if (multiplier === undefined || multiplier === 0) continue;

    // bet × symbolMult is small-bounded (max ~51 × 1800 = 91,800) — stay number
    // here, then apply globalMult which is the unbounded term.
    const payout = globalMult.mul(bet * multiplier).floor();
    if (payout.lte(0)) continue;

    const isJackpot =
      anchorSymbol.id === 'seven' && matchCount === lineCells.length;

    wins.push({
      name: paylineNameById(payline.id),
      symbol: anchorSymbol,
      payout,
      isJackpot,
      meta: { paylineId: payline.id, matchCount },
    });
  }

  return wins;
}
