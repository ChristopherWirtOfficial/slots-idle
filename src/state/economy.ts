import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { decimalStorage } from '../util/decimalStorage';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

// Money and accumulated-payout atoms are Decimal. They grow without
// bound as the player compounds upgrades + prestige.
export const chipsAtom = atomWithStorage<Decimal>(KEY('chips'), new Decimal(30), decimalStorage);
export const lifetimeWinningsAtom = atomWithStorage<Decimal>(
  KEY('lifetimeWinnings'),
  new Decimal(0),
  decimalStorage,
);
export const totalEverWonAtom = atomWithStorage<Decimal>(
  KEY('totalEverWon'),
  new Decimal(0),
  decimalStorage,
);

// Counters stay `number`. Jackpot / spin counts grow linearly with play
// time; even millions of spins are comfortably inside Number.MAX_SAFE_INTEGER.
export const jackpotsAtom = atomWithStorage<number>(KEY('jackpots'), 0);
export const spinsTotalAtom = atomWithStorage<number>(KEY('spinsTotal'), 0);

/** Convenience: can the player afford a given cost right now? */
export const canAffordAtom = atom((get) => {
  const chips = get(chipsAtom);
  return (amount: Decimal | number) => chips.gte(amount);
});
