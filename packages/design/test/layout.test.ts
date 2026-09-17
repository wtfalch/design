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
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS, MEDIA_QUERIES, useMediaQuery } from '../src/layout'

describe('BREAKPOINTS', () => {
  it('keeps the mailbox shell’s widths: below 860 is one column, 1150 is three', () => {
    expect(BREAKPOINTS.medium).toBe(860)
    expect(BREAKPOINTS.wide).toBe(1150)
  })
})

describe('MEDIA_QUERIES', () => {
  it('is a min-width query built off BREAKPOINTS, not a second literal', () => {
    expect(MEDIA_QUERIES.medium).toBe(`(min-width: ${BREAKPOINTS.medium}px)`)
    expect(MEDIA_QUERIES.wide).toBe(`(min-width: ${BREAKPOINTS.wide}px)`)
  })

  it('matches today’s values', () => {
    expect(MEDIA_QUERIES.medium).toBe('(min-width: 860px)')
    expect(MEDIA_QUERIES.wide).toBe('(min-width: 1150px)')
  })
})

function Probe({ query }: { query: string }) {
  return String(useMediaQuery(query))
}

describe('useMediaQuery with no window', () => {
  it('reads false rather than throwing', () => {
    expect(typeof window).toBe('undefined')
    const html = renderToStaticMarkup(createElement(Probe, { query: MEDIA_QUERIES.wide }))
    expect(html).toBe('false')
  })
})
