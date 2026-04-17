import { atom } from 'jotai';
import { chipsAtom } from '../economy';
import { autoPerTickAtom, betAtom, passiveAmountAtom } from '../upgrades';
import { pendingResultAtom } from '../session';
import { anyReelSpinningAtom } from '../reels';
import { spinActionAtom } from './spin';

/**
 * Auto-spin tick: fires spinAction if the user has auto-spin enabled and
 * the machine is idle with enough chips. Registered with the tick loop
 * in useAutospin at the user's current auto-spin frequency.
 */
export const autospinTickAtom = atom(null, (get, set) => {
  if (get(autoPerTickAtom) === 0) return;
  if (get(anyReelSpinningAtom)) return;
  if (get(pendingResultAtom) !== null) return;
  if (get(chipsAtom) < get(betAtom)) return;
  set(spinActionAtom);
});

/**
 * Passive income tick: adds the current passive amount to the player's
 * chips. Registered with the tick loop in usePassiveIncome at the
 * user's current passive-rate frequency.
 */
export const passiveIncomeTickAtom = atom(null, (get, set) => {
  set(chipsAtom, get(chipsAtom) + get(passiveAmountAtom));
});
