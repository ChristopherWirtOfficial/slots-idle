import { SlotSymbol } from '../../engine/types';

/**
 * Ordered by rarity (low index = common, high = rare).
 *
 * Payouts table keyed by match count. We define 3, 4, and 5 up front so
 * the table survives topology growth (Extra Reel upgrade expands the
 * reachable match counts). For the base 3x3 configuration only the 3 key
 * is reachable; larger reel counts unlock 4- and 5-match tiers.
 *
 * Tuned for a generous "it's a game, not a casino" economy — base RTP
 * lands around 290%. Net chip flow per spin is ~1.9× bet, so early
 * game progression is brisk without needing any upgrades. Commons
 * bumped most (2.3-2.6×) so the constant stream of small wins feels
 * rewarding; jackpots still keep their "oh shit" punch.
 */
export const FRUIT_SYMBOLS: SlotSymbol[] = [
  { id: 'cherry',   glyph: '🍒', name: 'Cherry',   color: '#d23b4f', weight: 40, payouts: { 3: 7,   4: 20,   5: 50 } },
  { id: 'lemon',    glyph: '🍋', name: 'Lemon',    color: '#e8c547', weight: 35, payouts: { 3: 10,  4: 30,   5: 75 } },
  { id: 'plum',     glyph: '🍇', name: 'Plum',     color: '#8b5a9e', weight: 28, payouts: { 3: 18,  4: 50,   5: 125 } },
  { id: 'bell',     glyph: '🔔', name: 'Bell',     color: '#d4a04a', weight: 18, payouts: { 3: 30,  4: 90,   5: 225 } },
  { id: 'star',     glyph: '⭐', name: 'Star',     color: '#f0d76a', weight: 10, payouts: { 3: 60,  4: 170,  5: 425 } },
  { id: 'diamond',  glyph: '💎', name: 'Diamond',  color: '#6ed5e8', weight: 5,  payouts: { 3: 140, 4: 400,  5: 1000 } },
  { id: 'seven',    glyph: '7',  name: 'Lucky 7',  color: '#c7203e', weight: 2,  payouts: { 3: 500, 4: 1500, 5: 3750 } },
];
