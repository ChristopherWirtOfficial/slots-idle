import { MachineWin, ResolvedMachineConfig, SlotSymbol } from '../../engine/types';
import { paylineNameById } from './paylines';

/**
 * Evaluate all active paylines. For each payline, count the longest
 * consecutive-from-left run of the same symbol. If that run length has
 * an entry in the symbol's payouts table, it's a win.
 *
 * This rule naturally extends to grown topologies: a 4-reel machine with
 * 4 matching cherries pays payouts[4]; 3 matching pays payouts[3].
 */
export function evaluate(ctx: {
  grid: SlotSymbol[][];
  config: ResolvedMachineConfig;
  bet: number;
  globalMult: number;
}): MachineWin[] {
  const { grid, config, bet, globalMult } = ctx;
  const wins: MachineWin[] = [];

  for (const payline of config.paylines) {
    // Gather the symbol at each column along this payline.
    const lineSyms: SlotSymbol[] = payline.rows.map((row, col) => grid[col][row]);
    if (lineSyms.length === 0) continue;

    // Count consecutive matches starting from column 0.
    const first = lineSyms[0];
    let matchCount = 1;
    for (let i = 1; i < lineSyms.length; i++) {
      if (lineSyms[i].id === first.id) matchCount++;
      else break;
    }

    const multiplier = first.payouts[matchCount];
    if (multiplier === undefined || multiplier === 0) continue;

    const payout = Math.floor(bet * multiplier * globalMult);
    if (payout === 0) continue;

    const isJackpot = first.id === 'seven' && matchCount === lineSyms.length;

    wins.push({
      name: paylineNameById(payline.id),
      symbol: first,
      payout,
      isJackpot,
      meta: { paylineId: payline.id, matchCount },
    });
  }

  return wins;
}
