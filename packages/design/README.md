# @wtfalch/design

wtfalch's design system: components on a fixed token vocabulary, so every
product can look like itself without forking the stylesheet.

```bash
pnpm add @wtfalch/design
```

## What is public

The components, and the tokens. Not the classes.

A class in this package is an implementation detail: `.card`, `.set-row`,
`.pill` and the rest may be renamed or deleted whenever the component that
draws them changes. 0.9.0 did exactly that to several of them, and 0.10.0
deleted 41 more: the components that drew them draw themselves now, so the
rules had no reader left.

If you need a card, render `<Card>`; if you need a row of your own, write it
in the token vocabulary:

```css
.app-row { display: flex; gap: var(--space-3); align-items: center; }
```

`tokens.css` ships separately for that, and every value a theme can change is
in it. An app that wants utilities should run Tailwind over its own source --
this package's stylesheet is compiled and does not need it.

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

## Products

A site is one product, so it imports its product and everything it touches is
its own:

```ts
import '@wtfalch/design/valet.css'   // the vocabulary, valet's identity, the components, valet's themes
import { Brand, Button, applyTheme } from '@wtfalch/design/valet'
// the same components; Brand is valet's badge, applyTheme knows valet's themes
```

Three layers, each falling back to the one under it:

| | |
|---|---|
| **the system** | The components, the base values in `tokens.css`, the shared icons and illustrations. |
| **the product** | Its mark, and its identity: the tokens that make it itself under every theme — font, shape, density. On `:root` in the product's stylesheet, so a theme that is silent on them gets the product, not tf. `src/products/<name>.ts`. |
| **the theme** | A palette and a colour scheme, plus anything it deliberately changes. One `:root[data-theme='<id>']` rule each, generated from the object. |

The middle layer is what lets a theme be shared between products: it names its
colours and inherits the identity of whichever product wears it. Before it
existed, valet's two palettes each restated valet's font and corners, and a
palette written for two products would have shown tf's font on valet wherever
it kept quiet.

The product's default theme is also written on `:root` when no `data-theme` is
set, so the first paint is right with no attribute at all; set the attribute
before the bundle loads only to restore a theme somebody picked (see First
paint). tf's default is `system`, a `prefers-color-scheme` rule rather than a
palette, so tf still sets the attribute.

The main entry is the neutral view of all of it: `PRODUCTS` by name, `THEMES`
as the union every product's picker and the contrast test read,
`productTheme(product, id)` for a theme as a product wears it, `bindProduct`
for a product defined outside this package, and `productStylesheet` for its
CSS.

```ts
import { PRODUCTS, applyTheme, productTheme } from '@wtfalch/design'

applyTheme(productTheme(PRODUCTS.valet, 'valet-night'))   // valet night, on valet's identity
applyTheme('valet-night')                                  // the palette alone, over the base
applyTheme(productTheme(PRODUCTS.valet), myEl)             // valet's default, on a subtree
```

### Writing a theme

A theme is a `Partial<ThemeTokens>` with a name, a note and a scheme: name the
tokens you change, the rest inherit from the product's identity and then from
`tokens.css`. A theme naming three tokens is valid. A product's themes go in
`src/products/<name>.ts` beside its identity, keyed by the id `applyTheme`
derives from the name (lowercased, spaces to hyphens); `products.test.ts`
refuses a key that disagrees, a palette that restates its product's identity,
and a default that is not one of the product's themes. `build-products.mjs`
writes `dist/<name>.css` from the objects at build time.

**A typo is a compile error.** `tokens` is a `Partial<ThemeTokens>`, so
`'--densty'` fails to build rather than silently doing nothing — which is the
failure a string-keyed map produces at run time, invisibly.

**A product names its font and does not ship it.** valet's identity sets
`--font` to read a `--font-sans` variable the app defines with whatever loads
its fonts, and falls back to the family by name. The gallery vendors the two
families valet names so the specimens are photographed in them.

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

Your product's stylesheet paints its default theme with no attribute set, so
this is for restoring a choice. React mounts after the stylesheet, so a theme
applied in an effect flashes the default. Cache the name and apply it from a
blocking script before the bundle loads:

```html
<script>
  try {
    var t = localStorage.getItem('theme')
    if (t) document.documentElement.dataset.theme = t
  } catch (e) {}
</script>
```

Your server stays the source of truth. `localStorage` only beats the paint.

## Marks

Every product's mark, by name, in `brandMarks.ts`. tf's is one stroke. valet's
is a filled badge: the jacket with the shirt cut out of it and a bow tie in the
cut, one path under `evenodd` so the surface shows through the shirt. Both are
`currentColor`, so the stylesheet decides the colour and a theme can move it.

```tsx
import { BRAND_MARKS, Brand } from '@wtfalch/design'

<Brand name="valet" />   // anywhere; a product entry's Brand defaults to its own
BRAND_MARKS.valet.d      // the path, for a favicon or an app icon cut from the same drawing
```

Icons and illustrations are the system's, shared by every product the way
`Button` is. A product wanting its own inside the package's components is a
case nobody has had; when it comes, the product entry is where to bind it.

## Status

`0.3.1`. Twenty-eight components, every one of the 70 gallery specimens
photographed in four themes, the open windows photographed too, and the
contrast, reduced-motion and keyboard rules are tests rather than sentences.
It came out of [tf](https://github.com/wtfalch/tf), which is its first consumer;
valet is the second. A product is a layer: tf and valet each ship as one
stylesheet and one entry, with their identity under their themes and their
mark in the table.

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
