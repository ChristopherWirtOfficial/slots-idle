// Engine-level types. Machine-agnostic.
// Machine-specific concepts (paylines, clusters, scatters) live in machines/.

import Decimal from 'break_infinity.js';

export interface SlotSymbol {
  id: string;
  glyph: string;
  name: string;
  color: string;
  /** Relative weight for random rolls. */
  weight: number;
  /**
   * Payout multipliers keyed by match count. A machine's evaluator decides
   * what "match count" means (e.g. consecutive-from-left on a payline).
   * Missing keys mean that count doesn't pay.
   */
  payouts: Record<number, number>;
}

/**
 * What a single grid position rolled to. Symbol cells are the default;
 * other kinds can be composed in via grid generation (wilds, scatters,
 * etc). Consumers match on `kind` — never assume symbol.
 */
export type Cell =
  | { kind: 'symbol'; symbol: SlotSymbol }
  | { kind: 'wild' };

/** Convenience constructor so call sites read as data, not type ceremony. */
export function symbolCell(symbol: SlotSymbol): Cell {
  return { kind: 'symbol', symbol };
}

export interface CellPosition {
  col: number;
  row: number;
}

/**
 * UI hint for rendering a win.
 * `cells` — decorate these with the highlight dots.
 * `line` — optional ordered path to stroke between them (payline-style).
 * `variant` — color/style bucket; the engine maps to a palette.
 */
export interface CellHighlight {
  cells: CellPosition[];
  line?: CellPosition[];
  variant: 'primary' | 'jackpot';
}

/**
 * Uniform win shape all machines emit. Opaque `meta` lets each machine
 * carry its own categorization without the engine knowing the details.
 */
export interface MachineWin {
  /** Human-readable label, e.g. "Top row" or "Cluster of 5". */
  name: string;
  /** Which symbol caused the win — drives glyph/color in UI. */
  symbol: SlotSymbol;
  /** Already-computed payout in chips (bet × symbol mult × globalMult). */
  payout: Decimal;
  /** Jackpot-tier? Triggers cabinet shake + jackpot SFX. */
  isJackpot: boolean;
  /** Machine-specific opaque metadata. */
  meta?: Record<string, unknown>;
}

export interface SpinTopology {
  reelCount: number;
  rowCount: number;
}

/** A payline is an ordered row-index per column. Length must equal reelCount. */
export interface Payline {
  id: string;
  name: string;
  rows: number[];
}

/**
 * An upgrade definition. Lives either in the engine (global upgrades like
 * bet/luck) or in a machine (machine-specific upgrades like extraReel).
 * The engine merges both sources into one upgrade list for UI + purchase.
 *
 * Effect semantics: the engine tracks `levels[id]` as an integer count of
 * purchases. Who reads that level, and how, depends on the upgrade:
 *  - Engine upgrades with `effect(lvl)` are read by dedicated derived atoms
 *    (betAtom, luckAtom, etc.) set up at engine boot.
 *  - Machine upgrades are read by the machine's resolveConfig() and can
 *    have any effect the machine wants (topology, paylines, symbol set).
 *    They still go through levelsAtom so cost/persistence/UI are uniform.
 *
 * `effect` and `format` are optional for machine-contributed upgrades where
 * the UI just shows "Level N / Max" and the machine handles interpretation.
 */
export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  baseCost: number;
  costMult: number;
  maxLevel: number;
  /** Current numeric effect at a level — for engine-readable upgrades. */
  effect?: (level: number) => number;
  /** Human-readable current effect line for the UI. */
  format?: (level: number) => string;
}

/**
 * What a machine resolves to, given a current upgrade-levels snapshot.
 * Pure derivation: same levels → same resolved config, always.
 */
export interface ResolvedMachineConfig {
  topology: SpinTopology;
  symbols: SlotSymbol[];
  paylines: Payline[];
}

/**
 * A machine definition. Pure config + pure functions.
 *
 * - `resolveConfig(levels)` — derive the current topology/symbols/paylines
 *   from upgrade levels. Called as a derivation; no side effects.
 * - `evaluate(ctx)` — given a generated grid + resolved config, produce
 *   the list of wins.
 * - `highlightsForWin(win, config)` — tell the UI how to render a win.
 * - `upgrades` — machine-specific upgrade defs contributed to the engine.
 *
 * Fixed by engine (not overridable): animation cadence, tick loop, audio
 * triggers, save/load, chip flow.
 */
export interface Machine {
  id: string;
  /** Display name. */
  name: string;

  /**
   * Pure function. Given upgrade levels, return the current machine shape.
   * Must be stable: same input always produces same output.
   */
  resolveConfig(levels: Record<string, number>): ResolvedMachineConfig;

  /**
   * Evaluate a generated grid for wins. Pure.
   * grid shape: [col][row]
   */
  evaluate(ctx: {
    grid: Cell[][];
    config: ResolvedMachineConfig;
    bet: number;
    globalMult: Decimal;
  }): MachineWin[];

  /** How should the UI highlight this win on the current config's grid? */
  highlightsForWin(win: MachineWin, config: ResolvedMachineConfig): CellHighlight;

  /**
   * Machine-specific upgrade definitions. Engine merges these with its own
   * global upgrade list. Stored levels live in the same levelsAtom keyed
   * by upgrade id (assume ids don't collide across machines + engine).
   */
  upgrades?: UpgradeDef[];

  /**
   * Total chip cost per spin given the base bet + current resolved config.
   * Default: identity.
   */
  costPerSpin?(bet: number, config: ResolvedMachineConfig): number;
}

/** Engine-level spin result before commit. */
export interface SpinResult {
  grid: Cell[][];
  wins: MachineWin[];
  totalPayout: Decimal;
  hasJackpot: boolean;
}
