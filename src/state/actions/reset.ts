import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import {
  chipsAtom,
  jackpotsAtom,
  lifetimeWinningsAtom,
  spinsTotalAtom,
  totalEverWonAtom,
} from '../economy';
import { levelsAtom } from '../levels';
import { highRollerPointsAtom, prestigePendingAtom } from '../prestige';
import { storeLevelsAtom } from '../store';
import { lastCommitAtom, lastFloatAtom, pendingResultAtom } from '../session';
import { reelAtomsAtom } from '../reels';

const STARTING_CHIPS = () => new Decimal(30);
const ZERO = () => new Decimal(0);

/**
 * Cash in prestige: gain HRP, wipe run-local state. Permanent layers —
 * the HRP balance and the prestige store (storeLevelsAtom) — survive.
 * Reels re-sync.
 */
export const prestigeActionAtom = atom(null, (get, set) => {
  const gain = get(prestigePendingAtom);
  if (gain.lte(0)) return;

  set(highRollerPointsAtom, get(highRollerPointsAtom).add(gain));
  set(chipsAtom, STARTING_CHIPS());
  set(lifetimeWinningsAtom, ZERO());
  set(levelsAtom, {});
  set(lastCommitAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);

  const reels = get(reelAtomsAtom);
  reels.forEach((a) => set(a, { kind: 'resting', window: [] }));
});

/** Wipe everything. No takebacks. */
export const resetActionAtom = atom(null, (get, set) => {
  set(chipsAtom, STARTING_CHIPS());
  set(lifetimeWinningsAtom, ZERO());
  set(totalEverWonAtom, ZERO());
  set(jackpotsAtom, 0);
  set(spinsTotalAtom, 0);
  set(highRollerPointsAtom, ZERO());
  set(levelsAtom, {});
  set(storeLevelsAtom, {});
  set(lastCommitAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);

  const reels = get(reelAtomsAtom);
  reels.forEach((a) => set(a, { kind: 'resting', window: [] }));
});
