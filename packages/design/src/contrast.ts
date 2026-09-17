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
 * here parses `color-mix()` or `var()`: the derived tokens are computed from
 * these, so measuring the inputs is measuring them.
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

/**
 * Every pair a palette fails, one line each; empty when it passes.
 *
 * The palette is laid over `BASE_PALETTE`, the way the page lays it over
 * `tokens.css`, so a theme that names three colours is measured against the
 * ones it inherits. Pass `productTheme(product, id).tokens` to measure a theme
 * as the product wears it. A colour that is not six-digit hex -- a `var()`,
 * a `color-mix()` -- is reported rather than guessed at.
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
  return out
}
