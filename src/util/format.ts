import Decimal from 'break_infinity.js';

/**
 * Hybrid big-number formatter.
 *
 * - Below 1000: integer display with thousands commas (1,234).
 * - 1K through 999 Dc (decillion): suffix notation with mantissa to 2
 *   decimal places (1.23M, 4.56B, 7.89T, 1.23Dc).
 * - Past Dc (>= 1e36): scientific (1.23e42).
 *
 * The suffix set covers 12 tiers (through Dc) — enough for all but the
 * longest late-game runs. Beyond that, scientific stays bounded-width.
 * Picking the break at Dc is a taste call; some incremental games extend
 * the suffix list much further but readability suffers.
 */
const SUFFIXES = [
  '',   // 1
  'K',  // 1e3
  'M',  // 1e6
  'B',  // 1e9
  'T',  // 1e12
  'Qa', // 1e15 (quadrillion)
  'Qi', // 1e18 (quintillion)
  'Sx', // 1e21 (sextillion)
  'Sp', // 1e24 (septillion)
  'Oc', // 1e27 (octillion)
  'No', // 1e30 (nonillion)
  'Dc', // 1e33 (decillion)
];

const SCIENTIFIC_THRESHOLD = SUFFIXES.length * 3; // 36 (>= 1e36 goes scientific)

export function formatNum(v: Decimal | number, places = 2): string {
  const d = v instanceof Decimal ? v : new Decimal(v);

  // Small numbers: integer display with commas for whole values.
  if (d.lt(1000)) {
    const n = d.toNumber();
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toFixed(places);
  }

  // Suffix tier: floor(log10/3). e.g., log10(1.5e7) ≈ 7.18, tier = 2 → 'M'.
  const log = d.log10();
  const tier = Math.floor(log / 3);

  if (tier < SUFFIXES.length && log < SCIENTIFIC_THRESHOLD) {
    const mantissa = d.div(Decimal.pow(10, tier * 3));
    return `${mantissa.toFixed(places)}${SUFFIXES[tier]}`;
  }

  return d.toExponential(places);
}
