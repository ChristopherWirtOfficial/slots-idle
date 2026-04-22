# Design Notes

Decisions and ideas we've made or spitballed but haven't implemented.
Kept here so they don't get lost between sessions.

## Core gameplay arc

- First full run should cliff into "you should prestige" at roughly
  45 min (fast/active players) to 1h15-1h30 (slow/patient players).
  Active play is rewarded with a faster arc — this is intentional,
  not a bug.
- Cost curves on standard upgrades must explicitly plateau at that
  cliff. Pushing past the plateau without prestige should feel like
  a bad choice, not an impossible one.
- Subsequent prestige runs are shorter — the permanent progression
  compounds. Each run is a faster lap of the same arc.

## Prestige system

### Pinned decisions

**Currency**: prestige earns points (working name TBD). Points are spent
on a store AND on card packs. Shared economy — card packs compete with
store upgrades for spend. This tension is the main "what am I doing
this prestige" decision.

**Points formula**: `points = floor((lifetimeChips / K) ^ exp)` where
`exp` is a tunable constant starting at 1.0 (linear). Superlinear
(1.05-1.1) is the dial for "reward plateau-pushing" when we want it.
Leaving at 1.0 for initial tuning — undertune prestige slightly at
first; it's easier to buff than to nerf.

**Store = cost-reduction tracks**, one per upgrade. Each track's effect:
`effectiveCost = baseCost / (1 + r × k)` where r is track level,
k is a per-upgrade scalar. Divisor math (never hits zero, always
buyable), percent display in the UI (reads as "−45% bet cost"). Idiom
matches Cookie Clicker / Antimatter Dimensions / Trimps.

Cost reductions serve double duty: (a) accelerate subsequent runs
back to where you were; (b) let you push further into the exponential
cost curve than an un-prestiged player could.

**Milestones** on prestige count unlock abilities/content distinct
from store purchases. Early milestones are permanent versions of
things currently in the base game:
- Permanent autospin (some tier) at a specific prestige count
- First extraReel / extraRow at a specific prestige count
- Possibly: new symbol, new payline tier, etc.

**Card packs**: bought with prestige points. Cards are the deepest
permanent layer of the game — survive EVEN a future meta-prestige
("reset everything but your cards") that resets the store.
Paylines-as-cards is the strong anchoring idea. Cards potentially
also govern symbol payouts, wild probability, etc.

### Open questions (decide later)

- Do bet/multi keep max levels, or go uncapped and rely on the steep
  cost curve to plateau naturally? Clean split would be:
  - Numerical upgrades (bet, multi, passive amt) → uncapped, reductions extend
  - Physical-cap upgrades (autospin delay, tick rate, reel/row count)
    → capped, prestige raises cap
  But uncapped-plus-reductions might feel muddier than capped-with-
  explicit-ceiling. Pending real playtesting.

- Point-to-upgrade ratio. At ~1000 points per prestige, does one
  reduction level cost ~50 (many purchases per run, commit to one
  track) or ~200 (few purchases per run, spread thin)? Depends on how
  many tracks we want active per run and on card-pack costs.

- Card acquisition rate. Depends on points-per-prestige and
  pack-cost balance.

- Card mechanics beyond paylines. Wild probability, symbol-specific
  payout tweaks, etc., are all candidates. Surface-area discussion
  pending.

### Design principle

Prestige is just one stepping stone. The game is comfortable having
MORE reset layers above prestige ("reset everything but your cards"
is an explicit future layer). Each layer's currency is the "points
of the previous layer's runs." Design each layer so it can eventually
become a mid-game layer, not necessarily the top.

## Upgrade set (current, to retune)

Multiplier's current shape is a trap — its per-chip efficiency sits
below bet's at every level, so no policy ever reaches for it. Fix
shape must give multiplier a crossover point where it actually beats
bet at some level. Candidates:
- Multiplicative `1.10^lvl` or `1.15^lvl` instead of additive `1 + 0.1*lvl`
- Gentler cost curve so earlier levels are reachable
- Different semantic role (only multiplies jackpots? only passive?)

Autospin base cost should land the unlock at ~10-15 min for active
players. Current 300 base is too steep; gut-check target is ~250
but needs to be confirmed against a sim that tracks first-purchase
times after other tuning.

bet's additive `+1 per level` shape is self-balancing and stays.
Harmonic diminishing returns from the bet formula itself (1→2 is
2x, 5→6 is 1.2x) means the decision naturally de-emphasizes over
time without explicit tuning.

## Items on the "almost certainly going away" list

- Prestige in its current form (pure multiplier) — being replaced
  with the store/milestone system described above.
- `totalEverWon` atom — probably prestige-adjacent stat, dies
  with prestige overhaul.

## Sim observations worth preserving

- 0% softlock rate with current game (30 starting chips + baseline
  passive income from level 0). The real game's anti-softlock is
  working; the concern was a sim bug I had.
- ROI-optimal beats greedy-cheap by only ~13% in lifetime earnings.
  Decisions don't matter enough. Needs upgrade set with real
  strategic branching before this will improve.
- Current inter-purchase gap: ~5 min median — too long for early
  game; should be ~1-2 min for the first 30 minutes.
