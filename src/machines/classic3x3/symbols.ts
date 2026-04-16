import { SlotSymbol } from '../../engine/types';

/**
 * Ordered by rarity (low index = common, high = rare).
 *
 * Payouts table keyed by match count. We define 3, 4, and 5 up front so
 * the table survives topology growth (Extra Reel upgrade expands the
 * reachable match counts). For the base 3x3 configuration only the 3 key
 * is reachable; larger reel counts unlock 4- and 5-match tiers.
 *
 * Base 3-match payouts tuned for ~120% RTP on 5-payline 3x3.
 * Higher tiers scale ~2.5× and ~6× to reward growth.
 */
export const CLASSIC_SYMBOLS: SlotSymbol[] = [
  { id: 'cherry',   glyph: '🍒', name: 'Cherry',   color: '#d23b4f', weight: 40, payouts: { 3: 3,   4: 8,    5: 20 } },
  { id: 'lemon',    glyph: '🍋', name: 'Lemon',    color: '#e8c547', weight: 35, payouts: { 3: 4,   4: 12,   5: 30 } },
  { id: 'plum',     glyph: '🍇', name: 'Plum',     color: '#8b5a9e', weight: 28, payouts: { 3: 7,   4: 20,   5: 50 } },
  { id: 'bell',     glyph: '🔔', name: 'Bell',     color: '#d4a04a', weight: 18, payouts: { 3: 12,  4: 35,   5: 90 } },
  { id: 'star',     glyph: '⭐', name: 'Star',     color: '#f0d76a', weight: 10, payouts: { 3: 28,  4: 80,   5: 200 } },
  { id: 'diamond',  glyph: '💎', name: 'Diamond',  color: '#6ed5e8', weight: 5,  payouts: { 3: 65,  4: 180,  5: 450 } },
  { id: 'seven',    glyph: '7',  name: 'Lucky 7',  color: '#c7203e', weight: 2,  payouts: { 3: 250, 4: 700,  5: 1800 } },
];
