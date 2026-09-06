# CLAUDE.md — agent guide for `design`

`@wtfalch/design` is wtfalch's design system. It came out of tf's dashboard and
is published so every product can use it and none of them have to look alike.
Nothing in it is one product's: a mark lives in `Brand` by name, a product's
animation of its mark lives in that product, and no class or keyframe carries a
product's initials.
Three things in one pnpm workspace:

| | |
|---|---|
| `packages/design` | the package — components, `tokens.css`, themes, the contrast measurement |
| `gallery` | the catalogue: every component, one specimen per URL, importing the package by its public entry |
| `gallery-e2e` | Playwright over the gallery: a screenshot per specimen per theme, axe per theme, a keyboard walk |

```bash
pnpm install
pnpm build && pnpm lint && pnpm typecheck && pnpm test          # the gate; run before reporting done
cd gallery-e2e && bash ../tools/e2e-docker.sh npx playwright test   # the visual suite, in the container
```

Behaviour comes from React Aria Components 1.21 — roles, keyboard, focus
management, touch, dismissal. Every pixel is ours, styled off the token
vocabulary through `data-*` attributes. No Tailwind, no utility layer. The
package README has the vocabulary and how to write a theme. This file has the
rules, each with the bug that produced it, because a rule without its reason
gets argued away by the next person who finds it inconvenient. Most of them
were learned in tf and moved here with the code on 2026-09-05; tf's
`dashboard/CLAUDE.md` keeps the ones about *using* the system.

## The docblocks are the documentation

Every component keeps the docblock it was written with. They say what a control
is *for* and which mistake it exists to prevent, and several are the only
written record of a bug that shipped. Keep them verbatim through a migration.
Compressing counts as removing: a rewrite that loses a fact is a deletion with
extra steps.

## Screenshot before, not after

The visual suite answers one question: did a change move a pixel it did not
mean to. That only works if the baseline predates the change. The components
were photographed **as they were in tf**, before a line of React Aria landed, so
every migration arrived as a diff against the thing it replaced. A migration
that changes nothing visible is the target; one that changes something is
allowed to, once, explained in the commit.

- **Run in `mcr.microsoft.com/playwright:v1.62.1-noble`, locally too**
  (`tools/e2e-docker.sh`). `-apple-system` is SF on macOS and something else on
  the runner, so a baseline made outside the container is wrong on every other
  machine. `__screenshots__/darwin` is gitignored for this reason; CI reads only
  `linux`.
- **`--update-snapshots` lands in its own PR**, never mixed with the change that
  moved the pixels. A token change moves every baseline — that is the suite
  working — and a mixed diff is unreviewable.
- **The thresholds are measured, not guessed.** `maxDiffPixelRatio: 0.002` let a
  6→7px radius change through on 203 of 204 specimens: a corner is about 15
  pixels and the allowance was 86. At ratio zero it *still* passed, because
  `threshold` defaults to 0.2 per pixel and anti-aliased corner pixels were
  never counted as differing. `threshold: 0` was flaky — 1, 0, 2 failures on an
  unchanged build. `0.02` is where four clean runs meet 100 of 205 specimens
  failing on that same 1px change.
- **`animations: 'disabled'` freezes a screenshot, not an axe scan.** One card
  failed contrast one run in four against a colour it holds for 120ms. The
  other two non-determinism sources found by running it: a countdown drawn off
  the wall clock, and a theme applied in an effect so a scan read the previous
  palette.
- **A window is outside the stage.** `visual.spec.ts` photographs each
  specimen's stage, and a modal is portalled out of it — so for `Modal` and
  `Dialog` the suite had a picture of the button and none of the window. Three
  regressions lived there unphotographed until a person opened one: React
  Aria's `Heading` wrapped every title in an `<h2>` with the browser's margins
  (the head went 44 → 86), the split filed `.dialog` ahead of `.modal` so every
  dialog opened 760 wide, and the close cross lost its one-letter class rule to
  the split and fell back to the picker's 34px tile. `windows.spec.ts` opens
  each window, photographs the viewport and measures the head. A specimen that
  portals needs a test of its own; the stage cannot see it.
- **`a11y-known.json` records where things stand**, and fails on anything new
  *and* on any entry that stops being true.
- **No `devices[...]` descriptor in the Playwright config.** It spoofs a
  user-agent string, React Aria's press handling does platform detection off
  it, and a spoofed UA makes the library behave differently from how it will in
  production. And **test activation, not click events**: Space activates a
  React Aria button through `onPress` and fires no native click, so a test
  counting clicks calls a working button broken.

## The vocabulary

- **Three kinds of token, and `tokens.test.ts` holds all three lists to
  `tokens.css` in both directions.** 47 themeable, 16 derived, 3 fixed. A token
  added to the stylesheet and to no list fails the suite rather than becoming a
  fourth, undocumented category. The split is what turned "twenty tokens no
  theme can name" from an omission into a decision: `--text-*` and `--space-*`
  are `calc()` off `--font-size` and `--density`, and a step written as a
  literal is a scale that stopped scaling.
- **A token, never a value.** No hex, no pixel spacing, no font size in a
  component's CSS. Four pixels a step, `--space-1` … `--space-15`, and the name
  is the multiple — `tokens.test.ts` fails when `--space-3` is not 12px.
  `--nudge: 2px` is optical alignment, not a spacing step, and does not scale.
- **An undefined custom property renders as nothing, silently.** `var(--line)`
  with no `--line` anywhere invalidates the whole declaration at computed-value
  time — no error, no fallback, no border. `.think-body` sat on exactly that
  for weeks. `tools/audit-css.mjs` finds the three shapes: undefined with no
  fallback (a bug); a slot used with a fallback and declared nowhere (themeable
  in appearance only — `--illo-paper` and `--shadow-lg` were this); and a token
  declared on `:root` outside `tokens.css` (`--control` was this, used seven
  times and reachable by no theme). The last two are now in the vocabulary.
- **Contrast is measured, not judged.** 4.5:1 for text, 3:1 for a control
  boundary, against every theme: `contrast.test.ts`, and `ratio()` ships so a
  consumer can measure their own. The rule had been written down for months.
  The first measurement found the Night theme's primary button at 2.72:1 — the
  exact pair and ratio `tokens.css` records as the reason `--on-accent` exists —
  and `--info` at 3.96:1 on both light palettes.
- **Two rules outrank any theme.** `color-scheme` follows `Theme.scheme`, and
  `prefers-reduced-motion` collapses every duration to zero **with
  `!important`** — a theme is applied as inline styles on the root, an inline
  declaration beats a stylesheet rule, and the three built-ins only ever passed
  the reduced-motion test because none of them sets a duration. Both are tests,
  and the second is measured in a browser as well as in the stylesheet.
- **Tint into `--panel`, not `--panel-2`.** Mixing a mid tone into the darker
  surface moves the background toward the text; on a light theme a label
  dropped from 4.7:1 to 3.9:1. This is why the pill tones mix at 10% into
  `--panel`.
- **`--border` and `--border-strong` are different jobs.** A hairline divider
  and a control outline have different thresholds and cannot share a value.
  They did, and the value could only be right for one of them.

- **A product is a layer between the system and a theme, and it ships as one
  entry.** `src/products/<name>.ts` holds a product's identity (the tokens
  that make it itself under every theme: font, shape, density), its themes and
  its default; `build-products.mjs` writes `dist/<name>.css` (tokens, identity
  on `:root`, the default theme until one is picked, the components, one rule
  per theme) and `src/<name>.ts` is the entry whose `Brand`, `THEMES` and
  `applyTheme` are the product's. A site imports its product and nothing of
  anyone else's. The identity layer exists because valet's two palettes each
  restated valet's font and corners, and a theme shared between products would
  otherwise fall back to tf's font wherever it kept quiet: a theme is a sparse
  map, and what it is sparse *over* has to be the product, not the base.
  Nobody writes a `:root[data-theme]` rule by hand, because a copy drifts from
  the object the contrast test measured. Before 0.3.0 valet kept its theme in
  its own repo and re-derived first paint, the measurement and a review page
  there.
- **Three derived tokens are re-derived under `[data-theme]`.** `--control`,
  `--illo-paper` and `--focus-ring` are `var()` expressions, and declared on
  `:root` alone they resolve against the root's palette and inherit as finished
  values. A theme on a subtree got the root's control surface and focus ring
  under its own panels: black inputs and a teal ring on a light theme painted
  beside a dark one, 2026-09-05.

## The CSS

- **A theme never ships a selector.** The moment a theme can write a rule,
  every theme is a fork of the stylesheet and no change to a component is safe
  again. Where a theme needs a layer that values cannot reach — a paper grain,
  a vignette — the base CSS pre-declares the slot and the theme fills it.
- **`src/styles/index.css` is the cascade, written down.** Two rules of equal
  specificity are decided by which came last, so the order of the sheets is
  behaviour rather than tidiness. `scripts/copy-css.mjs` flattens them into one
  file at build time; the `@import` list is the order, where it can be reviewed.
- **`*` does not match pseudo-elements, and `box-sizing` is not inherited.** The
  reset is `*, *::before, *::after`. Without it every `::before` is
  content-box, invisible until one of them has a border, and then a 16px ring
  renders 18px with its tick a pixel off in both directions. `css.test.ts`.
- **A mask cannot land on half a pixel.** `background-position: center` in a
  box whose spare room is odd gets snapped, and Chrome rounds one axis up and
  the other down. Glyph sizes stay even against their box. `css.test.ts`.
- **Nothing drawn over a surface may name the colour it sits on.** `Skeleton`
  defaulted to `--panel-2` and vanished on a card that was `--panel-2`; `.pill`
  did the identical thing the same day. `currentColor` at low alpha is a step
  from whatever is behind it, on every surface, in every theme, without the
  component knowing what that is.
- **Every class name is global, and all but one are unprefixed.** `.card`, `.pill`,
  `.modal` are safe in one app that owns its document and a silent collision in
  any consumer that has ever written a `.card` rule — it reads as a theming
  bug. Known and open: the prefix ends up in every consumer's stylesheet and in
  every baseline, so it is cheap now and expensive later, and it is the first
  open question in tf's `plans/design-system-package.md`.
- **The split out of tf was generated, not hand-edited.** `tools/extract-css.mjs`
  lifted the package's rules out of tf's one 4,530-line stylesheet by which
  classes each component names, keeping comments and order, and wrote what
  stayed behind with `--remainder`. Four things it got wrong first, each of
  which produced something that looked like a working component: rules with no
  class in the selector (the reset, the base type, every `button`), composed
  class names (`` `skel skel-${shape}` ``), at-rules (the whole
  `prefers-color-scheme: light` block — the mechanism the `system` theme is
  built on), and a `length > 2` filter that took `.md` with it. That is the
  argument for baselining first, in one paragraph.

- **Icons and illustrations are the system's; the mark is the product's.**
  `brandMarks.ts` is the table of every product's mark by name, stroked (tf,
  one line at a weight) or filled (valet, a badge with the shirt cut out and
  the bow inside the cut, one path under `evenodd` so the shirt is a hole the
  surface shows through); `Brand` draws either, and a product entry's `Brand`
  defaults to its own. tf's `brandMark.test.ts` reads tf's row out of the
  compiled table, so the table stays where it is. The glyph table with its
  measured views is `components/icons.ts`; `Icon.tsx` keeps the reasons. 0.3.0
  briefly had an `ArtProvider` that put a per-product pack of icons,
  illustrations and marks into React context so a product could swap the
  seven icons the package draws inside Callout, Modal and the password field.
  No product wanted that, the first real per-product art (valet's mark) did
  not need it, and it went before the tag made it public API. If a theme ever
  wants its own icon set, the shape is one indirection in `Icon` that
  `applyTheme` sets, not a provider.

## The components

- **One component per concept, variants as props.** `banner` and `callout` were
  two names for one box. If two things render the same, they are one thing.
- **Behaviour from React Aria, and state arrives as `data-*`.** What lived in a
  `className` is `data-selected`, `data-focus-visible`, `data-pressed`,
  `data-disabled`. Budget a migration as stylesheet work — the React diff per
  component is small and the CSS diff is not.
- **A modal traps focus, and focus returns to the opener.** Both are invisible
  to a mouse, which is how all eight of tf's hand-built modals once shipped
  without either. Both are keyboard tests now rather than rules on trust.
- **`Toggle` owns the request it applies.** An `onChange` that returns a
  promise moves the knob at once, marks the row busy (`aria-busy`, chef's
  sweep around the track, no second press) until it settles, puts the knob back on
  rejection and HOLDS on resolution until `checked` catches up -- a resolved
  save is not yet a refetched one, and clearing on resolve snaps the knob back
  and forward. Copied from chef-monorepo's `Toggle`, whose plan records why the
  old prop-watching hook could never roll back a failure that left the server
  value unchanged. The knob also drags; taps and drags on the knob are the
  track's own pointer, since React Aria's press is a press.
- **`Table`, `Rows` and `Slider` stay native** unless a call site wants sorting,
  selection or arrow-key navigation. A migration that makes the catalogue agree
  with itself and the app worse is a regression.
- **A component module exports its component and nothing else.** One exported
  constant loses the Fast Refresh boundary and Vite re-runs every importer.
  Values go in a sibling module — `iconNames.ts`, `tourMarker.ts`.
  `fastRefresh.test.ts`.
- **`Illustration` is generated, not globbed.** It used Vite's
  `import.meta.glob`, which `tsc` emits untouched, so the published `dist` would
  have referenced 21 modules that do not exist. `scripts/build-illustrations.mjs`
  writes a plain module from `illustrations/*.svg`, which this package owns;
  `illustrations.test.ts` holds the art to two colours and a `viewBox`.
- **Export a component as a value.** `DangerAction` was exported with
  `export type` and nothing here rendered one, so it went unseen until the first
  consumer wrote `<DangerAction>` and TypeScript refused it. The bare consumer
  in the release check typechecks the tarball; it does not render it.

## The API, one word per concept

Reviewed across all 28 components on 2026-09-05, before the first publish,
because a rename after it is a breaking change for everyone.

- **`kind` is a role, `tone` is a colour.** `Button` and `DangerZone` take
  `kind` (`primary`, `ghost`, `danger`; `destructive`, `plain`). `Callout`,
  `Pill`, `Toast`, `Progress`, `Card`, `Dialog` and `Rows` take `tone`, always a
  subset of the same four words: `info`, `good`, `warn`, `bad`. `Button` used
  to say `tone` for its role and `Progress` counted the accent fill as a tone,
  so one prop name meant three vocabularies.
- **`title` and `description`**, never `heading` and `body`. `DangerZone` was
  the exception.
- **`label` and `hint`** for the name of a control and the line under it.
  `Checkbox` said `why`.
- **`disabled`**, the plain word, on every control. React Aria spells it
  `isDisabled` and `Button` accepts both, so a consumer never has to remember
  which component wants which.
- **`size` is `sm` / `md` / `lg`** wherever a control has one.
- **`className` on every component's root.** A consumer positions things; a
  root that cannot take a class forces a wrapper.

## The gallery

- **It imports `@wtfalch/design` by its public entry, never `../src`.** A gallery
  that reaches into the source tree proves nothing about the tarball.
- **One specimen per URL** — `/?c=select&v=default&theme=paper&chrome=0` — and
  `specimens.tsx` exports the manifest the suite enumerates, read from a real
  render. A screenshot of a 65-variant scroll tells you a pixel moved and not
  where; a list kept beside the specimens goes stale in the direction that hides
  work.
- **It renders the real thing.** A page that documents hand-written markup is a
  page that will be copied — that is how tf ended up with five gallery pages and
  no component behind them. When you build a component, point its page at it.
- **A specimen of a control that moves has to move.** The Sizes toggles were
  `checked onChange={() => {}}` -- controlled, wired to nothing -- so on the
  page they could be pressed and would not budge, and the first person to try
  read the component as broken rather than the demo as static. A demo holds
  its own state.
- **A theme that is not tf's is photographed too.** The built-ins are examples,
  and an example proves nothing about whether the vocabulary is wide enough for
  an app that looks nothing like the one it came from. `gallery/src/brand.ts` is
  that app, in every specimen.

## Publishing

`release.yml` publishes on a `v*` tag, with provenance, after the same gates CI
runs, and stops if the tag disagrees with `package.json`. A markup change after
publication is breaking for anyone who styled against the first version.
`files: ["dist"]`; `pnpm pack` in `packages/design` makes the tarball a consumer
can install by path, which is how tf runs until `0.1.0` is on npm.
