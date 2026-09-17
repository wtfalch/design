/**
 * `BREAKPOINTS`, `MEDIA_QUERIES`, and `useMediaQuery` with no `window` at all.
 *
 * Server-rendered, like `formControls.test.ts`: a component that calls
 * `useMediaQuery` has to render before a browser ever attaches a `window`,
 * and `renderToStaticMarkup` is genuinely windowless where a jsdom
 * environment is not -- jsdom defines `window` itself, so only the default
 * node environment this file runs under can stand in for a server. The
 * reactive half -- matching, and reacting to a change -- is
 * `useMediaQuery.test.ts`, under jsdom, where a `window` exists to fake a
 * `matchMedia` on.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS, MEDIA_QUERIES, useMediaQuery } from '../src/layout'

/** `--breakpoint-*` out of the Tailwind this package compiles its utilities
 *  with, so the check follows Tailwind rather than a copy of its numbers. */
function tailwindBreakpoints(): Record<string, string> {
  const pkg = createRequire(import.meta.url).resolve('tailwindcss/package.json')
  const css = readFileSync(join(dirname(pkg), 'theme.css'), 'utf8')
  const out: Record<string, string> = {}
  for (const m of css.matchAll(/--breakpoint-([a-z0-9]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

describe('BREAKPOINTS', () => {
  it('are Tailwind’s, every one of them and nothing else', () => {
    // Two sets once shipped side by side: `md:` in the components at 48rem,
    // and 860 / 1150 here, copied from the mailbox shell.
    const tailwind = tailwindBreakpoints()
    expect(Object.keys(tailwind).length).toBeGreaterThan(0)
    expect(Object.keys(BREAKPOINTS)).toEqual(Object.keys(tailwind))
    for (const [name, px] of Object.entries(BREAKPOINTS)) {
      expect(`${px / 16}rem`, name).toBe(tailwind[name])
    }
  })
})

describe('MEDIA_QUERIES', () => {
  it('is a min-width query in rem built off BREAKPOINTS, not a second literal', () => {
    for (const [name, px] of Object.entries(BREAKPOINTS)) {
      expect(MEDIA_QUERIES[name as keyof typeof BREAKPOINTS]).toBe(`(min-width: ${px / 16}rem)`)
    }
  })

  it('matches today’s values', () => {
    expect(MEDIA_QUERIES.md).toBe('(min-width: 48rem)')
    expect(MEDIA_QUERIES.lg).toBe('(min-width: 64rem)')
  })

  it('is the width shell.css switches at', () => {
    const css = readFileSync(new URL('../src/styles/shell.css', import.meta.url), 'utf8')
    expect(css).toContain(`@media ${MEDIA_QUERIES.md}`)
  })
})

function Probe({ query }: { query: string }) {
  return String(useMediaQuery(query))
}

describe('useMediaQuery with no window', () => {
  it('reads false rather than throwing', () => {
    expect(typeof window).toBe('undefined')
    const html = renderToStaticMarkup(createElement(Probe, { query: MEDIA_QUERIES.lg }))
    expect(html).toBe('false')
  })
})
