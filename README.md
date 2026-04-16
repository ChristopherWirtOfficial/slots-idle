# Lucky Idle Slots

An idle/incremental casino slots game. 1930s art-deco parlour aesthetic, jotai state, fixed-timestep tick loop.

## Dev

```
npm install
npx tsc --noEmit   # typecheck
node build.mjs     # produce dist/index.html (single-file SPA)
```

## Architecture

- `src/game/` — pure logic: symbols, spin math, upgrade defs
- `src/tick/` — fixed-timestep tick loop + `useTick` / `useAtomicTick` hooks
- `src/state/` — jotai atoms split by concern (economy, upgrades, prestige, session, actions)
- `src/hooks/` — `useAutospin`, `usePassiveIncome` — bind action atoms to tick frequencies
- `src/components/` — React components (emotion for styles)
