// Web Audio engine: AudioContext + master gain + synthesis primitives.
// Lazy-initialized on first user gesture (browser autoplay policy).

interface AudioEngine {
  ctx: AudioContext;
  master: GainNode;
}

let engine: AudioEngine | null = null;

/**
 * The desired master gain, tracked outside the engine so it survives
 * before the engine exists. setMasterGain writes here regardless of
 * engine state; ensureAudio reads it when creating the master node.
 * Default of 0.5 only applies if no one has set a value yet.
 */
let currentTargetGain = 0.5;

export function ensureAudio(): AudioEngine | null {
  if (engine) return engine;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = currentTargetGain;
    master.connect(ctx.destination);
    engine = { ctx, master };
    return engine;
  } catch {
    return null;
  }
}

export function getEngine(): AudioEngine | null {
  return engine;
}

/**
 * Slider (0-1 linear) → gain (0-1). Exponential curve gives useful
 * resolution across the whole slider range instead of cramming the
 * perceptible change into the bottom 5%.
 *   - slider 1.00 → 0 dB (gain 1.0)
 *   - slider 0.75 → -10 dB (gain 0.316)
 *   - slider 0.50 → -20 dB (gain 0.1)
 *   - slider 0.25 → -30 dB (gain 0.032)
 *   - slider 0.00 → silent (hard zero)
 */
export function sliderToGain(s: number): number {
  if (s <= 0.001) return 0;
  if (s >= 1) return 1;
  return Math.pow(10, (s - 1) * 2);
}

export function setMasterGain(gain: number): void {
  // Always record the target — useMasterVolume may fire before the
  // engine is alive, and we need that value at engine-init time.
  currentTargetGain = gain;
  if (!engine) return;
  const t = engine.ctx.currentTime;
  // Short ramp to avoid clicks when moving the slider
  engine.master.gain.cancelScheduledValues(t);
  engine.master.gain.setTargetAtTime(gain, t, 0.015);
}

// -------- Synthesis primitives --------

interface NoteOpts {
  type?: OscillatorType;
  attack?: number;
  release?: number;
  peak?: number;
  detune?: number;
}

/** Play a single oscillator note with an ADR envelope. */
export function playNote(freq: number, duration = 0.15, opts: NoteOpts = {}): void {
  const e = engine;
  if (!e) return;
  const { type = 'sine', attack = 0.005, release = duration, peak = 0.3, detune = 0 } = opts;
  const now = e.ctx.currentTime;
  const osc = e.ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const env = e.ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(peak, now + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
  osc.connect(env).connect(e.master);
  osc.start(now);
  osc.stop(now + attack + release + 0.02);
}

interface NoiseOpts {
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  peak?: number;
  attack?: number;
}

/** Play a filtered noise burst with decay envelope. */
export function playNoise(duration = 0.1, opts: NoiseOpts = {}): void {
  const e = engine;
  if (!e) return;
  const { filter = 'highpass', freq = 2000, q = 1, peak = 0.2, attack = 0.002 } = opts;
  const now = e.ctx.currentTime;

  const bufferSize = Math.max(1, Math.floor(e.ctx.sampleRate * duration));
  const buffer = e.ctx.createBuffer(1, bufferSize, e.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = e.ctx.createBufferSource();
  src.buffer = buffer;

  const filt = e.ctx.createBiquadFilter();
  filt.type = filter;
  filt.frequency.value = freq;
  filt.Q.value = q;

  const env = e.ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(peak, now + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filt).connect(env).connect(e.master);
  src.start(now);
  src.stop(now + duration + 0.02);
}

/** Schedule a note at an offset from now. */
export function scheduleNote(offsetMs: number, freq: number, duration?: number, opts?: NoteOpts): void {
  window.setTimeout(() => playNote(freq, duration, opts), offsetMs);
}
