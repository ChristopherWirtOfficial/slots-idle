import { Policy } from '../types';
import { affordableUpgrades } from '../state';

/**
 * Uniformly random affordable upgrade. Deterministic relative to a
 * policy-local LCG seeded per state — we use a simple hash of
 * spinCount + chips.toString() so results are reproducible across runs
 * with the same trajectory.
 *
 * The floor archetype: "does the game still work if someone plays
 * nonsensically?" Good games stay playable under random purchases.
 */
export const randomAffordable: Policy = (state) => {
  const options = affordableUpgrades(state);
  if (options.length === 0) return null;

  // Simple deterministic "random" based on state — avoids introducing
  // a separate RNG stream while keeping reproducibility.
  const hash = state.spinCount * 2654435761 + state.chips.mantissa * 1000;
  const idx = Math.abs(Math.floor(hash)) % options.length;
  return options[idx];
};
