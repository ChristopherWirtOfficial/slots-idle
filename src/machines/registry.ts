import { Machine } from '../engine/types';
import { classic3x3 } from './classic3x3';

/**
 * All registered machines. The shape accommodates plurality even though
 * we only ship one today.
 */
export const MACHINES: Machine[] = [classic3x3];

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
