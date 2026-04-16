import { Payline, SpinTopology } from '../../engine/types';

/**
 * The 5 classic paylines in their base 3-reel shape.
 * Each entry describes a "shape rule" — not just a rows array — because
 * when the machine grows to more reels, the pattern needs to continue.
 */
interface PaylineShape {
  id: string;
  name: string;
  /** Generate the full row-per-column array for a given reel count. */
  extend(reelCount: number, rowCount: number): number[];
}

const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));

const SHAPES: PaylineShape[] = [
  {
    id: 'top',
    name: 'Top row',
    extend: (n) => Array(n).fill(0),
  },
  {
    id: 'mid',
    // Always the geometric middle of the grid for the current rowCount
    name: 'Middle row',
    extend: (n, rows) => Array(n).fill(Math.floor((rows - 1) / 2)),
  },
  {
    id: 'bot',
    name: 'Bottom row',
    extend: (n, rows) => Array(n).fill(rows - 1),
  },
  {
    id: 'diag-dn',
    name: 'Diagonal ↘',
    // Step down until we hit the bottom, then hold. For rowCount=3: [0,1,2,2,2,...]
    extend: (n, rows) =>
      Array.from({ length: n }, (_, i) => clamp(i, rows - 1)),
  },
  {
    id: 'diag-up',
    name: 'Diagonal ↗',
    // Mirror of diag-dn: start at bottom, step up until we hit the top, hold.
    extend: (n, rows) =>
      Array.from({ length: n }, (_, i) => clamp(rows - 1 - i, rows - 1)),
  },
];

/**
 * Return the active paylines for a given topology. Machine-local policy:
 * - Extend/truncate patterns to match reelCount.
 * - Rows move to stay relative to rowCount (middle row recenters, etc).
 */
export function paylinesForTopology(topology: SpinTopology): Payline[] {
  return SHAPES.map((s) => ({
    id: s.id,
    name: s.name,
    rows: s.extend(topology.reelCount, topology.rowCount),
  }));
}

export function paylineNameById(id: string): string {
  const s = SHAPES.find((x) => x.id === id);
  return s?.name ?? id;
}
