import { useAtomValue } from 'jotai';
import { useAtomicTick } from '../tick/useTick';
import { TICK_LENGTH } from '../tick/knobs';
import { passiveRateMsAtom } from '../state/upgrades';
import { passiveIncomeTickAtom } from '../state/actions';

/**
 * Drips chips into the bank at a rate controlled by the Brisk Service upgrade.
 * Active from turn one — baseline is 1 chip every 5 seconds.
 */
export function usePassiveIncome(): void {
  const rateMs = useAtomValue(passiveRateMsAtom);
  const frequency = Math.max(1, Math.round(rateMs / TICK_LENGTH));
  useAtomicTick(passiveIncomeTickAtom, frequency);
}
