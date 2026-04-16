// Paylines are defined as which row each column contributes.
// grid[col][row] where col=0..2 left→right, row=0..2 top→bottom.

export interface Payline {
  id: string;
  name: string;
  /** For each column, which row to read. */
  rows: [number, number, number];
}

export const PAYLINES: Payline[] = [
  { id: 'top',     name: 'Top row',       rows: [0, 0, 0] },
  { id: 'mid',     name: 'Middle row',    rows: [1, 1, 1] },
  { id: 'bot',     name: 'Bottom row',    rows: [2, 2, 2] },
  { id: 'diag-dn', name: 'Diagonal ↘',    rows: [0, 1, 2] },
  { id: 'diag-up', name: 'Diagonal ↗',    rows: [2, 1, 0] },
];
