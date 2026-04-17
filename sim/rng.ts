/**
 * Seeded RNG. Uses mulberry32 — a tiny, fast PRNG with acceptable
 * statistical properties for Monte Carlo sim work. Not cryptographic.
 *
 * The sim needs reproducibility: rerunning with the same seed must
 * produce the exact same trajectory, so we can debug outliers, compare
 * policy changes under identical luck, etc.
 */
export class RNG {
  private state: number;

  constructor(seed: number) {
    // mulberry32 expects a nonzero 32-bit unsigned seed
    this.state = (seed >>> 0) || 1;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [lo, hi) (hi exclusive). */
  nextInt(lo: number, hi: number): number {
    return Math.floor(lo + this.next() * (hi - lo));
  }

  /** Returns a float in [lo, hi]. */
  nextFloat(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }
}
