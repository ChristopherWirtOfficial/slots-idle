// Tick system constants.
export const BASE_TICKRATE = 60;
export const TICK_LENGTH = 1000 / BASE_TICKRATE; // ~16.67ms

// If the loop falls behind (tab backgrounded, heavy frame), cap catch-up ticks.
// Prevents a 10-second pause from unleashing 600 queued ticks at once.
export const MAX_QUEUED_TICKS = 5;
