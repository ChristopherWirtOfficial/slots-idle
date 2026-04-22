import { atom } from 'jotai';
import { spin } from '../../engine/spin';
import {
  Payline,
  ResolvedMachineConfig,
  SlotSymbol,
  SpinResult,
} from '../../engine/types';
import {
  NEAR_MISS_BONUS_MS,
  buildStrip,
  rollDistanceCells,
  rollDuration,
} from '../../engine/animation';
import {
  sfxBigWin,
  sfxJackpot,
  sfxReelLand,
  sfxSmallWin,
  sfxSpinStart,
} from '../../audio/sfx';
import {
  chipsAtom,
  jackpotsAtom,
  lifetimeWinningsAtom,
  spinsTotalAtom,
  totalEverWonAtom,
} from '../economy';
import { activeMachineAtom, resolvedConfigAtom } from '../machine';
import { currentBetAtom, luckAtom } from '../upgrades';
import { globalMultAtom } from '../prestige';
import { lastFloatAtom, lastResultAtom, pendingResultAtom } from '../session';
import {
  anyReelSpinningAtom,
  frameTimeAtom,
  getCurrentWindow,
  reelAtomsAtom,
} from '../reels';

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Near-miss detection: any active payline has its first two positions
 * matching without producing a win overall. Triggers a stretched
 * last-reel animation for suspense on possible-but-missed wins.
 */
function detectNearMiss(
  result: SpinResult,
  paylines: Payline[],
): boolean {
  if (result.wins.length > 0) return false;
  return paylines.some((p) => {
    const a = result.grid[0][p.rows[0]];
    const b = result.grid[1][p.rows[1]];
    return a.id === b.id;
  });
}

/**
 * If prev window size doesn't match current rowCount (e.g. user just
 * bought extraRow), pad or trim to match the result window. Cheap
 * visual safety — the old window was at the pre-upgrade height, the
 * new spin needs a window at the new height.
 */
function reconcileWindow(
  prev: SlotSymbol[],
  resultWindow: SlotSymbol[],
): SlotSymbol[] {
  if (prev.length === resultWindow.length) return prev;
  return resultWindow.map((_, k) => prev[k] ?? resultWindow[k]);
}

/**
 * What sound tier to play when a payout commits. 'none' plays nothing.
 */
type WinTier = 'none' | 'small' | 'big' | 'jackpot';

function winTier(result: SpinResult, bet: number): WinTier {
  if (result.hasJackpot) return 'jackpot';
  if (result.totalPayout.gte(bet * 10)) return 'big';
  if (result.totalPayout.gt(0)) return 'small';
  return 'none';
}

/** Starts a spin. Payout commits when the last reel lands (see animationTickAtom). */
export const spinActionAtom = atom(null, (get, set) => {
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;

  const bet = get(currentBetAtom);
  const chipsBefore = get(chipsAtom);
  if (chipsBefore.lt(bet)) return;

  const machine = get(activeMachineAtom);
  const config: ResolvedMachineConfig = get(resolvedConfigAtom);
  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin({ machine, config, bet, luck, globalMult: mult });

  set(chipsAtom, chipsBefore.sub(bet));
  set(lastFloatAtom, null);

  const nearMiss = detectNearMiss(result, config.paylines);
  const startTime = nowMs();
  const reelAtoms = get(reelAtomsAtom);
  const lastReelIdx = reelAtoms.length - 1;

  reelAtoms.forEach((reelAtom, i) => {
    const prev = getCurrentWindow(get(reelAtom));
    const resultWindow: SlotSymbol[] = [...result.grid[i]];
    const nearBonus = nearMiss && i === lastReelIdx ? NEAR_MISS_BONUS_MS : 0;
    const duration = rollDuration(Math.random, nearBonus);
    const distanceCells = rollDistanceCells();
    const prevFixed = reconcileWindow(prev, resultWindow);
    const strip = buildStrip(prevFixed, resultWindow, distanceCells, config.symbols);

    set(reelAtom, {
      kind: 'spinning',
      startTime,
      duration,
      distanceCells,
      resultWindow,
      strip,
    });
  });

  set(pendingResultAtom, result);
  sfxSpinStart();
});

/**
 * Runs every animation tick. Advances frame time, lands ready reels,
 * commits the pending payout once all reels have landed.
 */
export const animationTickAtom = atom(null, (get, set) => {
  const t = nowMs();
  set(frameTimeAtom, t);

  const reelAtoms = get(reelAtomsAtom);
  for (const reelAtom of reelAtoms) {
    const s = get(reelAtom);
    if (s.kind !== 'spinning') continue;
    if (t - s.startTime >= s.duration) {
      set(reelAtom, { kind: 'resting', window: s.resultWindow });
      sfxReelLand();
    }
  }

  const pending = get(pendingResultAtom);
  if (pending === null) return;
  if (get(anyReelSpinningAtom)) return;

  // All reels landed — commit the pending result.
  set(chipsAtom, get(chipsAtom).add(pending.totalPayout));
  set(lifetimeWinningsAtom, get(lifetimeWinningsAtom).add(pending.totalPayout));
  set(totalEverWonAtom, get(totalEverWonAtom).add(pending.totalPayout));
  const spins = get(spinsTotalAtom) + 1;
  set(spinsTotalAtom, spins);
  set(lastResultAtom, pending);
  if (pending.totalPayout.gt(0)) {
    set(lastFloatAtom, {
      id: spins,
      amount: pending.totalPayout,
      isJackpot: pending.hasJackpot,
    });
  }
  if (pending.hasJackpot) set(jackpotsAtom, get(jackpotsAtom) + 1);
  set(pendingResultAtom, null);

  const tier = winTier(pending, get(currentBetAtom));
  if (tier === 'jackpot') window.setTimeout(sfxJackpot, 120);
  else if (tier === 'big') window.setTimeout(sfxBigWin, 100);
  else if (tier === 'small') window.setTimeout(sfxSmallWin, 80);
});
