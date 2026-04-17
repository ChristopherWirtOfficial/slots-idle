import { Archetype } from './types';
import { burnout } from './policies/burnout';
import { greedyCheap } from './policies/greedyCheap';
import { randomAffordable } from './policies/randomAffordable';
import { roiOptimal } from './policies/roiOptimal';
import { stratumLocked } from './policies/stratumLocked';
import { autospinner, fastClicker, idleHeavy, slowClicker } from './players/players';

/**
 * Default archetype set. Each represents a coherent play style — a
 * believable pairing of pacing and decision-making. When tuning, we
 * want all of these to produce "healthy" trajectories (steady upgrade
 * cadence, no long dead zones, no runaway glut).
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: 'grinder',
    label: 'The Grinder',
    description: 'Fast manual clicks, buys whatever is cheapest.',
    player: fastClicker,
    policy: greedyCheap,
  },
  {
    id: 'thoughtful',
    label: 'The Thoughtful',
    description: 'Slow deliberate play, picks best ROI each time.',
    player: slowClicker,
    policy: roiOptimal,
  },
  {
    id: 'guide-follower',
    label: 'The Guide-Follower',
    description: 'Moderate pacing, follows a fixed upgrade order.',
    player: fastClicker,
    policy: stratumLocked,
  },
  {
    id: 'auto-idler',
    label: 'The Auto-Idler',
    description: 'Prefers autospin + ROI — set and watch.',
    player: autospinner,
    policy: roiOptimal,
  },
  {
    id: 'idle-chaos',
    label: 'The Idle-Chaos',
    description: 'Walks away often, buys randomly. Stress test.',
    player: idleHeavy,
    policy: randomAffordable,
  },
  {
    id: 'burnout',
    label: 'The Burnout',
    description: 'Fast manual clicks, buys the most expensive affordable upgrade. Stress-test for softlock protection.',
    player: fastClicker,
    policy: burnout,
  },
];

export function findArchetype(id: string): Archetype {
  const a = ARCHETYPES.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown archetype: ${id}`);
  return a;
}
