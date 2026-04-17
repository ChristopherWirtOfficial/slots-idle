import Decimal from 'break_infinity.js';
import { Policy } from '../types';
import { SimState, affordableUpgrades, derive, nextCost } from '../state';

/**
 * Estimate marginal chips-per-sec gain from buying upgrade `id`, at
 * current state. Rough heuristics per upgrade role — not a true
 * expected-value calculation, just good-enough to differentiate.
 *
 * Returns a Decimal; higher is better.
 */
function estimateDelta(state: SimState, id: string): Decimal {
  const before = derive(state);
  const nextLevel = (state.levels[id] ?? 0) + 1;

  // Lazy approach: compute a proxy for "expected payout per spin" before
  // and after. For bet/multiplier/luck changes, the proxy scales
  // linearly; for others we use role-specific heuristics.
  const proxyBefore = new Decimal(before.bet).mul(before.multiplier);
  const luckBoostBefore = 1 + before.luck * 3;

  // Snapshot levels with the hypothetical purchase (conceptually only —
  // we just compute proxy deltas below based on the specific upgrade).
  const hypoBet = id === 'bet' ? (before.bet + 1) : before.bet;
  // These depend on the upgrade — recompute derived for the proxy only
  // when the upgrade actually moves a proxy-relevant field.
  let hypoMult = before.multiplier;
  let hypoLuckBoost = luckBoostBefore;
  if (id === 'multiplier') hypoMult = new Decimal(1 + nextLevel * 0.1);
  if (id === 'luck') hypoLuckBoost = 1 + nextLevel * 0.02 * 3;

  const proxyAfter = new Decimal(hypoBet).mul(hypoMult).mul(hypoLuckBoost / luckBoostBefore);

  // Core-loop payout lift from this purchase, in "bet-equivalent chips":
  const payoutDelta = proxyAfter.sub(proxyBefore);

  // Convert to chips/sec by assuming ~1 spin per 3 seconds for
  // estimation. Arbitrary but consistent across options.
  const spinRate = 1 / 3;
  let perSec = payoutDelta.mul(spinRate);

  // Passive income contributes directly in chips/sec.
  if (id === 'passiveAmount') {
    const curRateSec = before.passiveRateMs / 1000;
    const gain = 1 / Math.max(0.1, curRateSec);
    perSec = perSec.add(gain);
  }
  if (id === 'passiveRate') {
    // Next level gives a 500ms reduction; gain in chips/sec = amount * delta
    const curAmount = before.passiveAmount || 1;
    const curRate = before.passiveRateMs;
    const nextRate = Math.max(2000, 10000 - nextLevel * 500);
    if (nextRate < curRate) {
      const gain = curAmount * (1 / (nextRate / 1000) - 1 / (curRate / 1000));
      perSec = perSec.add(gain);
    }
  }

  // Autospin and topology: harder to quantify; give them a nominal
  // "nonzero" boost so they're not zero-weight, but low priority
  // per chip spent unless cheap.
  if (id === 'autospin' || id === 'extraReel' || id === 'extraRow') {
    perSec = perSec.add(new Decimal(before.bet * 0.1));
  }

  return perSec.max(new Decimal(0.000001)); // nonzero floor
}

/**
 * Pick the affordable upgrade with best estimated chips-per-sec gain
 * per chip spent (ROI). The "thoughtful player" archetype.
 */
export const roiOptimal: Policy = (state: SimState) => {
  const options = affordableUpgrades(state);
  if (options.length === 0) return null;

  let best: { id: string; roi: Decimal } | null = null;
  for (const id of options) {
    const delta = estimateDelta(state, id);
    const cost = nextCost(state, id);
    const roi = delta.div(cost);
    if (best === null || roi.gt(best.roi) || (roi.eq(best.roi) && id < best.id)) {
      best = { id, roi };
    }
  }
  return best?.id ?? null;
};
