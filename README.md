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

The site is served from the **`gh-pages` branch**, which doubles as both the
live production deploy and a host for per-PR previews. The branch's file tree
maps directly to URL paths.

1. Repo **Settings → Pages**: under **Build and deployment**, set **Source** to
   **Deploy from a branch**, branch **`gh-pages`**, folder **`/ (root)`**.
   (One-time. The `gh-pages` branch is created automatically by the first
   workflow run.)
2. Push to `main` → `.github/workflows/deploy-pages.yml` builds and publishes
   to the branch root → `https://<user>.github.io/<repo>/`.

### Per-PR previews

Open a PR (from a same-repo branch) and `.github/workflows/pr-preview.yml`
builds it and publishes to `pr-preview/pr-<N>/`, then comments the link:
`https://<user>.github.io/<repo>/pr-preview/pr-<N>/`. Previews are
**never cleaned up** — the branch keeps a running history of past builds. The
production deploy uses `clean-exclude: pr-preview/` so refreshing `main` never
wipes them. (Fork PRs are skipped: their read-only token can't push.)

The app uses a relative asset base (`./`) so it works at any depth —
production root or a `pr-preview/pr-N/` sub-path — without config changes.

## Architecture

- `src/engine/` — spin math, grid, animation helpers
- `src/machines/` — machine configs (e.g. fruit machine symbols, paylines, evaluate)
- `src/tick/` — fixed-timestep tick loop + `useTick`
- `src/state/` — jotai atoms (economy, upgrades, prestige, session, actions)
- `src/hooks/` — autospin, passive income, audio, catch-up
- `src/components/` — React UI (Emotion)
- `sim/` — Node/tsx CLI sims and analysis (optional; not part of the web build)
