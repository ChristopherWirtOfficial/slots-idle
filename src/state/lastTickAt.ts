import { atomWithStorage } from 'jotai/utils';

/**
 * Wall-clock timestamp of the most recent tick processed during live
 * play. Written periodically (throttled by the persisted-tick functor
 * in bootCatchUp.ts) and on hidden-tab events. On next mount, the
 * catch-up driver reads this to compute how much real-world time
 * elapsed while the game was closed, and fast-forwards virtual time
 * through that interval.
 *
 * null on fresh install (never been ticked) — the catch-up driver
 * treats null as "no prior session, nothing to catch up from."
 */
export const lastTickAtAtom = atomWithStorage<number | null>(
  'lucky-idle-slots:v1:lastTickAt',
  null,
);
