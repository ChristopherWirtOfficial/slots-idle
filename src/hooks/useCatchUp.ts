import Decimal from 'break_infinity.js';
import { useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';
import { tick } from '../tick/loop';
import { TICK_LENGTH } from '../tick/knobs';
import {
  caughtUpAtom,
  realNowAtom,
  virtualNowAtom,
} from '../state/clock';
import { lastTickAtAtom } from '../state/lastTickAt';
import {
  chipsAtom,
  jackpotsAtom,
  spinsTotalAtom,
} from '../state/economy';
import { offlineReturnAtom } from '../state/offlineReturn';

/**
 * Maximum wall-clock time catch-up will replay. Anything beyond this
 * is forfeit. Starts at 1 hour; will become upgrade-driven later.
 */
const OFFLINE_CAP_MS = 60 * 60 * 1000;

/**
 * Below this elapsed time, catch-up does nothing beyond flipping
 * caughtUpAtom true. Tiny gaps (closing and reopening a tab, tab
 * suspend for a few seconds) don't deserve a summary modal.
 */
const NEGLIGIBLE_MS = 5_000;

/** Virtual ticks processed per async chunk before yielding. */
const CHUNK_SIZE = 240; // 240 × 16ms = ~4s of virtual time per chunk

/**
 * Drives the one-time catch-up step at session start.
 *
 *  - Reads lastTickAtAtom (persisted across sessions).
 *  - Computes elapsed wall-clock since; caps at OFFLINE_CAP_MS.
 *  - If negligible, flips caughtUp true immediately; done.
 *  - Otherwise, sets virtualNowAtom to the past, pumps tick() in
 *    async chunks advancing virtual time by TICK_LENGTH each step,
 *    yielding to the browser between chunks so UI paints and input
 *    lands.
 *  - When virtual catches up to wall-clock, clears virtualNow, flips
 *    caughtUp true, and writes offlineReturnAtom with the deltas.
 *
 * The tick functors (autospin, animation, passive income) read
 * effectiveNow and see virtual time, so replay is just the game
 * running fast. No parallel sim.
 */
export function useCatchUp(): void {
  const store = useStore();
  const setCaughtUp = useSetAtom(caughtUpAtom);
  const setOfflineReturn = useSetAtom(offlineReturnAtom);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const storedLastTick = store.get(lastTickAtAtom);

      // Seed realNowAtom so early reads of effectiveNow get a sane
      // value before the first live tick writes it.
      store.set(realNowAtom, performance.now());

      const finish = () => {
        store.set(lastTickAtAtom, Date.now());
        setCaughtUp(true);
        startPersistenceLoop(() => {
          store.set(lastTickAtAtom, Date.now());
        });
      };

      // No prior session → instant ready.
      if (storedLastTick === null) {
        finish();
        return;
      }

      // lastTickAt is stored as Date.now() (wall-clock epoch ms);
      // performance.now() doesn't persist across page loads.
      // Guard against clock moving backwards (user adjusted system
      // clock, DST shift in weird direction): treat as negligible.
      const elapsedWall = Date.now() - storedLastTick;
      if (elapsedWall < NEGLIGIBLE_MS) {
        finish();
        return;
      }

      const effectiveElapsed = Math.min(elapsedWall, OFFLINE_CAP_MS);

      // Snapshot pre-replay state for the summary.
      const chipsBefore = store.get(chipsAtom);
      const spinsBefore = store.get(spinsTotalAtom);
      const jackpotsBefore = store.get(jackpotsAtom);

      // Virtual time runs in performance.now() space (matches every
      // other in-session time atom). We pick a virtualStart such that
      // it ends exactly at the current performance.now() after
      // effectiveElapsed worth of ticks. "End at now" keeps the
      // hand-off to real time seamless.
      const virtualEnd = performance.now();
      let virtualT = virtualEnd - effectiveElapsed;
      store.set(virtualNowAtom, virtualT);

      while (virtualT < virtualEnd) {
        if (cancelled) {
          store.set(virtualNowAtom, null);
          return;
        }
        for (let i = 0; i < CHUNK_SIZE && virtualT < virtualEnd; i++) {
          virtualT = Math.min(virtualEnd, virtualT + TICK_LENGTH);
          store.set(virtualNowAtom, virtualT);
          tick();
        }
        // Yield to the browser — paints happen, input processes.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      }

      // Release virtual mode; real clock takes over.
      store.set(virtualNowAtom, null);

      const chipsAfter = store.get(chipsAtom);
      const spinsAfter = store.get(spinsTotalAtom);
      const jackpotsAfter = store.get(jackpotsAtom);

      setOfflineReturn({
        elapsedMs: effectiveElapsed,
        chipsDelta: chipsAfter.sub(chipsBefore) as Decimal,
        spinsDelta: spinsAfter - spinsBefore,
        jackpotsDelta: jackpotsAfter - jackpotsBefore,
      });

      finish();
    }

    run();

    return () => {
      cancelled = true;
    };
    // Once — on mount only. Subsequent renders don't re-run catch-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

let persistenceStarted = false;
function startPersistenceLoop(writeNow: () => void): void {
  if (persistenceStarted) return;
  persistenceStarted = true;

  const INTERVAL_MS = 5000;
  setInterval(writeNow, INTERVAL_MS);

  // Cover the common case: user switches tabs / closes. Fires before
  // unload in modern browsers.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeNow();
  });

  // Best-effort on actual close.
  window.addEventListener('beforeunload', writeNow);
}
