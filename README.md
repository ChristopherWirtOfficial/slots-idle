# Lucky Idle Slots

An idle/incremental casino slots game. 1930s art-deco parlour aesthetic, jotai state, fixed-timestep tick loop.

## Local development

```bash
npm install
npm run dev        # Vite dev server (hot reload)
npm run typecheck  # TypeScript check
npm run build      # Production bundle → dist/
npm run preview    # Serve dist/ locally
```

Optional single-file bundle (e.g. Claude artifact / offline paste):

```bash
npm run build:single   # dist/index.html — one inlined HTML file (overwrites Vite’s index.html)
```

## GitHub Pages

1. Repo **Settings → Pages**: set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main`; the workflow in `.github/workflows/deploy-pages.yml` builds with Vite and publishes `dist/`.

The app uses a relative asset base (`./`) so it works at `https://<user>.github.io/<repo>/` without editing the repo name in config.

## Architecture

- `src/game/` — pure logic: symbols, spin math, upgrade defs
- `src/tick/` — fixed-timestep tick loop + `useTick` / `useAtomicTick` hooks
- `src/state/` — jotai atoms split by concern (economy, upgrades, prestige, session, actions)
- `src/hooks/` — `useAutospin`, `usePassiveIncome` — bind action atoms to tick frequencies
- `src/components/` — React components (emotion for styles)
