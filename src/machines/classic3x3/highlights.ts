import { CellHighlight, MachineWin, ResolvedMachineConfig } from '../../engine/types';

/**
 * For a payline-style win: draw a line through the matching cells (from
 * column 0 up to the matchCount). Cell dots mark the same range.
 */
export function highlightsForWin(
  win: MachineWin,
  config: ResolvedMachineConfig,
): CellHighlight {
  const paylineId = win.meta?.paylineId as string | undefined;
  const matchCount = (win.meta?.matchCount as number | undefined) ?? 0;

  const payline = config.paylines.find((p) => p.id === paylineId);
  if (!payline || matchCount === 0) {
    return { cells: [], variant: win.isJackpot ? 'jackpot' : 'primary' };
  }

  const cells = payline.rows
    .slice(0, matchCount)
    .map((row, col) => ({ col, row }));

  return {
    cells,
    line: cells,
    variant: win.isJackpot ? 'jackpot' : 'primary',
  };
}
