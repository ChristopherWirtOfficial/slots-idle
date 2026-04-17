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

## Prestige system (deferred, not yet designed)

Direction but not detail:

- Its own currency, not a pure multiplier. Spend in a store.
- Store contains upgrades that persist across runs.
- Milestones on prestige count: e.g. "P2 milestone unlocks permanent
  autospin tier 1" — progression layers beyond the currency itself.
- Unlocks potentially include:
  - Permanent autospin t1 from milestone (e.g. P2)
  - First extraReel or extraRow as a prestige-store purchase (maybe P1)
  - New payline shapes as card-pack-style pulls (upgrade existing
    lines, unlock entirely new ones)
  - Other structural unlocks TBD

Paylines-as-cards is a strong idea worth preserving — slots usually
treat paylines as a fixed asset; turning them into collectible
content gives real strategy space that isn't just numbers-go-up.

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
