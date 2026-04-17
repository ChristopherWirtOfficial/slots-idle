import { PlayerModel } from '../types';

/** Fast manual clicker — always pulls, never waits long between spins. */
export const fastClicker: PlayerModel = {
  id: 'fast-clicker',
  prefersAutospin: false,
  manualClickDelayMs: (r) => 500 + r() * 1500, // 500-2000ms
};

/** Slow manual clicker — deliberate, pauses between spins. */
export const slowClicker: PlayerModel = {
  id: 'slow-clicker',
  prefersAutospin: false,
  manualClickDelayMs: (r) => 2500 + r() * 2500, // 2.5-5s
};

/** Autospin-first — will buy autospin ASAP and let it run. */
export const autospinner: PlayerModel = {
  id: 'autospinner',
  prefersAutospin: true,
  // Fallback manual timing if autospin isn't unlocked yet
  manualClickDelayMs: (r) => 1000 + r() * 1000,
};

/**
 * Idle-heavy — plays in short bursts, takes breaks. Represents someone
 * who opens the tab, does a flurry of spins, then walks away for a
 * few minutes. During break time, passive income still accrues.
 */
export const idleHeavy: PlayerModel = {
  id: 'idle-heavy',
  prefersAutospin: true,
  manualClickDelayMs: (r) => 1500 + r() * 1500,
  // 10% chance after each spin that they walk away
  takesBreak: (r) => r() < 0.1,
  // Breaks are 2-10 minutes
  awayDurationMs: (r) => 120_000 + r() * 480_000,
};
