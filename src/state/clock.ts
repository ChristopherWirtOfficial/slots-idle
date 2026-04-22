import { atom } from 'jotai';

/**
 * The game clock, split into three layers so catch-up / fast-forward
 * composes cleanly with real time.
 *
 *   realNowAtom      — fact: when did the tick loop last sample
 *                      performance.now(). Always tracks wall-clock,
 *                      regardless of catch-up mode.
 *   virtualNowAtom   — fact (null most of the time): if non-null, the
 *                      catch-up driver is in charge of the clock and
 *                      this is its current virtual instant.
 *   effectiveNowAtom — derivation: virtual if present, else real.
 *                      Every consumer of "what time is it for game
 *                      purposes" reads through this.
 *
 * Normal play: virtualNowAtom stays null; effectiveNow === realNow,
 * which the tick loop bumps every tick.
 *
 * Catch-up: the driver writes virtualNowAtom to a past instant, pumps
 * tick atoms (they read effectiveNow and see virtual time, not real),
 * advances virtualNowAtom in steps, and finally sets it back to null
 * when virtual time catches up to real. Zero changes required in
 * consumers of effectiveNow.
 *
 * Why not sample performance.now() inline in the derived atom? Atom
 * reads must be stable within a render — a getter that calls
 * performance.now() would give inconsistent answers across reads in
 * the same tick. The tick loop's "sample once, write" discipline keeps
 * every consumer seeing the same time for the same tick.
 */
export const realNowAtom = atom(0);

export const virtualNowAtom = atom<number | null>(null);

export const effectiveNowAtom = atom<number>((get) => {
  const v = get(virtualNowAtom);
  return v !== null ? v : get(realNowAtom);
});
