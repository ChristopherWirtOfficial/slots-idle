import { useAtomicTick } from '../tick/useTick';
import { autospinTickAtom } from '../state/autospin';

/**
 * Drives autospin pulls via the tick loop.
 *
 * The tick atom reads current game state and decides whether it's
 * time to fire a spin. Because this is pure "does state match
 * conditions?" rather than a scheduled side-effect, offline
 * catch-up fast-forwards autospin naturally — run the ticks faster
 * and autospin fires faster.
 *
 * All the edge cases (manual spin mid-delay, running out of chips,
 * toggling off, upgrade bought mid-wait) resolve naturally because
 * the tick re-evaluates from scratch each time.
 */
export function useAutospin(): void {
  useAtomicTick(autospinTickAtom, 1);
}
