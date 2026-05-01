import { Machine, ResolvedMachineConfig, UpgradeDef } from '../../engine/types';
import { GLOBAL_UPGRADES } from '../../engine/upgrades';
import { FRUIT_SYMBOLS } from './symbols';
import { paylinesForTopology } from './paylines';
import { evaluate } from './evaluate';
import { highlightsForWin } from './highlights';

const BASE_REEL_COUNT = 3;
const BASE_ROW_COUNT = 3;
// Reserved for prestige-store unlocks (extraReel/extraRow).
// Unused at level 0 cap; keeping the shape of the machine's intended
// growth space documented.
// const MAX_REEL_COUNT = 5;
// const MAX_ROW_COUNT = 4;

/**
 * Machine-specific upgrades. Merged with engine globals by the engine.
 * Interpretation (what level maps to what effect) happens in this
 * machine's resolveConfig — the engine just tracks levels + UI.
 */
const FRUIT_UPGRADES: UpgradeDef[] = [
  {
    id: 'extraReel',
    name: 'Fourth Wheel',
    blurb: 'Add another reel to the machine. Paylines extend; bigger matches unlock higher payouts.',
    baseCost: 15000,
    costMult: 4,
    // maxLevel 0 = DISABLED for current playtest. This is becoming a
    // prestige-store unlock, not a base-run upgrade. See DESIGN_NOTES.md.
    maxLevel: 0,
    effect: (lvl) => BASE_REEL_COUNT + lvl,
    format: (lvl) => `${BASE_REEL_COUNT + lvl} reels`,
  },
  {
    id: 'extraRow',
    name: 'Taller Cabinet',
    blurb: 'Add a row to the machine. More symbols visible; the middle row recenters.',
    baseCost: 25000,
    costMult: 5,
    maxLevel: 0,
    effect: (lvl) => BASE_ROW_COUNT + lvl,
    format: (lvl) => `${BASE_ROW_COUNT + lvl} rows`,
  },
];

function resolveConfig(levels: Record<string, number>): ResolvedMachineConfig {
  const extraReels = levels.extraReel ?? 0;
  const extraRows = levels.extraRow ?? 0;
  const reelCount = BASE_REEL_COUNT + extraReels;
  const rowCount = BASE_ROW_COUNT + extraRows;
  const topology = { reelCount, rowCount };

  // Wild chance: the wildChance upgrade's effect IS the per-cell
  // probability, 0..1. At level 0 the upgrade returns 0 and nothing
  // will ever roll a wild.
  const wildUpgrade = GLOBAL_UPGRADES.find((u) => u.id === 'wildChance');
  const wildChance = wildUpgrade?.effect?.(levels.wildChance ?? 0) ?? 0;

  return {
    topology,
    symbols: FRUIT_SYMBOLS,
    wild: {
      glyph: '🃏',
      color: '#d4a04a',
      name: 'Wild',
      chance: wildChance,
    },
    paylines: paylinesForTopology(topology),
  };
}

/**
 * "Fruit machine" — the classic payline slot, UK-slang-named. Ships
 * at 3×3 but grows to 5×4 via topology upgrades (currently gated
 * behind prestige, see DESIGN_NOTES). Symbol pool leans fruit-heavy
 * at the low tiers (cherry/lemon/plum) with classic bell/star/diamond/7
 * at the higher tiers, keeping the vibe nostalgic.
 *
 * The player-facing brand is "Lucky Parlour" — the name of this
 * specific parlour, not the machine type. Future machines will have
 * different names and might reuse parts of this one's structure.
 */
export const fruitMachine: Machine = {
  id: 'fruit-machine',
  name: 'Lucky Parlour',
  resolveConfig,
  evaluate,
  highlightsForWin,
  upgrades: FRUIT_UPGRADES,
};
