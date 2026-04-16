// Symbol definitions — ordered by rarity (low index = common, high = rare).
// Payouts retuned for 5-payline 3x3: each spin gets 5 chances to hit, so
// per-hit payouts are scaled down from the single-payline version.
export interface SlotSymbol {
  id: string;
  glyph: string;
  name: string;
  color: string;
  weight: number; // higher = more common
  payout3: number; // multiplier on bet for 3 in a row on a payline
  payout2: number; // for 2 in a row (positions 0 + 1 on a payline)
}

export const SYMBOLS: SlotSymbol[] = [
  { id: 'cherry',   glyph: '🍒', name: 'Cherry',   color: '#d23b4f', weight: 40, payout3: 2,   payout2: 0.3 },
  { id: 'lemon',    glyph: '🍋', name: 'Lemon',    color: '#e8c547', weight: 35, payout3: 3,   payout2: 0.4 },
  { id: 'plum',     glyph: '🍇', name: 'Plum',     color: '#8b5a9e', weight: 28, payout3: 4,   payout2: 0.5 },
  { id: 'bell',     glyph: '🔔', name: 'Bell',     color: '#d4a04a', weight: 18, payout3: 7,   payout2: 0.8 },
  { id: 'star',     glyph: '⭐', name: 'Star',     color: '#f0d76a', weight: 10, payout3: 16,  payout2: 1.3 },
  { id: 'diamond',  glyph: '💎', name: 'Diamond',  color: '#6ed5e8', weight: 5,  payout3: 40,  payout2: 2.5 },
  { id: 'seven',    glyph: '7',  name: 'Lucky 7',  color: '#c7203e', weight: 2,  payout3: 160, payout2: 0   },
];

export const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

export function rollSymbol(rng: () => number): SlotSymbol {
  let r = rng() * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[0];
}

export const REEL_COUNT = 3;
export const ROW_COUNT = 3;
