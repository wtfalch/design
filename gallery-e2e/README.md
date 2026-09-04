# gallery-e2e

Four hundred and eighty checks over the design system's gallery: what every
component looks like, whether axe can fault it, and whether motion actually
stops when the OS asks.

```bash
# the gallery still lives in tf until the components move (phase 3)
cd ../../tf/dashboard && npm run build

cd ../../design/gallery-e2e
pnpm e2e:docker                          # check
pnpm e2e:docker --update-snapshots        # re-baseline
pnpm e2e:docker --grep toggle             # one component
pnpm a11y:record                          # re-record the known violations
```

## The suites

| | |
|---|---|
| `visual.spec.ts` | 68 specimens × 3 themes = 204 images |
| `a11y.spec.ts` | axe per specimen (structure once, contrast per theme) |
| `reduced-motion.spec.ts` | the durations actually collapse in the browser |
| `manifest.spec.ts` | the committed work list still matches the gallery |

## Why the container

`--font` is `-apple-system`: SF on macOS, whatever fontconfig picks on Linux.
Baselines written on one and checked on the other differ on every glyph of every
image, so the suite fails everywhere at once and says nothing about the change
that triggered it. Since the token names the *system* stack deliberately, the
answer is to fix the machine rather than to ship fonts — every committed baseline
is made inside `mcr.microsoft.com/playwright:v1.62.1-noble`.

`pnpm e2e` on a laptop still works and is useful while iterating. It writes to
`__screenshots__/darwin/`, which CI never reads.

## The two numbers, and how they were arrived at

`maxDiffPixelRatio: 0` and `threshold: 0.02`. Both were wrong first, in ways
worth keeping:

- **`maxDiffPixelRatio: 0.002`** let a 6px→7px radius change through on 203 of
  204 specimens. A corner is about fifteen pixels; the allowance on a small
  stage was eighty-six.
- **At ratio zero, the same change still passed everywhere** — because
  `threshold` defaults to 0.2, and a one-pixel radius only moves anti-aliased
  corner pixels by less than that. Nothing was *counted* as differing.
- **`threshold: 0` is genuinely flaky**: three runs of an unchanged build gave
  1, 0 and 2 failures.

0.02 is measured: four runs of an unchanged build with no spurious failures, and
100 of 205 specimens failing on that same one-pixel radius change.

## Three sources of non-determinism, all real

- **A clock.** `Callout`'s Timed variant draws a countdown bar off the wall
  clock, so its baseline was a photograph of how long the page took to load.
  `page.clock.install` freezes it.
- **A theme applied in an effect.** `applyTheme` stamps `data-theme` after
  mount, so a scan starting when the stage appears can read the previous
  palette. Every spec waits for the stamp.
- **A live transition.** Playwright's `animations: 'disabled'` is a *screenshot*
  option; an axe scan reads a running page. `card / Selectable` failed contrast
  on one run in four, against a background it only holds for 120ms. The scans
  inject `transition: none`.

## `a11y-known.json`

Seven entries: three components missing a `label` (all of them the hand-written
markup that has no component behind it — Button, Input, Textarea), and four
contrast findings. It is a **to-do list with a test attached**, not a
suppression file: the spec fails on anything new *and* on an entry that has
stopped being true, so a fixed component cannot leave its excuse behind for the
next real failure to hide under. Phase 5 empties it.

Three of the four contrast entries are the slider's *disabled* state, which WCAG
1.4.3 exempts as an inactive control. They are recorded rather than dismissed
because "axe says so and we disagree" should be written down somewhere.

## CI

Not wired yet, and deliberately: the gallery still lives in tf, so CI here has
nothing to build. Phase 3 moves it into this repo and the workflow lands with
it.
