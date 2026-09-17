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
 * `contrastFailures` also measures `CONTRAST_TINTS`: `Card`, `Callout` and
 * `Pill` tint a tone into `--panel` with `color-mix()` and draw text over the
 * result, not over `--panel` itself. Two of the four palettes below fail a
 * tinted pair -- real, shipped defects the flat check never saw, listed
 * explicitly rather than fixed, because changing a colour or a percentage
 * here would move a pixel.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { BASE_PALETTE, CONTRAST_PAIRS, CONTRAST_TINTS, contrastFailures } from '../src/contrast'
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
   *  Two of these fail a tinted pair once `CONTRAST_TINTS` is added to the
   *  measurement. Both are real: `system (light)`'s toggle button holds
   *  `--accent` text over its own colour at 18% into a white panel, and the
   *  sample fixture's good pill does the same at 10%. Neither is fixed here
   *  -- a colour or a percentage change moves a pixel, and this task's job is
   *  the measurement, not the palette. The expected list is explicit so a
   *  future fix has to delete a line on purpose, and a new failure cannot
   *  join it silently. */
  const knownTintFailures: Record<string, string[]> = {
    'system (light)': [
      'a pressed, held toggle button: --accent #0e7872 on --accent 18% into --panel (#d4e7e6) is 4.15:1, under 4.5:1',
    ],
    'a product, light': [
      "a good pill's own tint: --good #1b7f4b on --good 10% into --panel (#e8f2ed) is 4.39:1, under 4.5:1",
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
  it('CONTRAST_TINTS is exactly the color-mix(..., var(--panel)) rules in card.css, callout.css and base.css', () => {
    // The same two-way pattern as `BASE_PALETTE` against `tokens.css`: the
    // list and the stylesheet are two copies of the same fact, and only a
    // test running against both catches the day they disagree.
    const css = read('styles/card.css') + read('styles/callout.css') + read('styles/base.css')
    const found = new Set<string>()
    for (const m of css.matchAll(
      /color-mix\(in srgb, var\((--[a-z-]+)\) (\d+)%, var\(--panel\)\)/g,
    )) {
      found.add(`${m[1]}|${m[2]}`)
    }
    const listed = new Set(CONTRAST_TINTS.map((t) => `${t.tone}|${t.percent}`))
    expect([...listed].sort()).toEqual([...found].sort())
  })
})
