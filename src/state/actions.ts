import { atom } from 'jotai';
import { UPGRADES, costOf } from '../game/upgrades';
import { spin } from '../game/spin';
import {
  NEAR_MISS_BONUS_MS,
  buildStrip,
  rollDistanceCells,
  rollDuration,
} from '../game/animation';
import {
  chipsAtom,
  jackpotsAtom,
  lifetimeWinningsAtom,
  spinsTotalAtom,
  totalEverWonAtom,
} from './economy';
import {
  levelsAtom,
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
  getCurrentSymbol,
  reelAtoms,
} from './reels';
import { SYMBOLS } from '../game/symbols';
import {
  sfxBigWin,
  sfxJackpot,
  sfxReelLand,
  sfxSmallWin,
  sfxSpinStart,
  sfxUpgrade,
} from '../audio/sfx';

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Kick off a spin: deduct bet, compute result, start each reel animating.
 * The payout is committed when the last reel lands (see animationTickAtom).
 */
export const spinActionAtom = atom(null, (get, set) => {
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return; // prior result not yet committed

  const bet = get(betAtom);
  if (get(chipsAtom) < bet) return;

  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin(bet, luck, mult);

  set(chipsAtom, get(chipsAtom) - bet);
  set(lastFloatAtom, null); // clear previous win float

  // Near-miss bonus: if reels 0 & 1 will match, stretch reel 2's duration.
  const willNearMiss = result.reels[0].id === result.reels[1].id;

  const startTime = nowMs();
  reelAtoms.forEach((reelAtom, i) => {
    const prev = getCurrentSymbol(get(reelAtom));
    const nearBonus = willNearMiss && i === 2 ? NEAR_MISS_BONUS_MS : 0;
    const duration = rollDuration(Math.random, nearBonus);
    const distanceCells = rollDistanceCells();
    const strip = buildStrip(prev, result.reels[i], distanceCells);

    set(reelAtom, {
      kind: 'spinning',
      startTime,
      duration,
      distanceCells,
      resultSymbol: result.reels[i],
      strip,
    });
  });

  set(pendingResultAtom, result);
  sfxSpinStart();
});

/**
 * Runs every animation tick. Advances frame time (triggers Reel re-renders),
 * transitions spinning reels to resting when their duration elapses, and
 * commits the pending payout once all reels have landed.
 */
export const animationTickAtom = atom(null, (get, set) => {
  const t = nowMs();
  set(frameTimeAtom, t);

  // Check for landings.
  for (const reelAtom of reelAtoms) {
    const s = get(reelAtom);
    if (s.kind !== 'spinning') continue;
    if (t - s.startTime >= s.duration) {
      set(reelAtom, { kind: 'resting', symbol: s.resultSymbol });
      sfxReelLand();
    }
  }

  // All reels resting + pending result present → commit.
  const pending = get(pendingResultAtom);
  if (pending !== null && !get(anyReelSpinningAtom)) {
    set(chipsAtom, get(chipsAtom) + pending.payout);
    set(lifetimeWinningsAtom, get(lifetimeWinningsAtom) + pending.payout);
    set(totalEverWonAtom, get(totalEverWonAtom) + pending.payout);
    const spins = get(spinsTotalAtom) + 1;
    set(spinsTotalAtom, spins);
    set(lastResultAtom, pending);
    if (pending.payout > 0) {
      set(lastFloatAtom, { id: spins, amount: pending.payout, kind: pending.kind });
    }
    const isJackpot =
      pending.kind === 'three' && pending.reels[0].id === 'seven';
    if (isJackpot) set(jackpotsAtom, get(jackpotsAtom) + 1);
    set(pendingResultAtom, null);

    // Outcome sounds — queued after the reel-land thump so they don't collide.
    if (isJackpot) {
      window.setTimeout(sfxJackpot, 120);
    } else if (pending.kind === 'three') {
      window.setTimeout(sfxBigWin, 100);
    } else if (pending.kind === 'two') {
      window.setTimeout(sfxSmallWin, 80);
    }
  }
});

export const buyUpgradeAtom = atom(null, (get, set, id: string) => {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return;
  const levels = get(levelsAtom);
  const lvl = levels[u.id] ?? 0;
  if (lvl >= u.maxLevel) return;
  const cost = costOf(u, lvl);
  if (get(chipsAtom) < cost) return;

  set(chipsAtom, get(chipsAtom) - cost);
  set(levelsAtom, { ...levels, [u.id]: lvl + 1 });
  sfxUpgrade();
});

export const prestigeActionAtom = atom(null, (get, set) => {
  const gain = get(prestigePendingAtom);
  if (gain <= 0) return;

  set(highRollerPointsAtom, get(highRollerPointsAtom) + gain);
  set(chipsAtom, 20);
  set(lifetimeWinningsAtom, 0);
  set(
    levelsAtom,
    Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Record<string, number>,
  );
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);
  reelAtoms.forEach((a, i) => set(a, { kind: 'resting', symbol: SYMBOLS[i] }));
});

export const resetActionAtom = atom(null, (_get, set) => {
  set(chipsAtom, 20);
  set(lifetimeWinningsAtom, 0);
  set(totalEverWonAtom, 0);
  set(jackpotsAtom, 0);
  set(spinsTotalAtom, 0);
  set(highRollerPointsAtom, 0);
  set(
    levelsAtom,
    Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Record<string, number>,
  );
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);
  reelAtoms.forEach((a, i) => set(a, { kind: 'resting', symbol: SYMBOLS[i] }));
});

// Autospin: fires spin at upgrade-derived frequency; spin action gates itself.
export const autospinTickAtom = atom(null, (get, set) => {
  if (get(autoPerTickAtom) === 0) return;
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;
  if (get(chipsAtom) < get(betAtom)) return;
  set(spinActionAtom);
});

// Passive income: drips chips at baseline + upgrades.
export const passiveIncomeTickAtom = atom(null, (get, set) => {
  set(chipsAtom, get(chipsAtom) + get(passiveAmountAtom));
});
