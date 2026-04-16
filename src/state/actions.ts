import { atom } from 'jotai';
import { UPGRADES, costOf } from '../game/upgrades';
import { spin } from '../game/spin';
import { SYMBOLS } from '../game/symbols';
import {
  chipsAtom,
  jackpotsAtom,
  lifetimeWinningsAtom,
  spinsTotalAtom,
  totalEverWonAtom,
} from './economy';
import { levelsAtom, betAtom, luckAtom, autoPerTickAtom, passiveAmountAtom } from './upgrades';
import { globalMultAtom, highRollerPointsAtom, prestigePendingAtom } from './prestige';
import {
  isSpinningAtom,
  lastFloatAtom,
  lastResultAtom,
  reelsDisplayAtom,
} from './session';

const SPIN_ANIM_MS = 600; // keeps existing behavior until we add streaming strip

/**
 * Spin action. Write-only atom. Early-returns if already spinning or broke.
 * Kicks off a brief animated spin, then commits economy + session state.
 */
export const spinActionAtom = atom(null, (get, set) => {
  if (get(isSpinningAtom)) return;
  const bet = get(betAtom);
  if (get(chipsAtom) < bet) return;

  // Teaser reels for the animation window
  const teaser = [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  ];
  set(isSpinningAtom, true);
  set(reelsDisplayAtom, teaser);

  const luck = get(luckAtom);
  const mult = get(globalMultAtom);
  const result = spin(bet, luck, mult);

  setTimeout(() => {
    // Re-read chips to avoid stomping concurrent writes (autospin stacking etc.)
    const chips = get(chipsAtom);
    const nextChips = chips - bet + result.payout;
    const isJackpot = result.kind === 'three' && result.reels[0].id === 'seven';

    set(chipsAtom, nextChips);
    set(lifetimeWinningsAtom, get(lifetimeWinningsAtom) + result.payout);
    set(totalEverWonAtom, get(totalEverWonAtom) + result.payout);
    const spins = get(spinsTotalAtom) + 1;
    set(spinsTotalAtom, spins);
    set(reelsDisplayAtom, result.reels);
    set(lastResultAtom, result);
    if (result.payout > 0) {
      set(lastFloatAtom, { id: spins, amount: result.payout, kind: result.kind });
    } else {
      set(lastFloatAtom, null);
    }
    if (isJackpot) set(jackpotsAtom, get(jackpotsAtom) + 1);
    set(isSpinningAtom, false);
  }, SPIN_ANIM_MS);
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
});

export const prestigeActionAtom = atom(null, (get, set) => {
  const gain = get(prestigePendingAtom);
  if (gain <= 0) return;

  set(highRollerPointsAtom, get(highRollerPointsAtom) + gain);
  // Run-local state resets; permanent stats stay
  set(chipsAtom, 20);
  set(lifetimeWinningsAtom, 0);
  set(
    levelsAtom,
    Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Record<string, number>,
  );
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
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
  set(isSpinningAtom, false);
});

/**
 * Autospin tick: called by the tick loop at `frequency` ticks between calls.
 * Frequency comes from the speed upgrade and gates how often we fire.
 */
export const autospinTickAtom = atom(null, (get, set) => {
  if (get(autoPerTickAtom) === 0) return;
  if (get(isSpinningAtom)) return;
  if (get(chipsAtom) < get(betAtom)) return;
  set(spinActionAtom);
});

/**
 * Passive income tick: drip chips into the bank at upgrade-derived rate.
 * Always runs — even at 0 upgrades we get the baseline 1 chip / 5s.
 */
export const passiveIncomeTickAtom = atom(null, (get, set) => {
  set(chipsAtom, get(chipsAtom) + get(passiveAmountAtom));
});
