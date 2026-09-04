# @wtfalch/design

Components on a fixed token vocabulary, so an app can look like itself without
forking the stylesheet.

```bash
pnpm add @wtfalch/design
```

```ts
import '@wtfalch/design/tokens.css'   // the vocabulary and its base values
import '@wtfalch/design/styles.css'   // the components
```

## The idea

A **theme is a set of values for a fixed vocabulary** — colour, surface,
typography, shape, density, motion and interaction. It never ships a selector.

That constraint is not a limitation, it is what makes the package safe to
change: the moment a theme can write a rule, every theme becomes a fork of the
stylesheet and no change to a component is safe again. What makes a theme
expressive instead is a vocabulary wide enough that the thing you want to vary
is already a value — a screen background, a hover lift, how fast things move.

Where a theme genuinely needs a layer that values cannot reach — a paper grain,
a vignette — the base CSS pre-declares the slot and the theme fills it. The rule
is always ours.

## Writing a theme

```ts
import { applyTheme, defineTheme } from '@wtfalch/design'

export const brand = defineTheme({
  name: 'Brand',
  note: 'Warm, roomy, and slower than the default',
  scheme: 'light',
  tokens: {
    '--bg': '#faf7f2',
    '--panel': '#ffffff',
    '--accent': '#7c3aed',
    '--on-accent': '#ffffff',
    '--density': '1.15',      // every --space-* step follows
    '--font-size': '15px',    // every --text-* step follows
    '--dur-md': '320ms',
  },
})

applyTheme(brand)                      // the object, straight from defineTheme
applyTheme(brand, myEl)                // or on a subtree
applyTheme('paper')                    // or a built-in, by name
```

Name the tokens you change; the rest inherit from `tokens.css`. A theme naming
three tokens is valid.

**A typo is a compile error.** `tokens` is a `Partial<ThemeTokens>`, so
`'--densty'` fails to build rather than silently doing nothing — which is the
failure a string-keyed map produces at run time, invisibly. This is the main
reason the type is exported at all.

## The three kinds of token

| | |
|---|---|
| **themeable** (46) | A theme may set it. `TOKEN_KEYS`, and the keys of `ThemeTokens`. |
| **derived** (16) | `calc()` off a themeable token, and **not** settable. `--text-*` follow `--font-size`; `--space-*` follow `--density`. Move the input, not the output — a step written as a literal is a scale that stopped scaling. |
| **fixed** (3) | Not themeable. `--tile-control` is geometry other things are measured against, `--nudge` is optical alignment rather than spacing, and `--tick-mask` is a glyph — an arbitrary SVG from a theme is a theme shipping markup. |

`tokens.test.ts` holds all three lists to `tokens.css` in both directions. A
token added to the stylesheet and to no list fails the suite rather than
becoming a fourth, undocumented category.

## The measurement ships

```ts
import { ratio } from '@wtfalch/design'
ratio('#6d28d9', '#ffffff') // 6.30 -- the label on your primary button
```

`test/contrast.test.ts` measures every built-in theme, pair by pair, with the
WCAG 2 formula: text on the page and on both panels, hints, the label on the
primary button, all four status colours, and the two boundaries that want
3:1. On its first run it found the built-in information blue at 3.96:1 on
white. `ratio` and `luminance` are exported so the theme you write -- the one
nobody here will ever look at -- can be held to the same numbers.

## Two rules that outrank any theme

**`prefers-reduced-motion` wins.** The motion tokens collapse to `0s` under it,
whatever the theme says, and the hover and press transforms go with them. Motion
is an accessibility setting before it is a style, so a theme may set the
durations and may not decide whether they apply.

**Contrast is measured, not judged.** 4.5:1 for text and 3:1 for a non-text
boundary, in every theme. `--on-accent` exists because a hardcoded white button
label vanishes under a pale accent, and `--border-strong` exists because a
hairline divider and a control's outline have different thresholds and cannot
share a value.

## First paint

React mounts after the stylesheet, so a theme applied in an effect flashes the
default. Cache the name and apply it from a blocking script before the bundle
loads:

```html
<script>
  try {
    var t = localStorage.getItem('theme')
    if (t) document.documentElement.dataset.theme = t
  } catch (e) {}
</script>
```

Your server stays the source of truth. `localStorage` only beats the paint.

## Built-ins

`system`, `night` and `paper` ship as **examples, not as the menu** — an app
that installs this is expected to bring its own. `system` is a theme rather than
a mode: it is the only one scoped to `prefers-color-scheme`, so choosing a dark
theme on a light-mode laptop is not silently repainted.

## Status

Pre-`0.1.0`. The vocabulary and the theme API are in place; components land as
they are reviewed. See `plans/design-system-package.md` in the tf repo for the
order.
