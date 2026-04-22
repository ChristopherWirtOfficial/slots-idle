import { Cell, SlotSymbol, symbolCell } from './types';
import { rollSymbol } from './grid';

// Per-reel duration bounds. Bumped from 1.1-2.2s — the faster range was
// landing cells in the wagon-wheel aliasing zone (~1 cell/frame).
export const DURATION_MIN_MS = 1600;
export const DURATION_MAX_MS = 2800;

// Near-miss bonus: when reels pre-land with a matching pattern, stretch
// the last reel's duration for dramatic effect.
export const NEAR_MISS_BONUS_MS = 900;

// How many cells scroll past during a spin.
export const DISTANCE_CELLS_MIN = 24;
export const DISTANCE_CELLS_MAX = 44;

export function rollDuration(
  rng: () => number = Math.random,
  nearMissBonus = 0,
): number {
  return DURATION_MIN_MS + rng() * (DURATION_MAX_MS - DURATION_MIN_MS) + nearMissBonus;
}

export function rollDistanceCells(rng: () => number = Math.random): number {
  return Math.floor(
    DISTANCE_CELLS_MIN + rng() * (DISTANCE_CELLS_MAX - DISTANCE_CELLS_MIN),
  );
}

/**
 * Fraction of the underlying quintic easeOut curve that the visible
 * animation actually uses. The asymptotic tail past this point is
 * truncated — without it, the reel spends the last ~30% of its
 * duration drifting imperceptibly into place while the audio/payout
 * events wait on the technical end-of-animation. With it, visible
 * motion persists right up to t=1 and the events fire in sync with
 * what the eye sees.
 *
 * Lower value = less tail = crisper landing. 0.55 keeps ~10px of
 * visible drift in the last 200ms so it still feels like a settle,
 * not a snap.
 */
const SETTLE_FRACTION = 0.55;

/** easeOut(SETTLE_FRACTION) in the base quintic, precomputed. */
const SETTLE_NORM = 1 - Math.pow(1 - SETTLE_FRACTION, 5);

/**
 * Ease-out quintic, truncated past SETTLE_FRACTION. Reaches 1 at t=1
 * with visible motion still present in the final frames.
 *
 *   f(t) = easeOut_quintic(t * SETTLE_FRACTION) / easeOut_quintic(SETTLE_FRACTION)
 */
export function easeOut(t: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const inv = 1 - t * SETTLE_FRACTION;
  return (1 - inv * inv * inv * inv * inv) / SETTLE_NORM;
}

/** Derivative of easeOut at t. Scales with SETTLE_FRACTION via chain rule. */
export function easeOutPrime(t: number): number {
  if (t >= 1 || t <= 0) return 0;
  const inv = 1 - t * SETTLE_FRACTION;
  return (SETTLE_FRACTION * 5 * inv * inv * inv * inv) / SETTLE_NORM;
}

/** Instantaneous spin velocity in cells-per-frame at 60fps. */
export function velocityCellsPerFrame(
  t: number,
  distanceCells: number,
  durationMs: number,
): number {
  const framesPerMs = 60 / 1000;
  return (easeOutPrime(t) * distanceCells / durationMs) / framesPerMs;
}

/**
 * Build the strip of cells a reel will scroll through.
 * Strip layout: [...prevWindow, ...random fill, ...resultWindow].
 * Window length comes from the caller (= machine.rowCount), so this
 * works for any vertical reel size.
 *
 * The random fill is symbols only — the visual blur during a spin
 * doesn't need to show wilds or other cell kinds. We roll with luck=0
 * here; filler is cosmetic and shouldn't consume the player's luck.
 */
export function buildStrip(
  prevWindow: Cell[],
  resultWindow: Cell[],
  distanceCells: number,
  symbols: SlotSymbol[],
  rng: () => number = Math.random,
): Cell[] {
  const rowCount = prevWindow.length;
  const strip: Cell[] = [...prevWindow];
  for (let i = rowCount; i < distanceCells; i++) {
    strip.push(symbolCell(rollSymbol(symbols, 0, rng)));
  }
  strip.push(...resultWindow);
  return strip;
}
