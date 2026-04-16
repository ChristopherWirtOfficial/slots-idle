import { SlotSymbol, rollSymbol } from './symbols';

// Per-reel duration bounds.
export const DURATION_MIN_MS = 1100;
export const DURATION_MAX_MS = 2200;

// When reels 0 and 1 match, reel 2 gets a longer roll — dramatic pause on
// possible jackpot. The result is already determined; this is pure theatre.
export const NEAR_MISS_BONUS_MS = 700;

// How many cells scroll past during a spin. Keep it generous so the reel
// feels like it's genuinely spinning, not flicking to the answer.
export const DISTANCE_CELLS_MIN = 22;
export const DISTANCE_CELLS_MAX = 42;

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

// Ease-out quartic: fast start, smooth deceleration, no bounce.
// Bounces on slot reels tend to look like bugs, not physics.
export function easeOut(t: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const inv = 1 - t;
  return 1 - inv * inv * inv * inv;
}

/**
 * Build the strip of symbols the reel will scroll through.
 * strip[0] is the previously visible symbol (seamless start).
 * strip[distanceCells] is the result (pinned landing spot).
 * Everything between is randomly streamed — this is the "laying track" layer,
 * and future upgrades can inject/reweight these without touching the result.
 */
export function buildStrip(
  prevSymbol: SlotSymbol,
  resultSymbol: SlotSymbol,
  distanceCells: number,
  rng: () => number = Math.random,
): SlotSymbol[] {
  const strip: SlotSymbol[] = [prevSymbol];
  for (let i = 1; i < distanceCells; i++) {
    strip.push(rollSymbol(rng));
  }
  strip.push(resultSymbol);
  return strip;
}
