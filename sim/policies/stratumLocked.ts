import { Policy } from '../types';
import { SimState, canBuy } from '../state';
import { UPGRADES } from '../gameData';

/**
 * Follow a fixed priority list: buy the highest-priority affordable
 * upgrade. Simulates a player following a guide or a strong intuition
 * about optimal ordering.
 *
 * The order below is a plausible guide — tune as we learn more:
 *   1. Bet (keeps payouts scaling with chips-won trajectory)
 *   2. Luck (improves rare hits, compounds with bet)
 *   3. Multiplier (late-game scaling)
 *   4. Passive amount (anti-softlock + passive accumulation)
 *   5. Passive rate (accelerates passive)
 *   6. Autospin (quality of life)
 *   7. Extra reel (unlock higher match tiers)
 *   8. Extra row (unlock bigger grid)
 */
const PRIORITY: string[] = [
  'bet',
  'luck',
  'multiplier',
  'passiveAmount',
  'passiveRate',
  'autospin',
  'extraReel',
  'extraRow',
];

export const stratumLocked: Policy = (state: SimState) => {
  for (const id of PRIORITY) {
    if (canBuy(state, id)) return id;
  }
  // Fall back to anything affordable (if priority list doesn't cover all)
  for (const u of UPGRADES) {
    if (canBuy(state, u.id)) return u.id;
  }
  return null;
};
