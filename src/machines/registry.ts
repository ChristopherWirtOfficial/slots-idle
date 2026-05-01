import { Machine } from '../engine/types';
import { fruitMachine } from './fruitMachine';

/**
 * All registered machines. The shape accommodates plurality even though
 * we only ship one today — adding a new machine means creating a folder
 * under machines/, implementing the Machine interface (symbols, paylines
 * or cluster rules, evaluate, highlightsForWin, resolveConfig, its own
 * upgrade list), and appending its export to MACHINES below.
 *
 * Each machine's internals are self-contained: symbols, payline logic,
 * evaluation, and highlighting are per-machine; globals like bet size,
 * wild chance, passive income, and autospin live in engine/upgrades.ts
 * and apply to every machine uniformly.
 */
export const MACHINES: Machine[] = [fruitMachine];

/**
 * HARDCODED ACTIVE MACHINE. Boot-only selection.
 *
 * Runtime machine-switching is explicitly out of scope. To allow it later:
 *   - Reset all reel state (different topology = different reel atoms)
 *   - Clear pendingResult / lastResult / lastFloat
 *   - Decide per-machine vs global level persistence
 *   - Per-machine upgrade lists in the panel (some upgrades from machine A
 *     may have no meaning under machine B)
 * None of that is handled today.
 */
export const ACTIVE_MACHINE: Machine = MACHINES[0];
