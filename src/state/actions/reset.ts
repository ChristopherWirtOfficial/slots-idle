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
import { lastFloatAtom, lastResultAtom, pendingResultAtom } from '../session';
import { reelAtomsAtom } from '../reels';

const STARTING_CHIPS = 20;

/** Cash in prestige: gain HRP, wipe run-local state. Reels re-sync. */
export const prestigeActionAtom = atom(null, (get, set) => {
  const gain = get(prestigePendingAtom);
  if (gain <= 0) return;

  set(highRollerPointsAtom, get(highRollerPointsAtom) + gain);
  set(chipsAtom, STARTING_CHIPS);
  set(lifetimeWinningsAtom, 0);
  set(levelsAtom, {});
  set(lastResultAtom, null);
  set(lastFloatAtom, null);
  set(pendingResultAtom, null);

  const reels = get(reelAtomsAtom);
  reels.forEach((a) => set(a, { kind: 'resting', window: [] }));
});

/** Wipe everything. No takebacks. */
export const resetActionAtom = atom(null, (get, set) => {
  set(chipsAtom, STARTING_CHIPS);
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
