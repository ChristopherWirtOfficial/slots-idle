import Decimal from 'break_infinity.js';
import { useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';
import { tick } from '../tick/loop';
import { TICK_LENGTH } from '../tick/knobs';
import {
  catchUpRangeAtom,
  caughtUpAtom,
  realNowAtom,
  virtualNowAtom,
} from '../state/clock';
import {
  chipsAtom,
  jackpotsAtom,
  spinsTotalAtom,
} from '../state/economy';
import { offlineReturnAtom } from '../state/offlineReturn';

/* ────────────────────────────────────────────────────────────────
 * Persisted last-tick timestamp. Private to this module — nothing
 * else in the app needs to subscribe reactively, so we skip the atom
 * machinery and go straight to localStorage: synchronous reads,
 * synchronous writes, no surprises at boot.
 *
 * Exported: writeLastTickAt (used by the offline-sim cheat to
 * backdate the value before reloading).
 * ──────────────────────────────────────────────────────────────── */

const LAST_TICK_KEY = 'lucky-idle-slots:v1:lastTickAt';

function readLastTickAt(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LAST_TICK_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLastTickAt(t: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_TICK_KEY, JSON.stringify(t));
}

/* ──────────────────────────────────────────────────────────────── */

/** Maximum wall-clock time catch-up will replay. Anything beyond is forfeit. */
const OFFLINE_CAP_MS = 60 * 60 * 1000;

/**
 * Below this elapsed time, catch-up skips the replay. Tiny gaps
 * (tab suspend, quick reload) don't deserve a ceremonial modal.
 */
const NEGLIGIBLE_MS = 5_000;

/** Virtual ticks processed per async chunk before yielding. */
const CHUNK_SIZE = 240;

/**
 * Drives the one-time catch-up step at session start.
 *
 *   - Reads the persisted last-tick timestamp.
 *   - Computes elapsed wall-clock since; caps at OFFLINE_CAP_MS.
 *   - Negligible gap → flip caughtUp true immediately, done.
 *   - Otherwise:
 *       • write catchUpRangeAtom so the modal can render progress.
 *       • set virtualNowAtom to the past, pump tick() in async
 *         chunks advancing virtual time each step.
 *       • yield to the browser between chunks so UI animates and
 *         input lands.
 *   - When virtual catches up to wall-clock, write offlineReturnAtom
 *     with the deltas, clear range + virtual override, flip caughtUp.
 *
 * Tick functors read effectiveNow, so replay is just the game running
 * fast. No parallel simulator.
 */
export function useCatchUp(): void {
  const store = useStore();
  const setCaughtUp = useSetAtom(caughtUpAtom);
  const setOfflineReturn = useSetAtom(offlineReturnAtom);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const storedLastTick = readLastTickAt();

      store.set(realNowAtom, performance.now());

      const finish = () => {
        writeLastTickAt(Date.now());
        setCaughtUp(true);
        startPersistenceLoop(() => writeLastTickAt(Date.now()));
      };

      if (storedLastTick === null) {
        finish();
        return;
      }

      // Date.now() is wall-clock epoch ms; stable across sessions
      // unlike performance.now(). Guard against clock-going-backwards
      // (user adjusted system clock, DST weirdness) by treating
      // anything under NEGLIGIBLE_MS as instant-ready.
      const elapsedWall = Date.now() - storedLastTick;
      if (elapsedWall < NEGLIGIBLE_MS) {
        finish();
        return;
      }

      const effectiveElapsed = Math.min(elapsedWall, OFFLINE_CAP_MS);

      const chipsBefore = store.get(chipsAtom);
      const spinsBefore = store.get(spinsTotalAtom);
      const jackpotsBefore = store.get(jackpotsAtom);

      // Virtual time runs in performance.now() space to match the
      // other in-session time atoms. Window ends at right-now so the
      // hand-off to live time has zero seam.
      const virtualEnd = performance.now();
      const virtualStart = virtualEnd - effectiveElapsed;
      let virtualT = virtualStart;
      store.set(catchUpRangeAtom, { startMs: virtualStart, endMs: virtualEnd });
      store.set(virtualNowAtom, virtualT);

      while (virtualT < virtualEnd) {
        if (cancelled) {
          store.set(virtualNowAtom, null);
          store.set(catchUpRangeAtom, null);
          return;
        }
        for (let i = 0; i < CHUNK_SIZE && virtualT < virtualEnd; i++) {
          virtualT = Math.min(virtualEnd, virtualT + TICK_LENGTH);
          store.set(virtualNowAtom, virtualT);
          tick();
        }
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

      store.set(catchUpRangeAtom, null);
      finish();
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ──────────────────────────────────────────────────────────────── */

let persistenceStarted = false;
let persistenceDisabled = false;

/**
 * Dev-cheat escape hatch: callers that backdate lastTickAt before
 * reloading need the persistence writer's beforeunload handler to
 * NOT clobber the backdated value. Cheat calls this before writing
 * + reloading.
 */
export function disablePersistence(): void {
  persistenceDisabled = true;
}

function startPersistenceLoop(writeNow: () => void): void {
  if (persistenceStarted) return;
  persistenceStarted = true;

  const guardedWrite = () => {
    if (persistenceDisabled) return;
    writeNow();
  };

  setInterval(guardedWrite, 5000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') guardedWrite();
  });

  window.addEventListener('beforeunload', guardedWrite);
}
