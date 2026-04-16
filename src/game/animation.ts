import { SlotSymbol, rollSymbol } from './symbols';

// Per-reel duration bounds. Bumped from 1.1-2.2s — the faster range was
// landing cells in the wagon-wheel aliasing zone (~1 cell/frame).
export const DURATION_MIN_MS = 1600;
export const DURATION_MAX_MS = 2800;

// When reels 0 and 1 match, reel 2 gets a longer roll — dramatic pause on
// possible jackpot. The result is already determined; this is pure theatre.
export const NEAR_MISS_BONUS_MS = 900;

// How many cells scroll past during a spin. Keep it generous so the reel
// feels like it's genuinely spinning, not flicking to the answer.
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

// Ease-out quintic: f(t) = 1 - (1-t)^5. Derivative at 0 is 5, giving a
// punchier initial launch and a gentler glide into the landing than quartic.
export function easeOut(t: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const inv = 1 - t;
  return 1 - inv * inv * inv * inv * inv;
}

/**
 * Derivative of easeOut at t, in "eased-fraction per unit t". Scale by
 * (distance / duration) to get cells-per-ms; scale further for cells-per-frame.
 */
export function easeOutPrime(t: number): number {
  if (t >= 1 || t <= 0) return 0;
  const inv = 1 - t;
  return 5 * inv * inv * inv * inv;
}

/**
 * Instantaneous spin velocity in cells-per-frame at 60fps.
 * Used to scale motion blur — blur = f(velocity) hides wagon-wheel aliasing
 * as the reel decelerates through the eye's tracking threshold.
 */
export function velocityCellsPerFrame(
  t: number,
  distanceCells: number,
  durationMs: number,
): number {
  const framesPerMs = 60 / 1000;
  return (easeOutPrime(t) * distanceCells / durationMs) / framesPerMs;
}

/**
 * Build the strip of symbols the reel will scroll through.
 * The first 3 cells are the previously visible window (seamless start).
 * The last 3 cells (at indices distanceCells..distanceCells+2) are the
 * result — the window visible when the reel stops.
 * Random symbols fill the middle.
 */
export function buildStrip(
  prevWindow: [SlotSymbol, SlotSymbol, SlotSymbol],
  resultWindow: [SlotSymbol, SlotSymbol, SlotSymbol],
  distanceCells: number,
  rng: () => number = Math.random,
): SlotSymbol[] {
  const strip: SlotSymbol[] = [prevWindow[0], prevWindow[1], prevWindow[2]];
  for (let i = 3; i < distanceCells; i++) {
    strip.push(rollSymbol(rng));
  }
  strip.push(resultWindow[0], resultWindow[1], resultWindow[2]);
  return strip;
}
