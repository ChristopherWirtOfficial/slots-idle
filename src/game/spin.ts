import { SYMBOLS, SlotSymbol, REEL_COUNT, TOTAL_WEIGHT } from './symbols';

export interface SpinResult {
  reels: SlotSymbol[];
  payout: number;
  kind: 'miss' | 'two' | 'three';
}

// Weighted roll with a "luck" parameter that shifts probability mass toward rare symbols.
// luck in [0, 1+); 0 = baseline, higher = rarer symbols more likely.
function rollWithLuck(rng: () => number, luck: number): SlotSymbol {
  // Reweight: rare symbols (later in array) get their weight boosted.
  // We transform each weight by w * (1 + luck * rarityBoost)
  // rarityBoost grows with rarity index.
  const weights = SYMBOLS.map((s, i) => {
    const rarityFactor = i / (SYMBOLS.length - 1); // 0..1
    return s.weight * (1 + luck * rarityFactor * 3);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

export function spin(
  bet: number,
  luck: number,
  globalMult: number,
  rng: () => number = Math.random,
): SpinResult {
  const reels: SlotSymbol[] = [];
  for (let i = 0; i < REEL_COUNT; i++) {
    reels.push(rollWithLuck(rng, luck));
  }

  // Payout: 3-match > 2-match (first two reels, classic slots convention)
  let payout = 0;
  let kind: SpinResult['kind'] = 'miss';
  if (reels[0].id === reels[1].id && reels[1].id === reels[2].id) {
    payout = bet * reels[0].payout3;
    kind = 'three';
  } else if (reels[0].id === reels[1].id && reels[0].payout2 > 0) {
    payout = bet * reels[0].payout2;
    kind = 'two';
  }

  payout = Math.floor(payout * globalMult);
  return { reels, payout, kind };
}

// Expected RTP sanity check — useful for tuning later
export function theoreticalRTP(luck: number, globalMult: number): number {
  const weights = SYMBOLS.map((s, i) => {
    const rarityFactor = i / (SYMBOLS.length - 1);
    return s.weight * (1 + luck * rarityFactor * 3);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const probs = weights.map((w) => w / total);
  let rtp = 0;
  SYMBOLS.forEach((s, i) => {
    const p3 = probs[i] ** 3;
    const p2 = probs[i] ** 2 * (1 - probs[i]);
    rtp += p3 * s.payout3 + p2 * s.payout2;
  });
  return rtp * globalMult;
}

// Silence unused export warning during strict builds if unused
void TOTAL_WEIGHT;
