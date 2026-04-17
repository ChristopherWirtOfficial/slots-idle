import Decimal from 'break_infinity.js';

/**
 * A single recorded moment in a simulated run. Every event with
 * analytical relevance produces an entry. Plotting and aggregation
 * work from arrays of these.
 */
export interface TrajectoryEntry {
  simTimeMs: number;
  spinCount: number;
  chips: Decimal;
  lifetimeWinnings: Decimal;
  levels: Record<string, number>;
  event: TrajectoryEvent;
}

export type TrajectoryEvent =
  | { kind: 'spin'; bet: number; payout: Decimal; winCount: number; hadJackpot: boolean }
  | { kind: 'buy'; upgradeId: string; cost: Decimal; newLevel: number }
  | { kind: 'passive'; amount: number }
  | { kind: 'idle_start'; untilMs: number }
  | {
      kind: 'snapshot';
      /** Cumulative chips earned since last snapshot — useful for income-rate derivation. */
      earnedSince: Decimal;
    }
  | { kind: 'terminate'; reason: TerminateReason };

export type TerminateReason =
  | 'max_spins'
  | 'max_time'
  | 'softlock'; // no money, no passive income, no affordable upgrade

export interface Trajectory {
  archetypeId: string;
  seed: number;
  entries: TrajectoryEntry[];
  /** Summary of the final state — convenience so aggregators don't have
   *  to traverse the full entry list. */
  final: {
    spinCount: number;
    simTimeMs: number;
    chips: Decimal;
    lifetimeWinnings: Decimal;
    levels: Record<string, number>;
    terminateReason: TerminateReason;
    /** Cumulative ms spent with chips < bet (waiting for passive to recover). */
    timeUnderBetMs: number;
    /** Number of distinct times the player dipped below bet. */
    underBetEpisodes: number;
  };
}

/**
 * In-memory collector used during a run. Entries pushed as events fire;
 * `finalize` returns the immutable Trajectory.
 */
export class TrajectoryRecorder {
  private entries: TrajectoryEntry[] = [];
  constructor(private archetypeId: string, private seed: number) {}

  record(entry: TrajectoryEntry): void {
    this.entries.push(entry);
  }

  finalize(final: Trajectory['final']): Trajectory {
    return {
      archetypeId: this.archetypeId,
      seed: this.seed,
      entries: this.entries,
      final,
    };
  }
}
