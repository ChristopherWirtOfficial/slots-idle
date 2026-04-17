import { Policy } from '../types';
import { SimState, affordableUpgrades, nextCost } from '../state';

/**
 * Buy the cheapest currently-affordable upgrade. If multiple share the
 * minimum cost, prefer the alphabetically-first ID (deterministic).
 *
 * The default-human archetype: "ooh, I can afford something — buy it."
 * Doesn't think about ROI, doesn't plan ahead.
 */
export const greedyCheap: Policy = (state: SimState) => {
  const options = affordableUpgrades(state);
  if (options.length === 0) return null;

  let best: { id: string; cost: ReturnType<typeof nextCost> } | null = null;
  for (const id of options) {
    const cost = nextCost(state, id);
    if (best === null || cost.lt(best.cost) || (cost.eq(best.cost) && id < best.id)) {
      best = { id, cost };
    }
  }
  return best?.id ?? null;
};
