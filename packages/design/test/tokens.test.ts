/**
 * The stylesheet and the type, held to each other in both directions.
 *
 * This is the test the old contract did not have, and its absence is why five
 * dead keys sat in the vocabulary for weeks: `ThemeTokens` declared
 * `--pad-1`…`--pad-5`, `tokens.css` stopped defining them when the spacing
 * scale was renamed to `--space-*`, and the only check in place compared the
 * type to a list also written in TypeScript. Both halves agreed with each other
 * and neither had read the CSS — which is the file a theme's values actually
 * land in.
 *
 * So the assertion here is deliberately about the *stylesheet*: every token it
 * declares is in exactly one of the three lists, and every token the lists name
 * is declared. A token added to `tokens.css` and to no list fails, rather than
 * quietly becoming a fourth category nobody documented.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { DERIVED_TOKENS, FIXED_TOKENS, THEMES, TOKEN_KEYS } from '../src/themes'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/tokens.css'), 'utf8')

/** Declarations only — `--x:` at the head of a line. A `var(--y)` inside a
 *  value is a reference, and counting one as a declaration would make every
 *  token that mentions another token declare it twice. */
function declaredIn(source: string): Set<string> {
  const names = new Set<string>()
  for (const line of source.split('\n')) {
    const m = line.match(/^\s+(--[a-z0-9-]+)\s*:/)
    if (m) names.add(m[1])
  }
  return names
}

const declared = declaredIn(css)

const themeable = new Set<string>(TOKEN_KEYS)
const derived = new Set<string>(DERIVED_TOKENS)
const fixed = new Set<string>(FIXED_TOKENS)
const claimed = new Set<string>([...themeable, ...derived, ...fixed])

describe('the token vocabulary', () => {
  it('declares something', () => {
    // A parser that silently matches nothing would make every assertion below
    // pass over an empty set.
    expect(declared.size).toBeGreaterThan(60)
  })

  it('has no token in two lists at once', () => {
    const both = [...claimed].filter(
      (k) => [themeable.has(k), derived.has(k), fixed.has(k)].filter(Boolean).length > 1,
    )
    expect(both, 'a token is themeable, derived or fixed — never two').toEqual([])
  })

  it('classifies every token the stylesheet declares', () => {
    const unclassified = [...declared].filter((k) => !claimed.has(k)).sort()
    expect(
      unclassified,
      'add each to TOKEN_KEYS, DERIVED_TOKENS or FIXED_TOKENS in themes.ts — ' +
        'a token in none of them is one no theme can reach and nobody decided to withhold',
    ).toEqual([])
  })

  it('declares every token the lists name', () => {
    const missing = [...claimed].filter((k) => !declared.has(k)).sort()
    expect(
      missing,
      'these are named in themes.ts and defined nowhere in tokens.css. ' +
        'A theme setting one of them sets nothing, silently — this is exactly ' +
        'how --pad-1..--pad-5 survived the rename to --space-*',
    ).toEqual([])
  })
})

describe('the derived tokens', () => {
  it('are computed from a themeable token, not written as literals', () => {
    // The point of the category. `--text-lg: 18px` would be a step that stops
    // moving when `--font-size` moves, which is the same as having no scale.
    const literals: string[] = []
    for (const line of css.split('\n')) {
      const m = line.match(/^\s+(--[a-z0-9-]+)\s*:\s*(.+?);/)
      if (!m || !derived.has(m[1])) continue
      if (!m[2].includes('var(')) literals.push(`${m[1]}: ${m[2]}`)
    }
    expect(
      literals,
      'a derived token must be calc() off the themeable token it derives from',
    ).toEqual([])
  })
})

describe('reduced motion', () => {
  /**
   * Motion is an accessibility setting before it is a style, so this outranks
   * every theme. It lives in `tokens.css` rather than in a component sheet
   * because it is part of the vocabulary's contract: a theme may set the
   * durations, it may not decide whether they apply.
   */
  const block = css.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\n}/)?.[0] ?? ''

  it('exists', () => {
    expect(block, 'tokens.css must collapse motion under prefers-reduced-motion').not.toBe('')
  })

  it('collapses every duration to zero', () => {
    const durations = [...declared].filter((k) => k.startsWith('--dur-'))
    expect(durations.length).toBeGreaterThan(0)
    for (const key of durations) {
      /* `!important`, because a theme lands as inline styles on the root and an
         inline declaration beats a plain rule. Without it a theme that sets a
         duration keeps it under reduced motion -- measured on the `brand`
         fixture, whose `--dur-md: 260ms` survived. */
      expect(
        block,
        `${key} must be collapsed under reduced motion, and outrank an inline theme`,
      ).toMatch(new RegExp(`${key}\\s*:\\s*0s\\s*!important`))
    }
  })

  it('cancels the interaction transforms', () => {
    // A hover lift and a press shrink are motion too, and a theme that sets
    // them cannot be the one that decides they are exempt.
    for (const key of ['--hover-lift', '--hover-scale', '--press-scale']) {
      expect(block, `${key} must be neutralised under reduced motion`).toContain(key)
    }
  })
})

describe('the built-in themes', () => {
  it('name only themeable tokens', () => {
    // A theme is `Partial<ThemeTokens>`, so this cannot fail at compile time
    // for a theme written in TypeScript — but it can for one that arrives as
    // JSON, and these four are the fixtures the contrast test measures.
    for (const [id, theme] of Object.entries(THEMES)) {
      const bad = Object.keys(theme.tokens).filter((k) => !themeable.has(k))
      expect(bad, `theme "${id}" names a token no theme may set`).toEqual([])
    }
  })

  it('declare a colour scheme', () => {
    // Native controls and scrollbars follow it, and there is no other signal
    // that tells the browser which way round the page is.
    for (const [id, theme] of Object.entries(THEMES)) {
      expect(['light', 'dark'], `theme "${id}"`).toContain(theme.scheme)
    }
  })

  it('leaves `system` without a palette', () => {
    // The one theme that must not state one: the prefers-color-scheme block is
    // scoped to it and needs the base values to fall through.
    expect(Object.keys(THEMES.system.tokens)).toEqual([])
  })
})
