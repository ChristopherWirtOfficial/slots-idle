import { atom } from 'jotai';
import { chipsAtom } from './economy';
import { currentBetAtom } from './upgrades';
import { anyReelSpinningAtom } from './reels';
import { pendingResultAtom } from './session';

/**
 * Can the player spin right now? Mirrors the guards inside
 * spinActionAtom so UI and action stay in sync — if this atom is true,
 * dispatching spinActionAtom will actually spin.
 *
 *  - No reel currently spinning
 *  - No pending result awaiting commit (animation or wild reroll in flight)
 *  - Enough chips to cover the current bet
 */
export const canSpinAtom = atom((get) => {
  if (get(anyReelSpinningAtom)) return false;
  if (get(pendingResultAtom) !== null) return false;
  return get(chipsAtom).gte(get(currentBetAtom));
});
