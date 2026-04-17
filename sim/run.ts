import { Archetype } from './types';
import {
  DerivedValues,
  SimState,
  affordableUpgrades,
  canBuy,
  derive,
  initialState,
  nextCost,
} from './state';
import { rollSpinOutcome } from './outcome';
import { RNG } from './rng';
import {
  TerminateReason,
  Trajectory,
  TrajectoryEntry,
  TrajectoryRecorder,
} from './trajectory';

export interface RunConfig {
  /** Primary termination: stop after this much simulated time has elapsed. */
  maxSimTimeMs: number;
  /** Safety cap on spin count to prevent runaway sims. */
  maxSpins: number;
  /**
   * If chips < bet AND no affordable upgrade AND passive income is
   * either 0 or won't close the gap in `softlockWaitMs`, terminate.
   */
  softlockWaitMs: number;
  /** Emit a snapshot trajectory entry every N simulated ms. */
  snapshotIntervalMs: number;
}

export const DEFAULT_CONFIG: RunConfig = {
  maxSimTimeMs: 1000 * 60 * 60 * 4, // 4 sim hours
  maxSpins: 100_000,                // safety cap only
  softlockWaitMs: 1000 * 60 * 10,
  snapshotIntervalMs: 30_000,       // every 30s
};

export function runTrajectory(
  archetype: Archetype,
  seed: number,
  config: RunConfig = DEFAULT_CONFIG,
): Trajectory {
  const rng = new RNG(seed);
  const state = initialState();
  const recorder = new TrajectoryRecorder(archetype.id, seed);

  // --- Apply any pending passive-income ticks up to `targetMs` ---
  // Passive income fires on its own schedule based on the rate upgrade.
  // Between any two decision moments, we compute how many ticks fired
  // and collapse them into one state update — equivalent to the live
  // game's per-tick updates but faster to simulate.
  const accruePassive = (state: SimState, derived: DerivedValues, targetMs: number) => {
    if (derived.passiveAmount === 0) return;
    const rate = derived.passiveRateMs;
    if (rate <= 0) return;

    // First tick fires at lastPassiveTickMs + rate.
    let nextTickAt = state.lastPassiveTickMs + rate;
    let ticks = 0;
    while (nextTickAt <= targetMs) {
      ticks++;
      nextTickAt += rate;
    }
    if (ticks === 0) return;

    const amount = derived.passiveAmount * ticks;
    state.chips = state.chips.add(amount);
    state.lastPassiveTickMs = nextTickAt - rate; // time of the LAST applied tick

    recorder.record({
      simTimeMs: targetMs,
      spinCount: state.spinCount,
      chips: state.chips,
      lifetimeWinnings: state.lifetimeWinnings,
      levels: { ...state.levels },
      event: { kind: 'passive', amount },
    });
  };

  // --- Try to buy: greedy consume while policy keeps returning something ---
  // This lets a policy buy multiple upgrades in one decision moment if a
  // big payout landed and several purchases are now affordable.
  const tryBuyAll = (state: SimState) => {
    // Safety cap — policies shouldn't loop forever, but defend anyway.
    for (let i = 0; i < 50; i++) {
      const pick = archetype.policy(state);
      if (pick === null) return;
      if (!canBuy(state, pick)) {
        // Policy asked for something unaffordable or maxed — treat as "no more".
        return;
      }
      const cost = nextCost(state, pick);
      state.chips = state.chips.sub(cost);
      state.levels[pick] = (state.levels[pick] ?? 0) + 1;

      recorder.record({
        simTimeMs: state.simTimeMs,
        spinCount: state.spinCount,
        chips: state.chips,
        lifetimeWinnings: state.lifetimeWinnings,
        levels: { ...state.levels },
        event: { kind: 'buy', upgradeId: pick, cost, newLevel: state.levels[pick] },
      });
    }
  };

  // --- One spin: accrue passive up to spin start, roll outcome, advance time ---
  const doSpin = (state: SimState): void => {
    const derived = derive(state);

    accruePassive(state, derived, state.simTimeMs);

    // Charge the bet.
    state.chips = state.chips.sub(derived.bet);

    // Roll the outcome. rng advances deterministically.
    const outcome = rollSpinOutcome(derived, rng);

    // Advance sim time by the spin's animation duration. During this
    // window the player can't act, but passive income still ticks.
    const spinStart = state.simTimeMs;
    const spinEnd = spinStart + outcome.durationMs;
    accruePassive(state, derived, spinEnd);
    state.simTimeMs = spinEnd;

    // Commit payout.
    state.chips = state.chips.add(outcome.totalPayout);
    state.lifetimeWinnings = state.lifetimeWinnings.add(outcome.totalPayout);
    state.spinCount++;
    if (outcome.hasJackpot) state.jackpots++;

    recorder.record({
      simTimeMs: state.simTimeMs,
      spinCount: state.spinCount,
      chips: state.chips,
      lifetimeWinnings: state.lifetimeWinnings,
      levels: { ...state.levels },
      event: {
        kind: 'spin',
        bet: derived.bet,
        payout: outcome.totalPayout,
        winCount: outcome.wins.length,
        hadJackpot: outcome.hasJackpot,
      },
    });
  };

  // --- Snapshot emitter ---
  // Periodic state samples for later income-rate / plateau analysis.
  // `chipsAtLastSnapshot` lets each snapshot report chips earned during
  // its interval (the derivative of the curve, cheap to aggregate later).
  let nextSnapshotAtMs = config.snapshotIntervalMs;
  let chipsAtLastSnapshot = state.chips;
  let lifetimeAtLastSnapshot = state.lifetimeWinnings;

  const emitSnapshotsUpTo = (targetMs: number) => {
    while (nextSnapshotAtMs <= targetMs) {
      // Snap time is exactly the boundary — we've accrued passive up to
      // state.simTimeMs elsewhere, but a snapshot can land mid-interval.
      // We anchor the snapshot at the boundary time regardless.
      const earnedSince = state.lifetimeWinnings.sub(lifetimeAtLastSnapshot);
      recorder.record({
        simTimeMs: nextSnapshotAtMs,
        spinCount: state.spinCount,
        chips: state.chips,
        lifetimeWinnings: state.lifetimeWinnings,
        levels: { ...state.levels },
        event: { kind: 'snapshot', earnedSince },
      });
      chipsAtLastSnapshot = state.chips;
      lifetimeAtLastSnapshot = state.lifetimeWinnings;
      nextSnapshotAtMs += config.snapshotIntervalMs;
    }
    void chipsAtLastSnapshot; // kept for future per-snapshot chip-delta if needed
  };

  // --- Player pacing between spins ---
  // After a spin commits, the player waits some amount of time before
  // the next spin: autospin delay if they're using autospin and it's
  // unlocked, else the player's manual click delay.
  const nextPlayerDelayMs = (derived: DerivedValues): number => {
    if (archetype.player.prefersAutospin && derived.autospinUnlocked) {
      return derived.autospinDelayMs;
    }
    const rngFn = () => rng.next();
    let base = archetype.player.manualClickDelayMs(rngFn);
    // Optional break behavior
    if (archetype.player.takesBreak && archetype.player.awayDurationMs) {
      if (archetype.player.takesBreak(rngFn)) {
        base += archetype.player.awayDurationMs(rngFn);
      }
    }
    return base;
  };

  // --- Softlock check ---
  // Player has less than bet in chips AND no affordable upgrade that
  // would help AND passive income won't close the gap within the
  // softlockWaitMs window. That's terminal.
  const isSoftlocked = (state: SimState): boolean => {
    const derived = derive(state);
    if (state.chips.gte(derived.bet)) return false;
    // If any affordable purchase exists, they could buy it and potentially change things
    if (affordableUpgrades(state).length > 0) return false;
    // Compute passive income over the wait window
    if (derived.passiveAmount === 0 || derived.passiveRateMs === 0) return true;
    const ticks = Math.floor(config.softlockWaitMs / derived.passiveRateMs);
    const projectedChips = state.chips.add(derived.passiveAmount * ticks);
    return projectedChips.lt(derived.bet);
  };

  // --- Main loop ---
  let terminateReason: TerminateReason | null = null;
  while (terminateReason === null) {
    // Decision moment: try to buy upgrades, then spin (with pacing), or wait.
    tryBuyAll(state);

    const derived = derive(state);

    if (state.chips.lt(derived.bet)) {
      if (isSoftlocked(state)) {
        terminateReason = 'softlock';
        break;
      }
      // Not softlocked — just wait for passive income to accumulate enough.
      // Fast-forward by one full passive-tick rate and try again.
      const waitMs = derived.passiveRateMs || 1000;
      const targetMs = state.simTimeMs + waitMs;
      accruePassive(state, derived, targetMs);
      state.simTimeMs = targetMs;
      emitSnapshotsUpTo(state.simTimeMs);
      if (state.simTimeMs >= config.maxSimTimeMs) {
        terminateReason = 'max_time';
        break;
      }
      continue;
    }

    // Can afford a spin — wait for the player's pacing first.
    const delay = nextPlayerDelayMs(derived);
    const postDelayMs = state.simTimeMs + delay;
    accruePassive(state, derived, postDelayMs);
    state.simTimeMs = postDelayMs;

    // Spin!
    doSpin(state);
    emitSnapshotsUpTo(state.simTimeMs);

    // Exit conditions
    if (state.spinCount >= config.maxSpins) {
      terminateReason = 'max_spins';
      break;
    }
    if (state.simTimeMs >= config.maxSimTimeMs) {
      terminateReason = 'max_time';
      break;
    }
  }

  const terminateEntry: TrajectoryEntry = {
    simTimeMs: state.simTimeMs,
    spinCount: state.spinCount,
    chips: state.chips,
    lifetimeWinnings: state.lifetimeWinnings,
    levels: { ...state.levels },
    event: { kind: 'terminate', reason: terminateReason },
  };
  recorder.record(terminateEntry);

  return recorder.finalize({
    spinCount: state.spinCount,
    simTimeMs: state.simTimeMs,
    chips: state.chips,
    lifetimeWinnings: state.lifetimeWinnings,
    levels: { ...state.levels },
    terminateReason,
  });
}
