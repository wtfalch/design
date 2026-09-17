/**
 * Contrast is measured, not judged -- and now the package measures it.
 *
 * `dashboard/CLAUDE.md` has had the rule for a while: 4.5:1 for text, 3:1 for
 * a non-text boundary, against every theme. It was a rule with nobody holding
 * it. The Night theme set `--on-accent: #ffffff` over `--accent: #5b9dff` --
 * 2.72:1, the exact pair and the exact ratio `tokens.css` records as the
 * reason the token exists -- and the app's fixed dark theme failed on its
 * primary button for as long as the token had been "fixed". Nothing noticed
 * because the rule was written down and the measurement was not.
 *
 * So the package's palettes are measured here, pair by pair, with the WCAG 2
 * relative-luminance formula, through `contrastFailures` -- the function an
 * app runs on its own themes, which since 0.17.0 is every theme but this one.
 *
 * `system` is two palettes: the base values in `tokens.css` when the OS is
 * dark, and the block in `_system-light.css` scoped to `[data-theme='system']` when it
 * is light. Both are measured; the light one is the one that had the 1.67:1
 * running pill.
 *
 * `contrastFailures` also measures `CONTRAST_TINTS`: several components tint
 * a tone into `--panel` with `color-mix()` and draw text over the result, not
 * over `--panel` itself. Two of the four palettes below fail a tinted pair --
 * real, shipped defects the flat check never saw, listed explicitly rather
 * than fixed, because changing a colour or a percentage here would move a
 * pixel.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  BASE_PALETTE,
  CONTRAST_PAIRS,
  CONTRAST_TINTS,
  EXCLUDED_TINTS,
  contrastFailures,
  mix,
  ratio,
} from '../src/contrast'
import { productTheme } from '../src/products'
import type { ThemeTokens } from '../src/themes'
import { sample } from './fixtures/product'

const here = dirname(fileURLToPath(import.meta.url))
const read = (f: string) => readFileSync(resolve(here, '../src', f), 'utf8')

/** `--name: #hex;` declarations inside one block of CSS. Derived tokens are
 *  `calc()` and `color-mix()` and are not colours a ratio can be taken of. */
function hexes(block: string): Partial<ThemeTokens> {
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2]
  return out as Partial<ThemeTokens>
}

const tokens = read('tokens.css')
const base = hexes(tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('@media')))

/* The light `system` palette left `base.css` when the component sheets moved
   into `@layer components`: it is a theme, and a layered theme loses to the
   unlayered `:root` in `tokens.css`. It is unlayered in `_system-light.css`
   now, and this is where it is measured from. */
const baseCss = read('styles/_system-light.css')
const lightBlock = baseCss.match(/:root\[data-theme='system'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const systemLight = hexes(lightBlock)

describe('the palette an app measures against', () => {
  it('is the colours tokens.css states, exactly', () => {
    // `BASE_PALETTE` is a copy so an app's test can use it without reading a
    // stylesheet. A copy drifts, so this holds it in both directions.
    expect(BASE_PALETTE).toEqual(base)
  })

  it('names a colour for both sides of every pair', () => {
    for (const { fg, bg } of CONTRAST_PAIRS) {
      expect(base[fg], fg).toBeTruthy()
      expect(base[bg], bg).toBeTruthy()
    }
  })

  it('reports a failing pair, and a colour it cannot measure', () => {
    // The Night theme's button, as it shipped.
    expect(contrastFailures({ '--accent': '#5b9dff', '--on-accent': '#ffffff' })).toEqual([
      'the label on the primary button: --on-accent #ffffff on --accent #5b9dff is 2.72:1, under 4.5:1',
    ])
    expect(contrastFailures({ '--muted': 'var(--text)' })[0]).toMatch(/not two six-digit hex/)
  })
})

describe('every palette is measured', () => {
  it('found the light system block in _system-light.css', () => {
    expect(systemLight['--bg']).toBeTruthy()
  })

  /** Every palette a person can end up looking at here: `system` is two, the
   *  base when the OS is dark and the scoped block when it is light. The
   *  fixture's two stand for an app's, measured the way an app measures.
   *
   *  Three tinted pairs fail, across two of these four, once `CONTRAST_TINTS`
   *  is added to the measurement. All real: `system (light)`'s toggle button
   *  holds `--accent` text over its own colour at 18% into a white panel; the
   *  sample fixture's good pill does the same at 10%, and its danger button
   *  does it at 20% while pressed. None is fixed here -- a colour or a
   *  percentage change moves a pixel, and this task's job is the
   *  measurement, not the palette. The expected list is explicit so a future
   *  fix has to delete a line on purpose, and a new failure cannot join it
   *  silently. */
  const knownTintFailures: Record<string, string[]> = {
    'system (light)': [
      'a pressed, held toggle button: --accent #0e7872 on --accent 18% into --panel (#d4e7e6) is 4.15:1, under 4.5:1',
    ],
    'a product, light': [
      "a good pill's own tint: --good #1b7f4b on --good 10% into --panel (#e8f2ed) is 4.39:1, under 4.5:1",
      'a pressed danger button: --bad #bf3a31 on --bad 20% into --panel (#f2d8d6) is 4.03:1, under 4.5:1',
    ],
  }
  const palettes: Record<string, Partial<ThemeTokens>> = {
    'system (dark)': {},
    'system (light)': systemLight,
    'a product, light': productTheme(sample, 'sample').tokens,
    'a product, dark': productTheme(sample, 'sample-night').tokens,
  }
  for (const [name, p] of Object.entries(palettes)) {
    it(name, () => {
      expect(contrastFailures(p)).toEqual(knownTintFailures[name] ?? [])
    })
  }
})

describe('tinted surfaces', () => {
  /** The Night theme, copied inline from gallery/src/product.ts rather than
   *  imported: since 0.17.0 a theme belongs to the app that wears it, and
   *  this package reaching into the gallery's fixture would put the coupling
   *  straight back. */
  const NIGHT_TOKENS: Partial<ThemeTokens> = {
    '--bg': '#0f1115',
    '--panel': '#161a21',
    '--panel-2': '#1c222b',
    '--border': '#262d38',
    '--text': '#e6e9ef',
    '--muted': '#8b94a4',
    '--accent': '#5b9dff',
    '--accent-dim': '#2a4877',
    '--app-bg': '#0f1115',
  }

  it('reproduces a11y-known.json\'s "card · Warned · night"', () => {
    // #8b94a4 on #39332b, 4.08:1 in a real browser's axe scan. This function's
    // own arithmetic is allowed to land anywhere from 4.07 to 4.09 -- a
    // browser may round a channel differently than `mix()` does -- but the
    // background it computes, #39332b, matches the scan exactly.
    const line = contrastFailures(NIGHT_TOKENS).find((f) => f.startsWith('a hint on a warned card'))
    expect(line).toBeTruthy()
    expect(line).toContain('#39332b')
    expect(line).toMatch(/4\.0[789]:1/)
  })
})

describe('the tint percentages match the CSS', () => {
  /** Every stylesheet but the Tailwind build, which is generated and holds no
   *  hand-written `color-mix()`. */
  const styleFiles = readdirSync(resolve(here, '../src/styles')).filter(
    (f) => f.endsWith('.css') && f !== '_tailwind.built.css',
  )

  /** Every `color-mix(...)` call in a block of CSS, found by balancing
   *  parentheses from `color-mix(` rather than matching one fixed shape --
   *  `color-mix(in srgb, var(--tone) N%, var(...))` is most of them, but
   *  `currentColor`, `hsl()` and `in oklab` all appear here too, and a narrow
   *  regex for the common shape let every one of those through uncounted. */
  function findColorMixes(css: string): string[] {
    const out: string[] = []
    let i = css.indexOf('color-mix(')
    while (i !== -1) {
      let depth = 1
      let j = i + 'color-mix('.length
      while (depth > 0 && j < css.length) {
        if (css[j] === '(') depth++
        else if (css[j] === ')') depth--
        j++
      }
      out.push(css.slice(i, j))
      i = css.indexOf('color-mix(', j)
    }
    return out
  }

  /** A `color-mix(...)` call's arguments, split on its top-level commas --
   *  not any comma, since a colour argument may itself hold parens with no
   *  comma in them (`hsl(var(--ident-hue) 60% 50%)`) that must stay whole. */
  function splitArgs(inner: string): string[] {
    const parts: string[] = []
    let depth = 0
    let start = 0
    for (let k = 0; k < inner.length; k++) {
      if (inner[k] === '(') depth++
      else if (inner[k] === ')') depth--
      else if (inner[k] === ',' && depth === 0) {
        parts.push(inner.slice(start, k).trim())
        start = k + 1
      }
    }
    parts.push(inner.slice(start).trim())
    return parts
  }

  /** A colour argument is `<colour>` or `<colour> <percentage>`. Split on the
   *  last top-level space, since the colour itself may contain internal
   *  spaces at depth > 0 (`hsl(var(--ident-hue) 60% 50%)`). */
  function splitColourPercent(arg: string): [string, string | undefined] {
    let depth = 0
    let lastSpace = -1
    for (let k = 0; k < arg.length; k++) {
      if (arg[k] === '(') depth++
      else if (arg[k] === ')') depth--
      else if (arg[k] === ' ' && depth === 0) lastSpace = k
    }
    if (lastSpace === -1) return [arg, undefined]
    return [arg.slice(0, lastSpace).trim(), arg.slice(lastSpace + 1).trim()]
  }

  /** The key this test compares `CONTRAST_TINTS` and `EXCLUDED_TINTS`
   *  against: colour space (only when not `srgb`), first colour, its
   *  percentage, second colour -- exactly as the stylesheet states them. The
   *  space is part of the key so two mixes that share a tone and a
   *  percentage in different colour spaces do not collide: `toggle.css`'s
   *  sweep arc mixes `--accent` at 45% into `transparent`, the same pair
   *  `sizegrid.css`'s swatch does, but `in oklab` -- a different, unmeasurable
   *  computation that an exclusion for the swatch would otherwise paper over. */
  function mixKey(full: string): string {
    const inner = full.slice('color-mix('.length, -1)
    const [spacePart, colour1, colour2] = splitArgs(inner)
    const space = spacePart.replace(/^in\s+/, '').trim()
    const [tone, percent] = splitColourPercent(colour1)
    return `${space === 'srgb' ? '' : `${space}:`}${tone}|${percent ?? ''}|${colour2}`
  }

  /** The same key, built from a `CONTRAST_TINTS` or `EXCLUDED_TINTS` entry:
   *  a `--token` name wraps in `var()`, everything else (`currentColor`, an
   *  `hsl()` expression, a `var(--press-ink)` percentage) is already the
   *  literal CSS text. */
  function tintKey(
    tone: string,
    percent: number | string,
    surface: string,
    space = 'srgb',
  ): string {
    const colour = tone.startsWith('--') ? `var(${tone})` : tone
    const pct = typeof percent === 'number' ? `${percent}%` : percent
    const bg = surface === 'transparent' ? 'transparent' : `var(${surface})`
    return `${space === 'srgb' ? '' : `${space}:`}${colour}|${pct}|${bg}`
  }

  it('CONTRAST_TINTS plus EXCLUDED_TINTS is exactly every color-mix( in styles/', () => {
    // The same two-way pattern as `BASE_PALETTE` against `tokens.css`, over
    // every stylesheet rather than the three this measurement started with:
    // a new tint anywhere fails this test until it is measured or excluded
    // on purpose, so it cannot ship silently.
    const css = styleFiles.map((f) => read(`styles/${f}`)).join('\n')
    const found = new Set(findColorMixes(css).map(mixKey))
    const listed = new Set([
      ...CONTRAST_TINTS.map((t) => tintKey(t.tone, t.percent, t.surface)),
      ...EXCLUDED_TINTS.map((t) => tintKey(t.tone, t.percent, t.surface, t.space)),
    ])
    expect([...listed].sort()).toEqual([...found].sort())
  })

  it('CONTRAST_TINTS and EXCLUDED_TINTS do not name the same tint twice', () => {
    const listedTints = CONTRAST_TINTS.map((t) => tintKey(t.tone, t.percent, t.surface))
    const excludedTints = new Set(
      EXCLUDED_TINTS.map((t) => tintKey(t.tone, t.percent, t.surface, t.space)),
    )
    for (const key of listedTints) expect(excludedTints.has(key), key).toBe(false)
  })
})

describe('the identity disc, across every hue', () => {
  /** `.ident-disc` mixes `hsl(var(--ident-hue) 60% 50%) 22%` into `--panel`,
   *  and `--ident-hue` is not a token -- `Identity.tsx` sets it inline, one
   *  value per person, derived from the address. `CONTRAST_TINTS` cannot
   *  hold it: there is no one hue to measure. Instead this sweeps every 15°
   *  of it, in every palette `contrast.test.ts` already measures, and holds
   *  the worst case to 4.5:1 explicitly -- so a theme that moves `--panel` or
   *  `--text` and pushes some hue under the line fails here on purpose,
   *  rather than shipping a disc that is unreadable for one address in eight
   *  and readable for the rest. */
  function hslToHex(h: number, s: number, l: number): string {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const hp = (((h % 360) + 360) % 360) / 60
    const x = c * (1 - Math.abs((hp % 2) - 1))
    const [r1, g1, b1] =
      hp < 1
        ? [c, x, 0]
        : hp < 2
          ? [x, c, 0]
          : hp < 3
            ? [0, c, x]
            : hp < 4
              ? [0, x, c]
              : hp < 5
                ? [x, 0, c]
                : [c, 0, x]
    const m = l - c / 2
    const toHex = (v: number) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, '0')
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`
  }

  const palettes: Record<string, Partial<ThemeTokens>> = {
    'system (dark)': {},
    'system (light)': systemLight,
    'a product, light': productTheme(sample, 'sample').tokens,
    'a product, dark': productTheme(sample, 'sample-night').tokens,
  }

  it('holds 4.5:1 for --text at every hue, in every palette this file measures', () => {
    let worst = { ratio: Number.POSITIVE_INFINITY, hue: -1, theme: '' }
    for (const [theme, tokens] of Object.entries(palettes)) {
      const palette = { ...BASE_PALETTE, ...tokens }
      const panel = palette['--panel']
      const text = palette['--text']
      if (!panel || !text) throw new Error(`${theme}: missing --panel or --text`)
      for (let hue = 0; hue < 360; hue += 15) {
        const bg = mix(hslToHex(hue, 0.6, 0.5), panel, 22)
        const r = ratio(text, bg)
        if (r < worst.ratio) worst = { ratio: r, hue, theme }
      }
    }
    // The worst case across all 24 hues and all four palettes: a hue of 60°
    // (a saturated yellow) in the base dark palette, mixed to #404427, is
    // 8.23:1 against --text -- comfortably over 4.5:1, and nowhere near it.
    // A dark theme's --text sits at the light end of the scale and --panel
    // at the dark end, so a 22% tint of any hue moves the surface only a
    // little; a light theme's --text sits at the dark end against a --panel
    // near white, for the same reason from the other side. No hue fails
    // here, so there is nothing to record as a known failure -- only the
    // worst case, so a future change that pushes one under 4.5:1 fails this
    // test on purpose instead of shipping quietly.
    expect(worst.theme).toBe('system (dark)')
    expect(worst.hue).toBe(60)
    expect(worst.ratio.toFixed(2)).toBe('8.23')
    expect(worst.ratio).toBeGreaterThanOrEqual(4.5)
  })
})
