import { useAtomicTick } from '../tick/useTick';
import { reelTickAudioTickAtom } from '../state/actions';

/**
 * Fires reel-tick sounds each time a spinning reel crosses a new
 * integer cell boundary. The actual detection lives in the tick atom;
 * this hook just subscribes it to the tick loop.
 */
export function useReelTickAudio(): void {
  useAtomicTick(reelTickAudioTickAtom, 1);
}
