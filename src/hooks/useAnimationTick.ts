import { useAtomicTick } from '../tick/useTick';
import { animationTickAtom } from '../state/actions';

/**
 * Runs every tick. Advances frame time, lands spinning reels when their
 * duration elapses, and commits pending spin results.
 */
export function useAnimationTick(): void {
  useAtomicTick(animationTickAtom, 1);
}
