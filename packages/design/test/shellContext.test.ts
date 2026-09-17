/**
 * `Shell`'s `context` slot: the title block's middle position (D3).
 *
 * Three things this guards, because the brief that added the slot called
 * each one out as the way to get it wrong:
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

  it('does not move brand or who -- their own wrapper classes are unchanged by its presence', () => {
    const without = renderToStaticMarkup(createElement(Shell, { brand, who, nav, children }))
    const withCtx = renderToStaticMarkup(
      createElement(Shell, { brand, who, nav, context: longContext, children }),
    )
    // Same band/who wrapper classes in both -- only the new slot's own div is inserted between them.
    expect(withCtx.replace(/<div class="shell-head-context">.*?<\/div>/, '')).toBe(without)
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
