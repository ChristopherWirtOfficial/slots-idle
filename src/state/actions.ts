import { atom } from 'jotai';
import { UPGRADES, costOf } from '../game/upgrades';
import { spin } from '../game/spin';
import { SYMBOLS } from '../game/symbols';
import {
  NEAR_MISS_BONUS_MS,
  buildStrip,
  rollDistanceCells,
  rollDuration,
} from '../game/animation';
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
  getCurrentWindow,
  reelAtoms,
  SymWindow,
} from './reels';

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Tier payout for SFX selection. Bet-relative so scaling doesn't make
 * every mid-game spin sound like a jackpot.
 */
function payoutTier(totalPayout: number, bet: number, hasJackpot: boolean):
  'none' | 'small' | 'big' | 'jackpot' {
  if (hasJackpot) return 'jackpot';
  if (totalPayout === 0) return 'none';
  if (totalPayout >= bet * 10) return 'big';
  return 'small';
}

export const spinActionAtom = atom(null, (get, set) => {
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;

  const bet = get(betAtom);
  if (get(chipsAtom) < bet) return;

  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin(bet, luck, mult);

  set(chipsAtom, get(chipsAtom) - bet);
  set(lastFloatAtom, null);

  // Near-miss: if the top-row symbols of reels 0 and 1 match, stretch reel 2.
  // Cheap heuristic — any payline-level near-miss would be more accurate but
  // this still buys dramatic pauses on the most visually obvious cases.
  const willNearMiss = result.grid[0][0].id === result.grid[1][0].id;

  const startTime = nowMs();
  reelAtoms.forEach((reelAtom, i) => {
    const prev = getCurrentWindow(get(reelAtom));
    const resultWindow: SymWindow = [
      result.grid[i][0],
      result.grid[i][1],
      result.grid[i][2],
    ];
    const nearBonus = willNearMiss && i === 2 ? NEAR_MISS_BONUS_MS : 0;
    const duration = rollDuration(Math.random, nearBonus);
    const distanceCells = rollDistanceCells();
    const strip = buildStrip(prev, resultWindow, distanceCells);

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

export const animationTickAtom = atom(null, (get, set) => {
  const t = nowMs();
  set(frameTimeAtom, t);

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
    const tier = payoutTier(pending.totalPayout, bet, pending.hasJackpot);
    if (tier === 'jackpot') window.setTimeout(sfxJackpot, 120);
    else if (tier === 'big') window.setTimeout(sfxBigWin, 100);
    else if (tier === 'small') window.setTimeout(sfxSmallWin, 80);
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

function resetReelsDefault(set: (atom: typeof reelAtoms[number], v: { kind: 'resting'; window: SymWindow }) => void): void {
  reelAtoms.forEach((a, i) => {
    const w: SymWindow = [
      SYMBOLS[(i + 0) % SYMBOLS.length],
      SYMBOLS[(i + 1) % SYMBOLS.length],
      SYMBOLS[(i + 2) % SYMBOLS.length],
    ];
    set(a, { kind: 'resting', window: w });
  });
}

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
  resetReelsDefault(set);
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
  resetReelsDefault(set);
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
