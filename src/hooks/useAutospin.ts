import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import {
  autospinDelayMsAtom,
  autospinWaitingAtom,
} from '../state/autospin';
import { spinActionAtom } from '../state/actions';

/**
 * Drives auto-pulls on a delay-after-settle model.
 *
 * When `autospinWaitingAtom` is true (see state/autospin.ts for the
 * exact conditions — effective + settled + affordable), schedule a
 * single setTimeout to fire the next spin after the configured delay.
 * Any state change that flips `waiting` to false cancels the pending
 * timeout via the effect cleanup.
 *
 * The tricky cases (manual spin mid-delay, running out of chips,
 * toggling off, upgrade bought mid-wait) all resolve naturally
 * because `waiting` changes in response to each, triggering cleanup
 * and re-evaluation.
 */
export function useAutospin(): void {
  const waiting = useAtomValue(autospinWaitingAtom);
  const delayMs = useAtomValue(autospinDelayMsAtom);
  const doSpin = useSetAtom(spinActionAtom);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => doSpin(), delayMs);
    return () => window.clearTimeout(timer);
  }, [waiting, delayMs, doSpin]);
}
