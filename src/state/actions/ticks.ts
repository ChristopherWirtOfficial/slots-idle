import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { chipsAtom } from '../economy';
import { passiveAmountAtom } from '../upgrades';

/**
 * Passive income tick: adds the current passive amount to the player's
 * chips. Registered with the tick loop in usePassiveIncome at the
 * user's current passive-rate frequency.
 *
 * Note: autospin used to have its own tick atom here, but moved to a
 * useEffect-driven model (see hooks/useAutospin). The tick loop only
 * handles passive income now.
 */
export const passiveIncomeTickAtom = atom(null, (get, set) => {
  const amount = get(passiveAmountAtom);
  if (amount === 0) return;
  set(chipsAtom, get(chipsAtom).add(new Decimal(amount)));
});
