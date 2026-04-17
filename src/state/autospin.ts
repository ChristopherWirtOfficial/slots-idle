import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { GLOBAL_UPGRADES } from '../engine/upgrades';
import { levelsAtom } from './levels';

/**
 * Autospin-specific state. Grouped here because it's a self-contained
 * feature with a small set of related atoms.
 *
 * Pipeline:
 *   levels.autospin → autospinDelayMsAtom (how long to wait between spins)
 *                   → autospinUnlockedAtom (has the user bought level 1+?)
 *   user toggle    → autospinActiveAtom (session pref: should it be running?)
 *   both combined  → autospinEffectiveAtom (actually auto-spinning right now?)
 */

/** Pause in ms between a settled reel and the next auto-triggered pull. */
export const autospinDelayMsAtom = atom((get) => {
  const u = GLOBAL_UPGRADES.find((x) => x.id === 'autospin');
  if (!u || !u.effect) return 0;
  return u.effect(get(levelsAtom).autospin ?? 0);
});

/** Has the user purchased at least level 1 of autospin? */
export const autospinUnlockedAtom = atom((get) => {
  return (get(levelsAtom).autospin ?? 0) > 0;
});

/**
 * User preference: "I want autospin running right now."
 * Persisted across reloads — if you turn it off, it stays off next session.
 * Default: on (the user paid specifically to enable it, so default-on means
 * the purchase takes effect immediately).
 */
export const autospinActiveAtom = atomWithStorage<boolean>(
  'lucky-idle-slots:v1:autospinActive',
  true,
);

/** Autospin is currently active iff it's both unlocked and toggled on. */
export const autospinEffectiveAtom = atom((get) => {
  return get(autospinUnlockedAtom) && get(autospinActiveAtom);
});
