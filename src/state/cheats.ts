import { atom } from 'jotai';

/**
 * Runtime cheat overrides. All atoms here are non-persisted — reload
 * returns to real derived state. Read the module docstring, not storage,
 * for intent: cheats are dev/testing aids, not save-state.
 *
 * Convention: cheat atoms hold `T | null`; null means "no override, use
 * the real derived value." Consumer atoms check and substitute.
 */

/** Luck value override. When non-null, replaces the upgrade-derived luck. */
export const cheatLuckAtom = atom<number | null>(null);

/**
 * Wild-chance override. When non-null, replaces whatever the wildChance
 * upgrade would produce. Value is the per-cell probability (0..1).
 */
export const cheatWildChanceAtom = atom<number | null>(null);

/** Convenience: any cheat currently active? Drives the "cheat active" badge. */
export const anyCheatActiveAtom = atom((get) => {
  return (
    get(cheatLuckAtom) !== null ||
    get(cheatWildChanceAtom) !== null
  );
});
