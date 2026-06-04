import Decimal from 'break_infinity.js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { GLOBAL_UPGRADES, costOf } from '../engine/upgrades';
import { levelsAtom } from './levels';
import { allUpgradesAtom } from './machine';
import { reductionFactorsAtom } from './store';
import { cheatLuckAtom } from './cheats';

/**
 * Cost of the next level purchase per upgrade id (engine + machine),
 * after applying any prestige-store cost reduction. The reduction factor
 * is 1 (no-op) until the player buys reduction-track levels.
 */
export const costsAtom = atom((get) => {
  const upgrades = get(allUpgradesAtom);
  const levels = get(levelsAtom);
  const factors = get(reductionFactorsAtom);
  const result: Record<string, Decimal> = {};
  for (const u of upgrades) {
    const base = costOf(u, levels[u.id] ?? 0);
    result[u.id] = base.mul(factors[u.id] ?? 1).ceil();
  }
  return result;
});

/**
 * Derived effect atom for a known global upgrade. Machine-specific
 * upgrades are read inside the machine's resolveConfig; no dedicated
 * atom needed.
 */
function globalEffectAtom(id: string) {
  return atom((get) => {
    const u = GLOBAL_UPGRADES.find((x) => x.id === id);
    if (!u || !u.effect) return 0;
    return u.effect(get(levelsAtom)[id] ?? 0);
  });
}

/**
 * Maximum bet the player is allowed to pick, derived from the "Table
 * Stakes" upgrade level. This is a CEILING, not the actual bet — see
 * currentBetAtom for what's actually being wagered.
 */
export const maxBetAtom = globalEffectAtom('bet');

export const multiplierAtom = globalEffectAtom('multiplier');
export const passiveAmountAtom = globalEffectAtom('passiveAmount');
export const passiveRateMsAtom = globalEffectAtom('passiveRate');

/**
 * Persisted raw value. Read through `currentBetAtom` below so it's
 * clamped against the current maxBet at read time. Write through
 * `setCurrentBetAtom` so the clamp is enforced at write time too.
 */
const storedBetAtom = atomWithStorage<number>(
  'lucky-idle-slots:v1:currentBet',
  1,
);

/**
 * The player's actual wager per spin, clamped to [1, maxBet]. Clamping
 * at read keeps things honest across two flows:
 *  - max rising (bet upgrade purchased): storedBet unchanged, but we
 *    happily read anywhere up to the new max. If caller was "at max",
 *    setCurrentBetAtom is what handles pushing the stored value up.
 *  - max dropping (cheat reset): storedBet could exceed max; read-clamp
 *    masks the stale value until caller writes a fresh one.
 */
export const currentBetAtom = atom((get) => {
  const stored = get(storedBetAtom);
  const max = get(maxBetAtom);
  return Math.max(1, Math.min(max, stored));
});

/**
 * Action: set the player's wager. Clamps to the current legal range
 * at write time. Use this from UI handlers; don't write storedBetAtom
 * directly.
 */
export const setCurrentBetAtom = atom(null, (get, set, bet: number) => {
  const max = get(maxBetAtom);
  const clamped = Math.max(1, Math.min(max, Math.floor(bet)));
  set(storedBetAtom, clamped);
});

/**
 * Luck is the one effect atom with a cheat override. If cheatLuckAtom is
 * set, it replaces the upgrade-derived value; otherwise the normal
 * derivation applies.
 */
const luckFromUpgrades = globalEffectAtom('luck');
export const luckAtom = atom((get) => {
  const cheat = get(cheatLuckAtom);
  return cheat !== null ? cheat : get(luckFromUpgrades);
});
