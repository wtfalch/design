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
 * So every built-in theme is measured here, pair by pair, with the WCAG 2
 * relative-luminance formula. A theme that ships with this package cannot
 * fail these numbers, and a consumer can run the same function on their own.
 *
 * `system` is two palettes: the base values in `tokens.css` when the OS is
 * dark, and the block in `base.css` scoped to `[data-theme='system']` when it
 * is light. Both are measured; the light one is the one that had the 1.67:1
 * running pill.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ratio } from '../src/contrast'
import { THEMES, type ThemeTokens } from '../src/themes'

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

const baseCss = read('styles/base.css')
const lightBlock = baseCss.match(/:root\[data-theme='system'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const systemLight = hexes(lightBlock)

/** Every palette a person can end up looking at. */
const palettes: Record<string, Partial<ThemeTokens>> = {
  'system (dark)': { ...base },
  'system (light)': { ...base, ...systemLight },
}
for (const [id, theme] of Object.entries(THEMES)) {
  if (id === 'system') continue
  palettes[id] = { ...base, ...theme.tokens }
}

/** What sits on what. Text pairs want 4.5; boundaries want 3 (WCAG 1.4.11). */
const TEXT: [keyof ThemeTokens, keyof ThemeTokens, string][] = [
  ['--text', '--bg', 'body text on the page'],
  ['--text', '--panel', 'body text on a panel'],
  ['--text', '--panel-2', 'body text on a raised panel'],
  ['--muted', '--panel', 'a hint on a panel'],
  ['--muted', '--bg', 'a hint on the page'],
  ['--on-accent', '--accent', 'the label on the primary button'],
  ['--good', '--panel', 'a good state pill'],
  ['--warn', '--panel', 'a warning pill'],
  ['--bad', '--panel', 'a failing pill'],
  ['--info', '--panel', 'an info pill'],
  ['--info', '--bg', 'an info callout on the page'],
]
const BOUNDARY: [keyof ThemeTokens, keyof ThemeTokens, string][] = [
  ['--border-strong', '--panel', "a control's outline"],
  ['--accent', '--panel', 'the focus ring'],
]

describe('every theme is measured', () => {
  it('parsed the palettes it claims to', () => {
    expect(Object.keys(palettes).length).toBeGreaterThanOrEqual(4)
    expect(systemLight['--bg'], 'the light system block was found in base.css').toBeTruthy()
  })

  for (const [name, p] of Object.entries(palettes)) {
    describe(name, () => {
      for (const [fg, bg, what] of TEXT) {
        it(`${what}: ${fg} on ${bg} is at least 4.5:1`, () => {
          const [a, b] = [p[fg], p[bg]]
          expect(a, `${fg} is a literal colour`).toBeTruthy()
          expect(b, `${bg} is a literal colour`).toBeTruthy()
          const r = ratio(a as string, b as string)
          expect(r, `${a} on ${b} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
        })
      }
      for (const [fg, bg, what] of BOUNDARY) {
        it(`${what}: ${fg} against ${bg} is at least 3:1`, () => {
          const r = ratio(p[fg] as string, p[bg] as string)
          expect(r, `${p[fg]} against ${p[bg]} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
        })
      }
    })
  }
})
