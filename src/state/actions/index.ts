/**
 * Barrel re-export so consumers can keep importing from 'state/actions'
 * without caring about the internal split.
 */
export { spinActionAtom, animationTickAtom } from './spin';
export { buyUpgradeAtom } from './buying';
export { prestigeActionAtom, resetActionAtom } from './reset';
export { autospinTickAtom, passiveIncomeTickAtom } from './ticks';
