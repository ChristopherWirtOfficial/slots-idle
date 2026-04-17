import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { chipsAtom } from '../state/economy';
import {
  autospinDelayMsAtom,
  autospinEffectiveAtom,
} from '../state/autospin';
import { betAtom } from '../state/upgrades';
import { pendingResultAtom } from '../state/session';
import { anyReelSpinningAtom } from '../state/reels';
import { spinActionAtom } from '../state/actions';

/**
 * Drives auto-pulls on a delay-after-settle model.
 *
 * When autospin is effective AND the reels are settled AND there's no
 * pending payout AND the player can afford a spin, schedules a single
 * `setTimeout` to fire the next spin after the configured delay. Every
 * relevant state change (reel activity, chip balance, toggle flip,
 * upgrade purchase) cancels any in-flight timeout via the useEffect
 * cleanup and re-evaluates on the next render.
 *
 * This model handles the tricky cases naturally without special-casing:
 *
 * - Manual spin during the delay: spinAction fires, anyReelSpinning
 *   flips true, effect reruns, cleanup cancels the pending timeout.
 *   After the manual spin lands and commits, the effect reruns again
 *   and schedules a fresh delay. No double-spin, no stuck state.
 *
 * - Ran out of chips: chips < bet, effect returns without scheduling.
 *   Passive income adds chips, chips dep changes, effect reruns,
 *   schedules the next spin.
 *
 * - Toggled off mid-delay: effective flips false, cleanup cancels,
 *   no more spins.
 *
 * - Upgrade bought mid-delay: delayMs changes, cleanup cancels,
 *   new timeout scheduled with the new shorter delay.
 */
export function useAutospin(): void {
  const effective = useAtomValue(autospinEffectiveAtom);
  const delayMs = useAtomValue(autospinDelayMsAtom);
  const spinning = useAtomValue(anyReelSpinningAtom);
  const pending = useAtomValue(pendingResultAtom);
  const chips = useAtomValue(chipsAtom);
  const bet = useAtomValue(betAtom);
  const doSpin = useSetAtom(spinActionAtom);

  useEffect(() => {
    if (!effective) return;
    if (spinning) return;
    if (pending !== null) return;
    if (chips < bet) return;

    const timer = window.setTimeout(() => {
      doSpin();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [effective, delayMs, spinning, pending, chips, bet, doSpin]);
}
