import { SimState } from './state';

/**
 * An Action is whatever the sim's policy/player combo can do at a
 * decision point. The scheduler handles the consequences.
 *
 * - `spin`: fire a pull. Requires chips >= bet; policy must check.
 * - `buy`: purchase an upgrade. Requires affordability; policy must check.
 * - `wait_ms`: do nothing for the given duration. Passive income still
 *   ticks during the wait. After the wait, the policy is re-asked.
 */
export type Action =
  | { type: 'spin' }
  | { type: 'buy'; upgradeId: string }
  | { type: 'wait_ms'; ms: number };

/**
 * A Policy decides which upgrades to buy. It's called whenever the
 * player has a "decision moment" — typically right after a spin
 * commits, or whenever chips change in a way that might unlock a
 * new purchase.
 *
 * Returns null if no upgrade should be bought right now.
 */
export type Policy = (state: SimState) => string | null;

/**
 * A PlayerModel defines pacing: how long between actions, whether
 * they use autospin, how decisive they are.
 *
 * `wantsAutospin` — does this archetype prefer to buy autospin and
 *   let it run, or do they like clicking manually?
 * `manualClickDelayMs(rng)` — if not using autospin, how long after
 *   a spin commits do they click Pull again?
 */
export interface PlayerModel {
  id: string;
  /**
   * Does this player adopt autospin as soon as possible? If true and
   * autospin is unlocked, they never manually pull (they just let it
   * run). If false, they always pull manually.
   */
  prefersAutospin: boolean;
  /** Random delay between a spin committing and this player clicking. */
  manualClickDelayMs: (rng01: () => number) => number;
  /**
   * Optional: the player sometimes walks away. Returns true with some
   * probability; sim then waits `awayDurationMs()` before resuming.
   * Default: never walks away.
   */
  takesBreak?: (rng01: () => number) => boolean;
  awayDurationMs?: (rng01: () => number) => number;
}

/**
 * An Archetype bundles a player model with a policy. This is our unit
 * of "simulated user" — we run batches of (archetype × seed).
 *
 * The player model and policy are still separately defined so later
 * grid sweeps across combinations are easy, but by default we run
 * coherent pairings.
 */
export interface Archetype {
  id: string;
  label: string;
  description: string;
  player: PlayerModel;
  policy: Policy;
}
