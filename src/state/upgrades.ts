import { atom } from 'jotai';
import { GLOBAL_UPGRADES, costOf } from '../engine/upgrades';
import { levelsAtom } from './levels';
import { allUpgradesAtom } from './machine';
import { cheatLuckAtom } from './cheats';

/** Cost of the next level purchase per upgrade id (engine + machine). */
export const costsAtom = atom((get) => {
  const upgrades = get(allUpgradesAtom);
  const levels = get(levelsAtom);
  const result: Record<string, number> = {};
  for (const u of upgrades) {
    result[u.id] = costOf(u, levels[u.id] ?? 0);
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

export const betAtom = globalEffectAtom('bet');
export const multiplierAtom = globalEffectAtom('multiplier');
export const passiveAmountAtom = globalEffectAtom('passiveAmount');
export const passiveRateMsAtom = globalEffectAtom('passiveRate');

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
