import { atom } from 'jotai';
import { spin } from '../../engine/spin';
import {
  Cell,
  MachineWin,
  Payline,
  ResolvedMachineConfig,
  SpinResult,
} from '../../engine/types';
import {
  NEAR_MISS_BONUS_MS,
  buildStrip,
  rollDistanceCells,
  rollDuration,
} from '../../engine/animation';
import { rollSymbolBiased } from '../../engine/grid';
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
import {
  lastCommitAtom,
  lastFloatAtom,
  pendingResultAtom,
  wildRerollAtom,
} from '../session';
import {
  anyReelSpinningAtom,
  getCurrentWindow,
  reelAtomsAtom,
} from '../reels';
import { effectiveNowAtom } from '../clock';
import Decimal from 'break_infinity.js';
import { canSpinAtom } from '../canSpin';

/**
 * Near-miss detection: any active payline has its first two positions
 * matching without producing a win overall. Triggers a stretched
 * last-reel animation for suspense on possible-but-missed wins.
 *
 * Two cells "match" for near-miss purposes if either is a wild, or if
 * they're the same symbol. A pair of wilds counts — both would have
 * substituted for whatever came next.
 */
function detectNearMiss(
  result: SpinResult,
  paylines: Payline[],
): boolean {
  if (result.wins.length > 0) return false;
  return paylines.some((p) => {
    const a = result.grid[0][p.rows[0]];
    const b = result.grid[1][p.rows[1]];
    if (a.kind === 'wild' || b.kind === 'wild') return true;
    return a.symbol.id === b.symbol.id;
  });
}

/**
 * If prev window size doesn't match current rowCount (e.g. user just
 * bought extraRow), pad or trim to match the result window. Cheap
 * visual safety — the old window was at the pre-upgrade height, the
 * new spin needs a window at the new height.
 */
function reconcileWindow(
  prev: Cell[],
  resultWindow: Cell[],
): Cell[] {
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
  if (!get(canSpinAtom)) return;

  const bet = get(currentBetAtom);
  const chipsBefore = get(chipsAtom);

  const machine = get(activeMachineAtom);
  const config: ResolvedMachineConfig = get(resolvedConfigAtom);
  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin({ machine, config, bet, luck, globalMult: mult });

  set(chipsAtom, chipsBefore.sub(bet));
  set(lastFloatAtom, null);

  const nearMiss = detectNearMiss(result, config.paylines);
  const startTime = get(effectiveNowAtom);
  const reelAtoms = get(reelAtomsAtom);
  const lastReelIdx = reelAtoms.length - 1;

  reelAtoms.forEach((reelAtom, i) => {
    const prev = getCurrentWindow(get(reelAtom));
    const resultWindow: Cell[] = [...result.grid[i]];
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

const WILD_REROLL_DURATION_MS = 1400;

/**
 * Rebuild pending result wins after the wild-only reveal. Each
 * wildOnly win gets the revealSymbol as its symbol, with payout
 * computed using that symbol's match table. totalPayout is recomputed
 * so the commit sees the post-reroll total.
 */
function applyWildReroll(
  pending: SpinResult,
  revealSymbol: { id: string; payouts: Record<number, number> },
  bet: number,
  globalMult: Decimal,
): SpinResult {
  const newWins: MachineWin[] = pending.wins.map((w) => {
    if (!w.meta?.wildOnly) return w;
    const matchCount = (w.meta.matchCount as number | undefined) ?? 0;
    const multiplier = revealSymbol.payouts[matchCount];
    if (multiplier === undefined || multiplier === 0) return w;
    const payout = globalMult.mul(bet * multiplier).floor();
    return {
      ...w,
      symbol: revealSymbol as MachineWin['symbol'],
      payout,
      isJackpot: revealSymbol.id === 'seven',
      meta: { ...w.meta, wildOnly: false, wildResolvedTo: revealSymbol.id },
    };
  });
  const totalPayout = newWins.reduce<Decimal>(
    (s, w) => s.add(w.payout),
    new Decimal(0),
  );
  const hasJackpot = newWins.some((w) => w.isJackpot);
  return { ...pending, wins: newWins, totalPayout, hasJackpot };
}

/**
 * Runs every animation tick. Advances frame time, lands ready reels,
 * handles the wild-only reroll pause, commits the pending payout once
 * all reels have landed AND any pending reroll has resolved.
 */
export const animationTickAtom = atom(null, (get, set) => {
  const t = get(effectiveNowAtom);

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

  // Wild-only reroll pause. If the pending result has any wild-only
  // wins, run the reroll animation before committing.
  const hasWildOnly = pending.wins.some((w) => w.meta?.wildOnly);
  const existingReroll = get(wildRerollAtom);

  if (hasWildOnly && existingReroll === null) {
    // Kick off the reroll. Pre-roll the reveal symbol now so the
    // popup's fade-in has a target; the popup's animation will show
    // symbols cycling then land on this one.
    const config = get(resolvedConfigAtom);
    const luck = get(luckAtom);
    const revealSymbol = rollSymbolBiased(config.symbols, luck, Math.random);
    set(wildRerollAtom, {
      startedAt: t,
      durationMs: WILD_REROLL_DURATION_MS,
      revealSymbol,
    });
    return;
  }

  if (existingReroll !== null) {
    // Still rerolling — wait until the animation duration elapses.
    if (t - existingReroll.startedAt < existingReroll.durationMs) return;

    // Reroll animation complete. Apply the reveal to the pending wins
    // and clear the reroll atom. The next tick (or the continuation
    // below) will run normal commit with the resolved pending.
    const bet = get(currentBetAtom);
    const mult = get(globalMultAtom);
    const resolved = applyWildReroll(pending, existingReroll.revealSymbol, bet, mult);
    set(pendingResultAtom, resolved);
    set(wildRerollAtom, null);
    // Fall through to commit using the resolved pending below.
  }

  // All reels landed AND any reroll is resolved — commit.
  const commitPending = get(pendingResultAtom);
  if (commitPending === null) return;

  set(chipsAtom, get(chipsAtom).add(commitPending.totalPayout));
  set(lifetimeWinningsAtom, get(lifetimeWinningsAtom).add(commitPending.totalPayout));
  set(totalEverWonAtom, get(totalEverWonAtom).add(commitPending.totalPayout));
  const spins = get(spinsTotalAtom) + 1;
  set(spinsTotalAtom, spins);
  set(lastCommitAtom, { result: commitPending, committedAt: t });
  if (commitPending.totalPayout.gt(0)) {
    set(lastFloatAtom, {
      id: spins,
      amount: commitPending.totalPayout,
      isJackpot: commitPending.hasJackpot,
      createdAt: t,
    });
  }
  if (commitPending.hasJackpot) set(jackpotsAtom, get(jackpotsAtom) + 1);
  set(pendingResultAtom, null);

  const tier = winTier(commitPending, get(currentBetAtom));
  if (tier === 'jackpot') window.setTimeout(sfxJackpot, 120);
  else if (tier === 'big') window.setTimeout(sfxBigWin, 100);
  else if (tier === 'small') window.setTimeout(sfxSmallWin, 80);
});
