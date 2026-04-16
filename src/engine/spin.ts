import { Machine, ResolvedMachineConfig, SpinResult } from './types';
import { generateGrid } from './grid';

/**
 * One engine-level spin. Pure — chip deduction, reel state, SFX all
 * happen at the call site.
 */
export function spin(opts: {
  machine: Machine;
  config: ResolvedMachineConfig;
  bet: number;
  luck: number;
  globalMult: number;
  rng?: () => number;
}): SpinResult {
  const rng = opts.rng ?? Math.random;
  const grid = generateGrid(opts.config, opts.luck, rng);
  const wins = opts.machine.evaluate({
    grid,
    config: opts.config,
    bet: opts.bet,
    globalMult: opts.globalMult,
  });
  const totalPayout = wins.reduce((s, w) => s + w.payout, 0);
  const hasJackpot = wins.some((w) => w.isJackpot);
  return { grid, wins, totalPayout, hasJackpot };
}

export function costOfSpin(
  machine: Machine,
  config: ResolvedMachineConfig,
  bet: number,
): number {
  return machine.costPerSpin ? machine.costPerSpin(bet, config) : bet;
}
