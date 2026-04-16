import { playNoise, playNote, scheduleNote } from './engine';

/** Pull the lever: short whoosh + low motor note. */
export function sfxSpinStart(): void {
  playNoise(0.22, { filter: 'bandpass', freq: 500, q: 1.5, peak: 0.12 });
  playNote(160, 0.18, { type: 'sawtooth', peak: 0.06 });
}

/** A reel lands: thump + brief click. */
export function sfxReelLand(): void {
  playNoise(0.04, { filter: 'lowpass', freq: 900, peak: 0.18 });
  playNote(180, 0.09, { type: 'triangle', peak: 0.22 });
}

/** Small win (2-match): minor third rising. */
export function sfxSmallWin(): void {
  playNote(523.25, 0.12, { type: 'sine', peak: 0.15 }); // C5
  scheduleNote(80, 622.25, 0.14, { type: 'sine', peak: 0.15 }); // Eb5
}

/** Big win (3-match): ascending major arpeggio with a shimmer. */
export function sfxBigWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => scheduleNote(i * 90, f, 0.2, { type: 'triangle', peak: 0.2 }));
  scheduleNote(360, 1318.51, 0.3, { type: 'sine', peak: 0.12 }); // E6 tail
}

/** Jackpot (triple-7): glissando arpeggio + noise cheer + sub-bass. */
export function sfxJackpot(): void {
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1568.0, 1975.53];
  notes.forEach((f, i) => {
    scheduleNote(i * 70, f, 0.22, { type: 'triangle', peak: 0.22 });
    scheduleNote(i * 70, f * 2, 0.18, { type: 'sine', peak: 0.09 }); // shimmering octave
  });
  // Sub-bass hit at start
  playNote(65.4, 0.5, { type: 'sine', peak: 0.3, attack: 0.01, release: 0.5 });
  // Cymbal-ish noise swell
  window.setTimeout(() => playNoise(0.7, { filter: 'highpass', freq: 5000, peak: 0.08 }), 180);
}

/** Buy an upgrade: coin click + two-note cha-ching. */
export function sfxUpgrade(): void {
  playNoise(0.025, { filter: 'highpass', freq: 4500, peak: 0.14 });
  playNote(880, 0.09, { type: 'sine', peak: 0.15 });
  scheduleNote(55, 1318.5, 0.12, { type: 'sine', peak: 0.15 });
}

/** Click when trying something you can't afford. Distinct: descending minor. */
export function sfxDenied(): void {
  playNote(300, 0.1, { type: 'square', peak: 0.08 });
  scheduleNote(60, 240, 0.12, { type: 'square', peak: 0.08 });
}
