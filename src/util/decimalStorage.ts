import Decimal from 'break_infinity.js';

/**
 * Storage adapter for atomWithStorage that serializes Decimal values.
 *
 * On write: stores the Decimal as its string form ("20", "1.23e42", etc).
 * On read: wraps the parsed value with `new Decimal()`, which accepts both
 *   strings (native format) and numbers (legacy saves from before the
 *   big-number migration). Existing numeric chip balances rehydrate
 *   transparently — no explicit migration needed.
 *
 * Follows the SyncStorage interface jotai-utils expects:
 * getItem/setItem/removeItem, synchronous, localStorage-backed.
 */
export const decimalStorage = {
  getItem(key: string, initialValue: Decimal): Decimal {
    const raw = localStorage.getItem(key);
    if (raw === null) return initialValue;
    try {
      const parsed = JSON.parse(raw);
      return new Decimal(parsed);
    } catch {
      return initialValue;
    }
  },
  setItem(key: string, value: Decimal): void {
    try {
      localStorage.setItem(key, JSON.stringify(value.toString()));
    } catch {
      // Quota exceeded or storage blocked — just drop the write.
    }
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};
