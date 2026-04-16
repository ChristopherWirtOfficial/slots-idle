import { useAtomValue } from 'jotai';
import { useAtomicTick } from '../tick/useTick';
import { TICK_LENGTH } from '../tick/knobs';
import { autoPerTickAtom, tickMsAtom } from '../state/upgrades';
import { autospinTickAtom } from '../state/actions';

/**
 * Translates the user-facing `tickMs` upgrade into a tick-loop frequency
 * (in ticks-between-fires) and wires the autospin action atom to the loop.
 *
 * We register the tick unconditionally — when autoPerTick is 0 the action
 * atom early-returns. This avoids re-registration churn when the player
 * buys/sells autospin levels.
 */
export function useAutospin(): void {
  const tickMs = useAtomValue(tickMsAtom);
  const autoPerTick = useAtomValue(autoPerTickAtom);

  // Convert desired ms-between-spins into ticks-between-fires, min 1.
  const frequency = Math.max(1, Math.round(tickMs / TICK_LENGTH));

  // Gate via frequency: when autospin disabled, slow poll (still cheap due to early return).
  const effectiveFrequency = autoPerTick === 0 ? 60 : frequency;

  useAtomicTick(autospinTickAtom, effectiveFrequency);
}
