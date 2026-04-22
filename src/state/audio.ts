import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ensureAudio, setMasterGain, sliderToGain } from '../audio/engine';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

/**
 * Persisted state. Read these for UI. WRITE through the action atoms
 * below so the engine gain stays synchronized.
 */
export const volumeAtom = atomWithStorage<number>(KEY('volume'), 0.6);
export const mutedAtom = atomWithStorage<boolean>(KEY('muted'), false);

/** Effective gain: 0 when muted, else the slider's exponential mapping. */
function effectiveGain(volume: number, muted: boolean): number {
  return sliderToGain(muted ? 0 : volume);
}

/**
 * Call from any user-gesture handler that's about to make a sound.
 * Lazy-initializes the audio engine with the correct initial gain
 * derived from current state — so the first sound respects muted/volume
 * settings loaded from storage. No-op once the engine is alive.
 */
export const ensureAudioReadyAtom = atom(null, (get) => {
  ensureAudio(effectiveGain(get(volumeAtom), get(mutedAtom)));
});

export const setMutedAtom = atom(null, (get, set, muted: boolean) => {
  set(mutedAtom, muted);
  setMasterGain(effectiveGain(get(volumeAtom), muted));
});

export const setVolumeAtom = atom(null, (get, set, volume: number) => {
  set(volumeAtom, volume);
  const muted = get(mutedAtom);
  if (muted && volume > 0) {
    set(mutedAtom, false);
    setMasterGain(effectiveGain(volume, false));
  } else {
    setMasterGain(effectiveGain(volume, muted));
  }
});
