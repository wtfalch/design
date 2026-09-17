/**
 * `Shell`'s `context` slot: the title block's middle position (D3).
 *
 * Four things this guards, because the brief that added the slot -- and a
 * refuter who found what it missed -- called each one out as the way to get
 * it wrong:
 *
 * 1. A `Shell` call that never passes `context` renders exactly the markup
 *    it rendered before the slot existed -- three apps already call `Shell`
 *    without it, and their markup must not change under them. The golden
 *    strings below were captured from the component as it stood immediately
 *    before this slot was added (commit 9fbe5b5), not derived from the new
 *    code, so this test cannot pass by construction.
 * 2. The slot sits between `brand` and `who`, in that order, in every band
 *    that draws a header row -- the single band with no `side`, and both of
 *    `shell-head-phone`/`shell-head-wide` when `side` is present.
 * 3. Nothing in the package -- not the prop name, not a class -- says
 *    "organisation". That word belongs to the app.
 * 4. `who` gets a shrink guard, `.shell-head-who`, the moment `context`
 *    exists -- without it, `context`'s own `flex: 1 1 auto` gives the row a
 *    second box that can overflow on its own, and the browser then shrinks
 *    every flexible sibling including `who`, clipping whatever sits at its
 *    trailing edge. This suite only checks the markup carries the class in
 *    the right condition; it cannot compute flexbox, so it cannot prove the
 *    clipping is gone. That proof is a real layout assertion in a browser --
 *    see `gallery-e2e/e2e/shell-context-overflow.spec.ts`.
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Shell from '../src/components/Shell'

const brand = createElement('strong', null, 'Brand')
const who = createElement('span', null, 'who@example.com')
const side = createElement('nav', null, 'side')
const nav = createElement('div', null, 'nav row')
const longContext = createElement('span', null, 'Northwind Traders International Holdings Group')
/** `createElement`'s three-argument form does not reconcile with `Shell`'s
 *  required `children` (see `formControls.test.ts`'s own note on `Field`),
 *  so it goes in the props object as a shorthand instead. */
const children = 'kids'

const GOLDEN_NO_SIDE =
  '<div class="shell flex flex-col min-h-screen surface-bg text-text"><header class="flex-none border-b border-border surface-panel"><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] flex items-center justify-between gap-4 py-3 min-w-0"><strong>Brand</strong><div class="flex items-center gap-3 min-w-0"><span>who@example.com</span></div></div><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] pb-2"><div>nav row</div></div></header><main class="w-full mx-auto px-4 max-w-[var(--shell-measure)] flex-1 py-6 min-w-0">kids</main></div>'

const GOLDEN_WITH_SIDE =
  '<div class="shell flex flex-col min-h-screen surface-bg text-text"><header class="flex-none border-b border-border surface-panel"><div class="shell-head-phone"><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] flex items-center justify-between gap-4 py-3 min-w-0"><strong>Brand</strong><div class="flex items-center gap-3 min-w-0"><span>who@example.com</span></div></div><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] pb-2"><div>nav row</div></div></div><div class="shell-head-wide"><div class="flex items-center min-w-0"><div class="flex-none w-[var(--shell-side-width)] px-3 py-3 flex items-center min-w-0"><strong>Brand</strong></div><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] flex items-center justify-end gap-4 py-3 min-w-0"><div class="flex items-center gap-3 min-w-0"><span>who@example.com</span></div></div></div><div class="flex min-w-0"><div class="flex-none w-[var(--shell-side-width)]"></div><div class="w-full mx-auto px-4 max-w-[var(--shell-measure)] pb-2"><div>nav row</div></div></div></div></header><div class="flex-1 min-h-0 flex min-w-0"><div class="shell-side hidden md:block md:flex-none w-[var(--shell-side-width)] border-r border-border surface-panel overflow-hidden"><nav>side</nav></div><main class="w-full mx-auto px-4 max-w-[var(--shell-measure)] flex-1 py-6 min-w-0">kids</main></div></div>'

describe('Shell with no `context`', () => {
  it('renders byte-identical markup to before the slot existed, with no side', () => {
    const html = renderToStaticMarkup(createElement(Shell, { brand, who, nav, children }))
    expect(html).toBe(GOLDEN_NO_SIDE)
  })

  it('renders byte-identical markup to before the slot existed, with side', () => {
    const html = renderToStaticMarkup(createElement(Shell, { brand, who, nav, side, children }))
    expect(html).toBe(GOLDEN_WITH_SIDE)
  })
})

describe('Shell with `context`', () => {
  it('renders nothing extra when omitted, but sits between brand and who when given, no side', () => {
    const html = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, context: longContext, children }),
    )
    expect(html.split('shell-head-context').length - 1).toBe(1)
    expect(html.indexOf('Brand')).toBeLessThan(html.indexOf('shell-head-context'))
    expect(html.indexOf('shell-head-context')).toBeLessThan(html.indexOf('who@example.com'))
  })

  it('appears once per header copy, brand still left and who still right, with side', () => {
    const html = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, side, context: longContext, children }),
    )
    // One copy each for `shell-head-phone` and `shell-head-wide`.
    expect(html.split('shell-head-context').length - 1).toBe(2)
    for (const copyClass of ['shell-head-phone', 'shell-head-wide']) {
      const copyStart = html.indexOf(`class="${copyClass}"`)
      const copyEnd = html.indexOf('</div></div>', copyStart)
      const copy = html.slice(copyStart, copyEnd)
      expect(copy.indexOf('Brand')).toBeLessThan(copy.indexOf('shell-head-context'))
      expect(copy.indexOf('shell-head-context')).toBeLessThan(copy.indexOf('who@example.com'))
    }
  })

  it('does not move brand or who -- who keeps its own base classes plus the shrink guard', () => {
    const without = renderToStaticMarkup(createElement(Shell, { brand, who, nav, children }))
    const withCtx = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, context: longContext, children }),
    )
    // Strip the inserted `context` div and the shrink-guard class it triggers
    // on `who`; what is left should be exactly the markup rendered with no
    // `context` at all.
    const stripped = withCtx
      .replace(/<div class="shell-head-context">.*?<\/div>/, '')
      .replace(' shell-head-who', '')
    expect(stripped).toBe(without)
  })

  it('gives `who` the shrink guard only once `context` exists to compete with it', () => {
    const without = renderToStaticMarkup(createElement(Shell, { brand, who, nav, children }))
    expect(without).not.toContain('shell-head-who')

    const withCtx = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, context: longContext, children }),
    )
    // One `who` box with no side, two (`shell-head-phone` + `shell-head-wide`) with it.
    expect(withCtx.split('shell-head-who').length - 1).toBe(1)

    const withSideAndCtx = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, side, context: longContext, children }),
    )
    expect(withSideAndCtx.split('shell-head-who').length - 1).toBe(2)
  })
})

describe('shell.css owns the new slot’s layout', () => {
  const css = readFileSync(new URL('../src/styles/shell.css', import.meta.url), 'utf8')

  it('defines .shell-head-context, not a Tailwind utility written only in Shell.tsx', () => {
    const match = css.match(/\.shell-head-context\s*\{([^}]*)\}/)
    expect(match).not.toBeNull()
    const body = match?.[1] ?? ''
    // The properties truncation depends on: a flex item that claims leftover
    // space rather than its own width, can shrink past its content, and
    // single-line ellipses instead of wrapping.
    expect(body).toMatch(/flex:\s*1 1 auto/)
    expect(body).toMatch(/min-width:\s*0/)
    expect(body).toMatch(/overflow:\s*hidden/)
    expect(body).toMatch(/white-space:\s*nowrap/)
    expect(body).toMatch(/text-overflow:\s*ellipsis/)
  })

  it('is not named or hidden behind a raw md: utility the way 0.16.1 was', () => {
    expect(css).not.toMatch(/shell-head-context[^{]*\bmd:/)
  })

  it('defines .shell-head-who as a non-shrinking box, not a `shrink-0` utility in Shell.tsx', () => {
    const match = css.match(/\.shell-head-who\s*\{([^}]*)\}/)
    expect(match).not.toBeNull()
    expect(match?.[1] ?? '').toMatch(/flex:\s*none/)
  })
})

describe('the slot never names an organisation', () => {
  const src = readFileSync(new URL('../src/components/Shell.tsx', import.meta.url), 'utf8')

  it('has no prop or class called organisation/organization/tenant', () => {
    const propBlock = src.slice(src.indexOf('export default function Shell('), src.indexOf('}) {'))
    for (const forbidden of ['organisation', 'organization', 'tenant', 'orgSwitcher']) {
      const re = new RegExp(`\\b${forbidden}\\s*\\??:`, 'i')
      expect(propBlock).not.toMatch(re)
    }
  })
})
