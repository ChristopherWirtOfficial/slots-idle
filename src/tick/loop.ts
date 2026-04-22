import { MAX_QUEUED_TICKS, TICK_LENGTH } from './knobs';
import { getDefaultStore } from 'jotai';
import { realNowAtom } from '../state/clock';

export interface TickFunctor {
  readonly id: string;
  readonly functor: (tickNumber: number) => void;
  readonly frequency: number;
}

let tickFunctors: Array<TickFunctor> = [];
const functorsToSkipMap: Record<string, number> = {};
let lastTickTime = 0;
let leftoverTickTime = 0;
let frameCount = 0;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function registerFunctor(f: TickFunctor): () => void {
  // Replace by id — re-registration is a no-op if frequency matches,
  // and preserves the skip counter either way.
  const existing = tickFunctors.findIndex((x) => x.id === f.id);
  if (existing >= 0) {
    tickFunctors[existing] = f;
  } else {
    tickFunctors.push(f);
  }
  if (functorsToSkipMap[f.id] === undefined) {
    functorsToSkipMap[f.id] = 0;
  }

  return () => {
    tickFunctors = tickFunctors.filter((x) => x.id !== f.id);
    delete functorsToSkipMap[f.id];
  };
}

function tick(): void {
  const toRun = tickFunctors.filter((f) => functorsToSkipMap[f.id] === 0);

  for (const f of tickFunctors) {
    functorsToSkipMap[f.id] =
      functorsToSkipMap[f.id] === 0 ? f.frequency - 1 : functorsToSkipMap[f.id] - 1;
  }

  for (const f of toRun) {
    try {
      f.functor(frameCount);
    } catch (err) {
      console.error('Tick functor error:', err);
    }
  }
}

function pulse(): void {
  frameCount++;

  const currentTickTime = now();
  const elapsed = currentTickTime - lastTickTime;

  if (elapsed < 0) {
    lastTickTime = 0;
    return;
  }

  const totalRequiredTickTime = elapsed + leftoverTickTime;
  const ticksQueued = Math.min(
    MAX_QUEUED_TICKS,
    Math.floor(totalRequiredTickTime / TICK_LENGTH),
  );
  leftoverTickTime = totalRequiredTickTime % TICK_LENGTH;
  lastTickTime = currentTickTime;

  for (let i = 0; i < ticksQueued; i++) {
    tick();
  }
}

let started = false;
function deferPulse(): void {
  pulse();
  setTimeout(deferPulse, TICK_LENGTH);
}

export function startTickLoop(): void {
  if (started) return;
  started = true;

  // First tick functor: sample real wall-clock into realNowAtom. Runs
  // before all other functors (first registered, first in iteration)
  // so every other tick this frame reads a fresh clock through
  // effectiveNowAtom. App-lifetime registration — never unregisters.
  const store = getDefaultStore();
  registerFunctor({
    id: '__clock',
    frequency: 1,
    functor: () => {
      store.set(realNowAtom, now());
    },
  });

  lastTickTime = now();
  setTimeout(deferPulse, TICK_LENGTH);
}
