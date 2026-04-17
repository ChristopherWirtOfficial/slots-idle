import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { prestigeGain, prestigeMultiplier } from '../engine/upgrades';
import { lifetimeWinningsAtom } from './economy';
import { multiplierAtom } from './upgrades';
import { decimalStorage } from '../util/decimalStorage';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

/**
 * High-Roller Points. Accumulates via prestige runs; feeds the
 * permanent multiplier. Decimal because HRP derives from sqrt of
 * lifetime winnings, which can grow unbounded.
 */
export const highRollerPointsAtom = atomWithStorage<Decimal>(
  KEY('hrp'),
  new Decimal(0),
  decimalStorage,
);

/** HRP that a prestige right now would grant (not yet committed). */
export const prestigePendingAtom = atom((get) => prestigeGain(get(lifetimeWinningsAtom)));

/** Permanent multiplier derived from HRP. */
export const prestigeMultAtom = atom((get) => prestigeMultiplier(get(highRollerPointsAtom)));

/**
 * Combined payout multiplier: upgrade mult × prestige mult.
 * upgrade mult is a small number; prestige mult is Decimal; result is Decimal.
 */
export const globalMultAtom = atom((get) => {
  return get(prestigeMultAtom).mul(get(multiplierAtom));
});
