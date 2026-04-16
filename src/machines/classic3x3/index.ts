import { Machine, ResolvedMachineConfig, UpgradeDef } from '../../engine/types';
import { CLASSIC_SYMBOLS } from './symbols';
import { paylinesForTopology } from './paylines';
import { evaluate } from './evaluate';
import { highlightsForWin } from './highlights';

const BASE_REEL_COUNT = 3;
const BASE_ROW_COUNT = 3;
const MAX_REEL_COUNT = 5;
const MAX_ROW_COUNT = 4;

/**
 * Machine-specific upgrades. Merged with engine globals by the engine.
 * Interpretation (what level maps to what effect) happens in this
 * machine's resolveConfig — the engine just tracks levels + UI.
 */
const CLASSIC_UPGRADES: UpgradeDef[] = [
  {
    id: 'extraReel',
    name: 'Fourth Wheel',
    blurb: 'Add another reel to the machine. Paylines extend; bigger matches unlock higher payouts.',
    baseCost: 15000,
    costMult: 4,
    maxLevel: MAX_REEL_COUNT - BASE_REEL_COUNT,
    effect: (lvl) => BASE_REEL_COUNT + lvl,
    format: (lvl) => `${BASE_REEL_COUNT + lvl} reels`,
  },
  {
    id: 'extraRow',
    name: 'Taller Cabinet',
    blurb: 'Add a row to the machine. More symbols visible; the middle row recenters.',
    baseCost: 25000,
    costMult: 5,
    maxLevel: MAX_ROW_COUNT - BASE_ROW_COUNT,
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
  return {
    topology,
    symbols: CLASSIC_SYMBOLS,
    paylines: paylinesForTopology(topology),
  };
}

export const classic3x3: Machine = {
  id: 'classic-3x3',
  name: 'Lucky Parlour',
  resolveConfig,
  evaluate,
  highlightsForWin,
  upgrades: CLASSIC_UPGRADES,
};
