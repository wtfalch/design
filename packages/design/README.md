# @wtfalch/design

wtfalch's design system: components on a fixed token vocabulary, so every
product can look like itself without forking the stylesheet.

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

## Themes, per product

A theme is part of a product's identity the way its mark is, so it lives
here, in its product's module, and the gallery photographs it:

```ts
import '@wtfalch/design/tokens.css'         // the vocabulary and its base values
import '@wtfalch/design/styles.css'         // the components
import '@wtfalch/design/themes/valet.css'   // this product's palettes, and nobody else's
```

The CSS is generated at build time from the theme objects, one
`:root[data-theme='<id>']` rule each, so the paint before React has the same
values the contrast test measured. Set `data-theme` on `<html>` before the
bundle loads and nothing flashes:

```html
<html data-theme="valet">
<script>
  try {
    var t = localStorage.getItem('theme')
    if (t) document.documentElement.dataset.theme = t
  } catch (e) {}
</script>
```

The objects are there too, for a picker or a canvas that cannot read a CSS
variable:

```ts
import { applyTheme } from '@wtfalch/design'
import { VALET_THEMES, valetNight } from '@wtfalch/design/themes/valet'

applyTheme(valetNight)                 // the object
applyTheme('valet-night')              // or its id, from the registry of every product
applyTheme(valetNight, myEl)           // or on a subtree
```

`@wtfalch/design/themes/tf` holds tf's three the same way, and `THEMES` on the
main entry is the union, which is what the gallery's picker and the contrast
test read.

### Writing one

A theme is a `Partial<ThemeTokens>` with a name, a note and a scheme: name the
tokens you change, the rest inherit from `tokens.css`. A theme naming three
tokens is valid. A product's themes go in `src/themes/<product>.ts`, keyed by
the id `applyTheme` derives from the name (lowercased, spaces to hyphens), and
`themes.test.ts` refuses a key that disagrees. Add the product to
`build-themes.mjs` and its CSS ships beside the module.

**A typo is a compile error.** `tokens` is a `Partial<ThemeTokens>`, so
`'--densty'` fails to build rather than silently doing nothing — which is the
failure a string-keyed map produces at run time, invisibly.

**A theme names its font and does not ship it.** valet's `--font` reads a
`--font-sans` variable the app defines with whatever loads its fonts, and
falls back to the family by name. The gallery vendors the two families valet
names so the specimens are photographed in them.

## The three kinds of token

| | |
|---|---|
| **themeable** (47) | A theme may set it. `TOKEN_KEYS`, and the keys of `ThemeTokens`. |
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

## Art, per product

Icons, illustrations and marks are values a product supplies, the same seam a
theme is. The components stay the package's and carry the rules: an icon
drawn at its measured view, an illustration that takes `currentColor` and the
panel it sits on, a mark in one stroke.

```ts
import { ArtProvider, bindArt, checkArt, defineArt } from '@wtfalch/design'
import { tfArt } from '@wtfalch/design/art/tf'

// Your own icons, tf's figures for now.
export const art = defineArt({ ...tfArt, icons: { ...tfArt.icons, ledger: { view: '…', d: ['…'] } } })
export const { ArtProvider: Art, Icon, Illustration, Brand } = bindArt(art)
```

`<Art>` goes at the root once, and every component, including the ones the
package draws for itself, draws the pack's. `bindArt` returns the three
components typed to the pack's names, so `<Icon name="ledgr">` fails to build.
A pack has to hold the seven icons the package's own components draw
(`SYSTEM_ICONS`), and `checkArt(pack)` says what else is wrong, in the words
`icons.test.ts` and `illustrations.test.ts` hold tf's art to. With no
provider, everything draws tf's art, which is the right default for a product
that has not drawn its own.

## Status

`0.3.0`. Twenty-eight components, every one of the 70 gallery specimens
photographed in four themes, the open windows photographed too, and the
contrast, reduced-motion and keyboard rules are tests rather than sentences.
It came out of [tf](https://github.com/wtfalch/tf), which is its first consumer;
valet is the second. Themes and art are per product: tf's and valet's palettes
ship here, and tf's art is the pack every product starts from.

Requires React 19. Behaviour comes from
[React Aria Components](https://react-spectrum.adobe.com/react-aria/); every
pixel is the stylesheet's, styled through `data-*` attributes off the token
vocabulary. No Tailwind, no utility layer.

## Source and issues

[github.com/wtfalch/design](https://github.com/wtfalch/design) — the package
under `packages/design`, the gallery under `gallery`, and the visual, axe and
keyboard suites under `gallery-e2e`. The repository's `CLAUDE.md` carries the
rules the components follow, each with the bug that produced it.

## Licence

MIT.
