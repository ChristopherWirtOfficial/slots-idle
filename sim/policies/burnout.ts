import { Policy } from '../types';
import { SimState, affordableUpgrades, nextCost } from '../state';
import { UPGRADES } from '../gameData';

/**
 * Antagonistic policy: spend EVERYTHING until nothing more is affordable.
 *
 * Specifically, this picks the most expensive affordable upgrade each call.
 * Because tryBuyAll loops until the policy returns null, this ends up
 * buying every affordable upgrade in sequence — which is already what
 * other policies do too.
 *
 * The distinguishing behavior: this policy prefers to end up with as
 * few chips as possible. When faced with "big item or 5 cheap items?",
 * picking the big one leaves the smallest residue. Over many decision
 * moments this compounds into "always near-broke".
 *
 * If passive income can hold this policy above the softlock line most
 * of the time, passive is doing its job. If this policy softlocks
 * frequently, passive is too weak. If it comfortably progresses like
 * other archetypes, passive might be too strong (or burnout isn't
 * actually antagonistic enough).
 */
export const burnout: Policy = (state: SimState) => {
  const options = affordableUpgrades(state);
  if (options.length === 0) return null;

  // Pick the most expensive affordable upgrade.
  let best: { id: string; cost: ReturnType<typeof nextCost> } | null = null;
  for (const id of options) {
    const cost = nextCost(state, id);
    if (best === null || cost.gt(best.cost) || (cost.eq(best.cost) && id < best.id)) {
      best = { id, cost };
    }
  }
  return best?.id ?? null;
};

/**
 * A more extreme antagonistic policy: also buys locked/silly things first
 * if it can (the worst ROI upgrades). Currently unused but here as a
 * further stress test if burnout doesn't provoke softlocks.
 */
export const worstROI: Policy = (state: SimState) => {
  // Arbitrary reversed priority list — prefers things that don't help much
  const ANTI_PRIORITY = ['extraRow', 'extraReel', 'luck', 'passiveRate', 'passiveAmount', 'autospin', 'multiplier', 'bet'];
  for (const id of ANTI_PRIORITY) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) continue;
    const lvl = state.levels[id] ?? 0;
    if (lvl >= u.maxLevel) continue;
    if (state.chips.gte(nextCost(state, id))) return id;
  }
  return null;
};
