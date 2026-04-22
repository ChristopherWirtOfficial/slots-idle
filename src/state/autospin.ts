import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { GLOBAL_UPGRADES } from '../engine/upgrades';
import { levelsAtom } from './levels';
import { canSpinAtom } from './canSpin';
import { frameTimeAtom } from './reels';
import { lastCommitAtom } from './session';
import { spinActionAtom } from './actions/spin';

/**
 * Autospin-specific state. Grouped here because it's a self-contained
 * feature with a small set of related atoms.
 *
 * Pipeline:
 *   levels.autospin → autospinDelayMsAtom (how long to wait between spins)
 *                   → autospinUnlockedAtom (has the user bought level 1+?)
 *   user toggle    → autospinActiveAtom (session pref: should it be running?)
 *   both combined  → autospinEffectiveAtom (actually auto-spinning right now?)
 *   + runtime      → autospinWaitingAtom (currently in the post-settle delay?)
 *
 * Firing: autospinTickAtom runs every tick, fires the spin when the
 * configured delay has elapsed since the last commit. Derivation:
 * "is it time to spin?" is purely a function of current state, not
 * a scheduled side-effect — which means fast-forward (offline
 * catch-up) works by just running the tick loop faster.
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

/**
 * Is autospin currently in its post-settle waiting phase?
 *
 * True iff effective AND reels are settled AND no pending payout AND
 * the player can afford the next spin. Transitions false whenever a
 * spin is in flight, the toggle is off, chips are insufficient, etc.
 *
 * Consumers read this to agree on what "waiting" means.
 */
export const autospinWaitingAtom = atom((get) => {
  return get(autospinEffectiveAtom) && get(canSpinAtom);
});

/**
 * Tick action: fires a spin if autospin is waiting AND the configured
 * delay has elapsed since the last commit. Runs every tick (cheap —
 * all the checks are atom reads, guarded early).
 *
 * "Elapsed since last commit" uses frameTimeAtom and lastCommit.committedAt,
 * so fast-forwarding frame time (e.g., offline catch-up) fast-forwards
 * autospin firing too. If there's never been a commit (fresh install,
 * post-reset), fires immediately — the player has nothing to wait on.
 */
export const autospinTickAtom = atom(null, (get, set) => {
  if (!get(autospinWaitingAtom)) return;
  const commit = get(lastCommitAtom);
  const delayMs = get(autospinDelayMsAtom);
  if (commit !== null) {
    const elapsed = get(frameTimeAtom) - commit.committedAt;
    if (elapsed < delayMs) return;
  }
  set(spinActionAtom);
});
