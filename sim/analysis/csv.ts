import { BatchResult } from '../batch';

/**
 * Write one row per trajectory entry. Columns are dense — one column
 * per upgrade level, so downstream plotting can pivot easily.
 *
 * Output is suitable for pandas `read_csv` or spreadsheet import.
 */
export function trajectoriesToCsv(batch: BatchResult): string {
  // Collect all upgrade IDs seen across all trajectories
  const upgradeIds = new Set<string>();
  for (const t of batch.trajectories) {
    for (const e of t.entries) {
      for (const id of Object.keys(e.levels)) upgradeIds.add(id);
    }
  }
  const sortedUpgrades = [...upgradeIds].sort();

  const headers = [
    'archetype',
    'seed',
    'simTimeMs',
    'spinCount',
    'chips',
    'lifetimeWinnings',
    'event',
    'eventDetail',
    ...sortedUpgrades.map((id) => `lvl_${id}`),
  ];

  const rows: string[] = [headers.join(',')];

  for (const t of batch.trajectories) {
    for (const e of t.entries) {
      const ev = e.event;
      let detail = '';
      switch (ev.kind) {
        case 'spin':
          detail = `bet=${ev.bet};payout=${ev.payout.toString()};wins=${ev.winCount}${ev.hadJackpot ? ';jackpot' : ''}`;
          break;
        case 'buy':
          detail = `${ev.upgradeId}@${ev.newLevel};cost=${ev.cost.toString()}`;
          break;
        case 'passive':
          detail = `amount=${ev.amount}`;
          break;
        case 'idle_start':
          detail = `untilMs=${ev.untilMs}`;
          break;
        case 'terminate':
          detail = ev.reason;
          break;
      }

      const row = [
        t.archetypeId,
        String(t.seed),
        String(e.simTimeMs),
        String(e.spinCount),
        e.chips.toString(),
        e.lifetimeWinnings.toString(),
        ev.kind,
        detail,
        ...sortedUpgrades.map((id) => String(e.levels[id] ?? 0)),
      ];

      rows.push(row.map(csvEscape).join(','));
    }
  }

  return rows.join('\n');
}

function csvEscape(s: string): string {
  // Escape quotes and commas
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
