import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { mutedAtom, volumeAtom } from '../state/audio';
import { setMasterGain, sliderToGain } from '../audio/engine';

/**
 * Pushes the effective volume into the audio engine whenever the atoms change.
 * Does nothing if the engine isn't initialized yet — engine gets its own
 * default gain at init and the first atom change will apply here.
 */
export function useMasterVolume(): void {
  const volume = useAtomValue(volumeAtom);
  const muted = useAtomValue(mutedAtom);
  useEffect(() => {
    setMasterGain(sliderToGain(muted ? 0 : volume));
  }, [volume, muted]);
}
