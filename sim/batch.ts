import { ARCHETYPES } from './archetypes';
import { DEFAULT_CONFIG, RunConfig, runTrajectory } from './run';
import { Trajectory } from './trajectory';
import { Archetype } from './types';

export interface BatchConfig extends RunConfig {
  /** Number of seeded runs per archetype. */
  seedsPerArchetype: number;
  /** Starting seed — subsequent seeds are sequential. */
  seedStart: number;
  /** Which archetypes to run — defaults to all. */
  archetypes?: Archetype[];
}

export const DEFAULT_BATCH: BatchConfig = {
  ...DEFAULT_CONFIG,
  seedsPerArchetype: 100,
  seedStart: 1,
};

export interface BatchResult {
  config: BatchConfig;
  trajectories: Trajectory[];
}

export function runBatch(config: BatchConfig = DEFAULT_BATCH): BatchResult {
  const archetypes = config.archetypes ?? ARCHETYPES;
  const trajectories: Trajectory[] = [];

  for (const arch of archetypes) {
    for (let i = 0; i < config.seedsPerArchetype; i++) {
      const seed = config.seedStart + i;
      const t = runTrajectory(arch, seed, config);
      trajectories.push(t);
    }
  }

  return { config, trajectories };
}
