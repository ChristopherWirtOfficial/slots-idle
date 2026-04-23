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

/**
 * Has the game caught up to wall-clock since it was loaded? Default
 * false — we start every session behind until the catch-up routine
 * runs. Flipped true either instantly (no meaningful offline time) or
 * after virtual-time replay completes.
 *
 * Tick functors are gated on this: nothing fires until it's true. The
 * setTimeout pulse keeps running either way, but tick() no-ops while
 * caughtUp is false. Catch-up drives ticks manually by calling tick()
 * directly, bypassing the gate (it IS the catch-up process).
 */
export const caughtUpAtom = atom(false);

/**
 * Fact-of-record for an in-flight catch-up replay: the virtual-time
 * window being replayed. `startMs` is where virtualNow began, `endMs`
 * is where it's headed. Null when no replay is active.
 *
 * The modal derives progress from this + virtualNowAtom — it doesn't
 * need its own progress atom, since progress is a pure function of
 * "how far has the clock moved through the range."
 */
export interface CatchUpRange {
  readonly startMs: number;
  readonly endMs: number;
}
export const catchUpRangeAtom = atom<CatchUpRange | null>(null);
