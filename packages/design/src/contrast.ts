/**
 * The contrast measurement, as a function rather than a rule.
 *
 * "4.5:1 for text, 3:1 for a boundary" has been the house rule for as long as
 * there have been themes, and it was held by nobody: the Night theme shipped
 * its primary button at 2.72:1 because the rule was written down and the
 * measurement was not. `test/contrast.test.ts` measures the package's own
 * palettes with these functions. They are exported so an app can measure its
 * own -- since 0.17.0 every theme but `system` is written in the app that
 * wears it, and a theme somebody writes for their app is the one nobody here
 * will ever look at. `contrastFailures` is that measurement whole, for an
 * app's test suite.
 *
 * WCAG 2 relative luminance and contrast ratio, on six-digit hex. Nothing
 * here parses `color-mix()` or `var()` off a stylesheet: the derived tokens
 * are computed from these, so measuring the inputs is measuring them. The one
 * exception is `CONTRAST_TINTS`: several components tint a tone into
 * `--panel` with `color-mix()` rather than flattening it to a token, and text
 * sits on that tint, not on `--panel` itself -- so `mix()` below reproduces
 * the browser's own arithmetic for every tint a component actually draws text
 * over, and `contrastFailures` measures those surfaces too.
 * `test/contrast.test.ts` scans every stylesheet for the shape
 * `color-mix(in srgb, var(--tone) N%, ...)` and fails if anything is neither
 * in `CONTRAST_TINTS` nor in `EXCLUDED_TINTS` -- a new tint has to be measured
 * or excluded on purpose, not shipped silently.
 */
import type { ThemeTokens } from './themes'

export function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** The ratio between two colours, 1:1 up to 21:1, whichever is on top. */
export function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The colours `tokens.css` states on `:root`, which a sparse theme falls back
 * to. A copy, because an app's test cannot read the package's stylesheet as
 * values; `contrast.test.ts` holds it to `tokens.css` so the copy cannot
 * drift.
 */
export const BASE_PALETTE: Partial<ThemeTokens> = {
  '--bg': '#12151a',
  '--panel': '#191d24',
  '--panel-2': '#222831',
  '--border': '#262c36',
  '--text': '#e4e8ee',
  '--muted': '#98a1b0',
  '--accent': '#4fb3a8',
  '--accent-dim': '#2f6b66',
  '--good': '#68c48c',
  '--warn': '#d9a65a',
  '--bad': '#e28680',
  '--info': '#74b3ff',
  '--on-accent': '#06181a',
  '--border-strong': '#5f6a7a',
}

/**
 * `color-mix(in srgb, A P%, B)`, worked out the way the browser does it: a
 * straight per-channel average of the two colours' 8-bit sRGB components,
 * weighted by the percentage, rounded to the nearest integer. `in srgb` means
 * the gamma-encoded components are interpolated directly -- not degamma'd to
 * linear light and back -- which is exactly what let `mix('#d9a65a', '#161a21', 18)`
 * land on `#39332b` component for component: the Night theme's `.card-warn`,
 * as `a11y-known.json` recorded it from a real browser.
 */
export function mix(a: string, b: string, percent: number): string {
  const channel = (hex: string, i: number) => Number.parseInt(hex.slice(i, i + 2), 16)
  const at = (i: number) =>
    Math.round(channel(a, i) * (percent / 100) + channel(b, i) * (1 - percent / 100))
      .toString(16)
      .padStart(2, '0')
  return `#${at(1)}${at(3)}${at(5)}`
}

export interface ContrastPair {
  fg: keyof ThemeTokens
  bg: keyof ThemeTokens
  /** 4.5 for text; 3 for a boundary (WCAG 1.4.11). */
  min: number
  what: string
}

/** What sits on what, in every theme. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: '--text', bg: '--bg', min: 4.5, what: 'body text on the page' },
  { fg: '--text', bg: '--panel', min: 4.5, what: 'body text on a panel' },
  { fg: '--text', bg: '--panel-2', min: 4.5, what: 'body text on a raised panel' },
  { fg: '--muted', bg: '--panel', min: 4.5, what: 'a hint on a panel' },
  { fg: '--muted', bg: '--bg', min: 4.5, what: 'a hint on the page' },
  { fg: '--on-accent', bg: '--accent', min: 4.5, what: 'the label on the primary button' },
  { fg: '--good', bg: '--panel', min: 4.5, what: 'a good state pill' },
  { fg: '--warn', bg: '--panel', min: 4.5, what: 'a warning pill' },
  { fg: '--bad', bg: '--panel', min: 4.5, what: 'a failing pill' },
  { fg: '--info', bg: '--panel', min: 4.5, what: 'an info pill' },
  { fg: '--info', bg: '--bg', min: 4.5, what: 'an info callout on the page' },
  { fg: '--border-strong', bg: '--panel', min: 3, what: "a control's outline" },
  { fg: '--accent', bg: '--panel', min: 3, what: 'the focus ring' },
]

export interface ContrastTint {
  /** The token `color-mix()` reads as its first colour -- the tone. */
  tone: keyof ThemeTokens
  /** The percentage of `tone` mixed in, exactly as the CSS states it. */
  percent: number
  /** The token `color-mix()` reads as its second colour. Always `--panel`:
   *  "Tint into `--panel`, not `--panel-2`." */
  surface: keyof ThemeTokens
  /** The token the text drawn over that tint takes its colour from. Equal to
   *  `tone` for a pill, which colours its own label in the tone it tints
   *  with; `--text` or `--muted` for a card or callout, whose body copy does
   *  not change colour with the tone. */
  text: keyof ThemeTokens
  min: number
  what: string
}

/**
 * The tinted surfaces a component actually draws text on, alongside
 * `CONTRAST_PAIRS`'s flat token pairs.
 *
 * `Card`, `Callout`, `Pill`, a toggle `Button`, `Checkbox`'s `.choice`,
 * `Rows`'s picked row, `DangerZone` and `Menu`'s destructive item all mix a
 * tone into `--panel` rather than naming a token, so a check against
 * `--panel` alone never measured the surface a reader looks at. This is that
 * surface, computed with `mix()`. `test/contrast.test.ts` scans every
 * stylesheet in `styles/` for `color-mix(in srgb, var(--tone) N%, ...)` and
 * fails if this list and `EXCLUDED_TINTS` together disagree with what is
 * there -- the same two-way pattern that holds `BASE_PALETTE` to
 * `tokens.css`, widened to every file rather than the three this started
 * with, so a new tint anywhere has to be measured or excluded on purpose.
 *
 * Found this way: the Night theme's `.card-warn` mixes 18% of the base
 * `--warn` into its own `--panel` and gets `#39332b`; `--muted` on that tint
 * is 4.08:1, under the 4.5:1 minimum -- `a11y-known.json`'s
 * `card · Warned · night`, until now caught only by an axe scan of a
 * screenshot the visual suite happened to take, not by anything an app's own
 * test could run on its own palette.
 */
export const CONTRAST_TINTS: readonly ContrastTint[] = [
  // Card (card.css): the tones mix into the card's own `--panel`.
  {
    tone: '--bad',
    percent: 6,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a failed card',
  },
  {
    tone: '--bad',
    percent: 6,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint on a failed card',
  },
  {
    tone: '--warn',
    percent: 18,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a warned card',
  },
  {
    tone: '--warn',
    percent: 18,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint on a warned card',
  },
  {
    tone: '--accent',
    percent: 10,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a selected card',
  },
  {
    tone: '--accent',
    percent: 10,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint on a selected card',
  },
  // Callout (callout.css): all four tones mix the same way, at 10%.
  {
    tone: '--info',
    percent: 10,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on an info callout',
  },
  {
    tone: '--bad',
    percent: 10,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a failing callout',
  },
  {
    tone: '--good',
    percent: 10,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a good callout',
  },
  {
    tone: '--warn',
    percent: 10,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'body text on a warning callout',
  },
  // Pill (base.css): the tone colours its own label, over its own tint. Note
  // `.pill-info` mixes `--accent`, not `--info` -- an info pill and an info
  // callout are not drawn in the same colour.
  {
    tone: '--accent',
    percent: 10,
    surface: '--panel',
    text: '--accent',
    min: 4.5,
    what: "an info pill's own tint",
  },
  {
    tone: '--good',
    percent: 10,
    surface: '--panel',
    text: '--good',
    min: 4.5,
    what: "a good pill's own tint",
  },
  {
    tone: '--warn',
    percent: 10,
    surface: '--panel',
    text: '--warn',
    min: 4.5,
    what: "a warning pill's own tint",
  },
  {
    tone: '--bad',
    percent: 10,
    surface: '--panel',
    text: '--bad',
    min: 4.5,
    what: "a failing pill's own tint",
  },
  // A toggle button (base.css): pressed, and pressed while held.
  {
    tone: '--accent',
    percent: 10,
    surface: '--panel',
    text: '--accent',
    min: 4.5,
    what: 'a pressed toggle button',
  },
  {
    tone: '--accent',
    percent: 18,
    surface: '--panel',
    text: '--accent',
    min: 4.5,
    what: 'a pressed, held toggle button',
  },
  // Checkbox (checkbox.css): `.choice[data-selected]`, and its own hover.
  {
    tone: '--accent',
    percent: 8,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'a name in a selected choice',
  },
  {
    tone: '--accent',
    percent: 8,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint in a selected choice',
  },
  {
    tone: '--accent',
    percent: 13,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'a name in a selected, hovered choice',
  },
  {
    tone: '--accent',
    percent: 13,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint in a selected, hovered choice',
  },
  // Rows (rows.css): the picked row, drawn the same as a selected choice, and
  // its own hover.
  {
    tone: '--accent',
    percent: 8,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'a name in a picked row',
  },
  {
    tone: '--accent',
    percent: 8,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint in a picked row',
  },
  {
    tone: '--accent',
    percent: 13,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: 'a name in a picked, hovered row',
  },
  {
    tone: '--accent',
    percent: 13,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: 'a hint in a picked, hovered row',
  },
  // DangerZone (dangerzone.css): the destructive button's own two states,
  // and the zone itself, which carries three different text tokens.
  {
    tone: '--bad',
    percent: 12,
    surface: '--panel',
    text: '--bad',
    min: 4.5,
    what: 'a hovered danger button',
  },
  {
    tone: '--bad',
    percent: 20,
    surface: '--panel',
    text: '--bad',
    min: 4.5,
    what: 'a pressed danger button',
  },
  {
    tone: '--bad',
    percent: 5,
    surface: '--panel',
    text: '--bad',
    min: 4.5,
    what: "a danger zone's own heading",
  },
  {
    tone: '--bad',
    percent: 5,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: "a danger zone's own hint",
  },
  {
    tone: '--bad',
    percent: 5,
    surface: '--panel',
    text: '--text',
    min: 4.5,
    what: "a danger zone's own plain heading",
  },
  // Menu (menu.css): a destructive item, focused, with its own label and its
  // optional description.
  {
    tone: '--bad',
    percent: 10,
    surface: '--panel',
    text: '--bad',
    min: 4.5,
    what: 'a focused destructive menu item',
  },
  {
    tone: '--bad',
    percent: 10,
    surface: '--panel',
    text: '--muted',
    min: 4.5,
    what: "a focused destructive menu item's description",
  },
]

interface ExcludedTint {
  tone: string
  percent: number
  surface: string
  because: string
}

/**
 * Every `color-mix(in srgb, var(--tone) N%, ...)` in the stylesheets that is
 * not a `CONTRAST_TINTS` entry, and why. `test/contrast.test.ts` enforces
 * this list the same way it enforces `CONTRAST_TINTS`: a tint that is in
 * neither fails the suite, so a new one has to be measured or excluded on
 * purpose.
 *
 * Two shapes recur. A **border-colour** mix (`--border`, `--border-strong`)
 * has no `text` token sitting on it -- nothing renders text in a
 * `border-color` -- so it cannot be written as a `ContrastTint`, whose `text`
 * field means exactly that. Its own WCAG 1.4.11 requirement (3:1 against the
 * surface on either side of it) is a different pair than "text on a tint",
 * and this measurement does not attempt it; `CONTRAST_PAIRS` already measures
 * the flat case, `--border-strong` on `--panel`. A mix into **`transparent`**
 * is not a literal palette colour at all: the result stays translucent, so
 * what actually renders depends on whatever sits behind the element -- not a
 * token this measurement can look up per theme.
 */
export const EXCLUDED_TINTS: readonly ExcludedTint[] = [
  // Border-colour mixes: a border, not text.
  { tone: '--good', percent: 45, surface: '--border', because: "a pill's border, not text" },
  { tone: '--warn', percent: 45, surface: '--border', because: "a pill's border, not text" },
  { tone: '--bad', percent: 45, surface: '--border', because: "a pill's border, not text" },
  { tone: '--info', percent: 30, surface: '--border', because: "a callout's border, not text" },
  { tone: '--bad', percent: 30, surface: '--border', because: "a callout's border, not text" },
  { tone: '--good', percent: 30, surface: '--border', because: "a callout's border, not text" },
  { tone: '--warn', percent: 30, surface: '--border', because: "a callout's border, not text" },
  {
    tone: '--bad',
    percent: 35,
    surface: '--border',
    because: "a card's or a danger zone's border, not text",
  },
  { tone: '--warn', percent: 40, surface: '--border', because: "a card's border, not text" },
  {
    tone: '--bad',
    percent: 18,
    surface: '--border',
    because: "a danger zone's own divider, not text",
  },
  {
    tone: '--bad',
    percent: 45,
    surface: '--border-strong',
    because: "a danger button's border, not text",
  },
  {
    tone: '--muted',
    percent: 50,
    surface: '--border',
    because: "a toggle track's own colour on a card, not text",
  },
  // Mixed into `transparent`: not a literal palette colour, and translucent
  // rather than opaque -- what renders depends on whatever sits behind it.
  { tone: '--muted', percent: 30, surface: 'transparent', because: "a toggle's own focus ring" },
  {
    tone: '--bad',
    percent: 30,
    surface: 'transparent',
    because: "an invalid field's own focus ring",
  },
  {
    tone: '--accent',
    percent: 45,
    surface: 'transparent',
    because: 'a size-picker swatch 18×14px with no text, only an aria-label',
  },
  {
    tone: '--accent',
    percent: 12,
    surface: 'transparent',
    because: 'a vertical tab: translucent, so the rendered colour depends on what sits behind it',
  },
  // Neither side is a theme palette token: `--slider-ink` is itself a
  // `color-mix` of `--bad` and `--accent`, and `--control` is one of the three
  // derived tokens re-derived under `[data-theme]` -- neither is a hex value
  // this measurement can look up per theme.
  {
    tone: '--slider-ink',
    percent: 28,
    surface: '--control',
    because: 'neither side is a literal palette token',
  },
]

/**
 * Every pair a palette fails, one line each; empty when it passes.
 *
 * The palette is laid over `BASE_PALETTE`, the way the page lays it over
 * `tokens.css`, so a theme that names three colours is measured against the
 * ones it inherits. Pass `productTheme(product, id).tokens` to measure a theme
 * as the product wears it. A colour that is not six-digit hex -- a `var()`,
 * a `color-mix()` -- is reported rather than guessed at.
 *
 * Also measures `CONTRAST_TINTS`: the same components tint a tone into
 * `--panel` rather than reaching for a flat token, so a status card or a
 * pill is measured on the surface it actually draws, not the panel under it.
 *
 *   expect(contrastFailures(productTheme(product, 'night').tokens)).toEqual([])
 */
export function contrastFailures(tokens: Partial<ThemeTokens>): string[] {
  const palette = { ...BASE_PALETTE, ...tokens }
  const hex = /^#[0-9a-fA-F]{6}$/
  const out: string[] = []
  for (const { fg, bg, min, what } of CONTRAST_PAIRS) {
    const [a, b] = [palette[fg], palette[bg]]
    if (!a || !hex.test(a) || !b || !hex.test(b)) {
      out.push(`${what}: ${fg} on ${bg} is not two six-digit hex colours (${a} on ${b})`)
      continue
    }
    const r = ratio(a, b)
    if (r < min) out.push(`${what}: ${fg} ${a} on ${bg} ${b} is ${r.toFixed(2)}:1, under ${min}:1`)
  }
  for (const { tone, percent, surface, text, min, what } of CONTRAST_TINTS) {
    const [toneHex, surfaceHex, textHex] = [palette[tone], palette[surface], palette[text]]
    if (
      !toneHex ||
      !hex.test(toneHex) ||
      !surfaceHex ||
      !hex.test(surfaceHex) ||
      !textHex ||
      !hex.test(textHex)
    ) {
      out.push(
        `${what}: ${text} on ${tone} ${percent}% into ${surface} is not two six-digit hex colours (${textHex} on ${toneHex}/${surfaceHex})`,
      )
      continue
    }
    const bg = mix(toneHex, surfaceHex, percent)
    const r = ratio(textHex, bg)
    if (r < min) {
      out.push(
        `${what}: ${text} ${textHex} on ${tone} ${percent}% into ${surface} (${bg}) is ${r.toFixed(2)}:1, under ${min}:1`,
      )
    }
  }
  return out
}
