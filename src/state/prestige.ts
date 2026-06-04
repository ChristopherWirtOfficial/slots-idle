import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { prestigeGain } from '../engine/upgrades';
import { lifetimeWinningsAtom } from './economy';
import { multiplierAtom } from './upgrades';
import { payoutMultAtom } from './store';
import { decimalStorage } from '../util/decimalStorage';

const KEY = (k: string) => `lucky-idle-slots:v1:${k}`;

/**
 * High-Roller Points — the prestige currency. Earned on cash-out, SPENT
 * in the High Roller store (cost-reduction tracks + the House Favor
 * payout track). A spendable balance, not a running total. Decimal
 * because it derives from lifetime winnings, which grows unbounded.
 */
export const highRollerPointsAtom = atomWithStorage<Decimal>(
  KEY('hrp'),
  new Decimal(0),
  decimalStorage,
);

/** HRP that a prestige right now would grant (not yet committed). */
export const prestigePendingAtom = atom((get) => prestigeGain(get(lifetimeWinningsAtom)));

/**
 * Combined payout multiplier: House Favor store track × upgrade
 * multiplier. Both are factors; result is Decimal. The permanent
 * prestige contribution now comes from spent points (the payout track),
 * not from the points balance itself.
 */
export const globalMultAtom = atom((get) => {
  return get(payoutMultAtom).mul(get(multiplierAtom));
});
