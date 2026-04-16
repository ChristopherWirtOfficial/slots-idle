import { atom } from 'jotai';
import { spin } from '../engine/spin';
import { costOf } from '../engine/upgrades';
import { SlotSymbol } from '../engine/types';
import {
  NEAR_MISS_BONUS_MS,
  buildStrip,
  rollDistanceCells,
  rollDuration,
} from '../engine/animation';
import {
  sfxBigWin,
  sfxJackpot,
  sfxReelLand,
  sfxSmallWin,
  sfxSpinStart,
  sfxUpgrade,
} from '../audio/sfx';
import {
  chipsAtom,
  jackpotsAtom,
  lifetimeWinningsAtom,
  spinsTotalAtom,
  totalEverWonAtom,
} from './economy';
import { levelsAtom } from './levels';
import {
  activeMachineAtom,
  allUpgradesAtom,
  resolvedConfigAtom,
} from './machine';
import {
  betAtom,
  luckAtom,
  autoPerTickAtom,
  passiveAmountAtom,
} from './upgrades';
import { globalMultAtom, highRollerPointsAtom, prestigePendingAtom } from './prestige';
import { lastFloatAtom, lastResultAtom, pendingResultAtom } from './session';
import {
  anyReelSpinningAtom,
  frameTimeAtom,
  getCurrentWindow,
  reelAtomsAtom,
} from './reels';

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Start a spin: snapshot config, compute result, start per-reel animations.
 * Payout commits when the last reel lands (animationTickAtom).
 */
export const spinActionAtom = atom(null, (get, set) => {
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;

  const bet = get(betAtom);
  if (get(chipsAtom) < bet) return;

  const machine = get(activeMachineAtom);
  const config = get(resolvedConfigAtom);
  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin({ machine, config, bet, luck, globalMult: mult });

  set(chipsAtom, get(chipsAtom) - bet);
  set(lastFloatAtom, null);

  // Near-miss: any active payline has its first two positions matching
  // without producing a win overall. Triggers a stretched last-reel
  // animation for suspense on possible-but-missed wins.
  const willNearMiss =
    result.wins.length === 0 &&
    config.paylines.some((p) => {
      const a = result.grid[0][p.rows[0]];
      const b = result.grid[1][p.rows[1]];
      return a.id === b.id;
    });

  const startTime = nowMs();
  const reelAtoms = get(reelAtomsAtom);
  const lastReelIdx = reelAtoms.length - 1;

  reelAtoms.forEach((reelAtom, i) => {
    const prev = getCurrentWindow(get(reelAtom));
    // result.grid[i] is this column's [top, ..., bot]
    const resultWindow: SlotSymbol[] = [...result.grid[i]];
    const nearBonus = willNearMiss && i === lastReelIdx ? NEAR_MISS_BONUS_MS : 0;
    const duration = rollDuration(Math.random, nearBonus);
    const distanceCells = rollDistanceCells();
    // If prev window size mismatches current rowCount (e.g., user just
    // bought extraRow), pad or trim to match resultWindow. Cheap safety.
    const prevFixed = prev.length === resultWindow.length
      ? prev
      : resultWindow.map((_, k) => prev[k] ?? resultWindow[k]);
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
  if (pending !== null && !get(anyReelSpinningAtom)) {
    set(chipsAtom, get(chipsAtom) + pending.totalPayout);
    set(lifetimeWinningsAtom, get(lifetimeWinningsAtom) + pending.totalPayout);
    set(totalEverWonAtom, get(totalEverWonAtom) + pending.totalPayout);
    const spins = get(spinsTotalAtom) + 1;
    set(spinsTotalAtom, spins);
    set(lastResultAtom, pending);
    if (pending.totalPayout > 0) {
      set(lastFloatAtom, {
        id: spins,
        amount: pending.totalPayout,
        isJackpot: pending.hasJackpot,
      });
    }
    if (pending.hasJackpot) set(jackpotsAtom, get(jackpotsAtom) + 1);
    set(pendingResultAtom, null);

    const bet = get(betAtom);
    const tier = pending.hasJackpot
      ? 'jackpot'
      : pending.totalPayout >= bet * 10
      ? 'big'
      : pending.totalPayout > 0
      ? 'small'
      : 'none';
    if (tier === 'jackpot') window.setTimeout(sfxJackpot, 120);
    else if (tier === 'big') window.setTimeout(sfxBigWin, 100);
    else if (tier === 'small') window.setTimeout(sfxSmallWin, 80);
  }
});

/** Buy a level of any upgrade (engine global or machine contribution). */
export const buyUpgradeAtom = atom(null, (get, set, id: string) => {
  const upgrades = get(allUpgradesAtom);
  const u = upgrades.find((x) => x.id === id);
  if (!u) return;
  const levels = get(levelsAtom);
  const lvl = levels[id] ?? 0;
  if (lvl >= u.maxLevel) return;
  const cost = costOf(u, lvl);
  if (get(chipsAtom) < cost) return;

  set(chipsAtom, get(chipsAtom) - cost);
  set(levelsAtom, { ...levels, [id]: lvl + 1 });
  sfxUpgrade();
});

export const prestigeActionAtom = atom(null, (get, set) => {
  const gain = get(prestigePendingAtom);
  if (gain <= 0) return;

  set(highRollerPointsAtom, get(highRollerPointsAtom) + gain);
  set(chipsAtom, 20);
  set(lifetimeWinningsAtom, 0);
  set(levelsAtom, {});
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);
  // Clear reel states; useReelSync repopulates with default symbols
  // from the now-reset config.
  const reels = get(reelAtomsAtom);
  reels.forEach((a) => set(a, { kind: 'resting', window: [] }));
});

export const resetActionAtom = atom(null, (get, set) => {
  set(chipsAtom, 20);
  set(lifetimeWinningsAtom, 0);
  set(totalEverWonAtom, 0);
  set(jackpotsAtom, 0);
  set(spinsTotalAtom, 0);
  set(highRollerPointsAtom, 0);
  set(levelsAtom, {});
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);
  const reels = get(reelAtomsAtom);
  reels.forEach((a) => set(a, { kind: 'resting', window: [] }));
});

export const autospinTickAtom = atom(null, (get, set) => {
  if (get(autoPerTickAtom) === 0) return;
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;
  if (get(chipsAtom) < get(betAtom)) return;
  set(spinActionAtom);
});

export const passiveIncomeTickAtom = atom(null, (get, set) => {
  set(chipsAtom, get(chipsAtom) + get(passiveAmountAtom));
});
