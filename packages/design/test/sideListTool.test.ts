// @vitest-environment jsdom
/**
 * `SideList.Tool` -- D2's disclosure, pinned two ways.
 *
 * The static shape (collapsed by default, `defaultOpen` starting it open, the
 * `aria-expanded`/`aria-controls` pairing, a real `<button>` rather than a
 * `<div onClick>`, nested `SideList.Item`s staying real anchors) is server-
 * rendered, the same way `formControls.test.ts` pins React Aria's own
 * attributes: nothing here needs a live DOM.
 *
 * The interaction -- a press toggling `aria-expanded` and the `hidden`
 * attribute on the sections it controls -- needs a mounted component, the
 * same way `useMediaQuery.test.ts` mounts with `createRoot` under
 * `@vitest-environment jsdom` rather than asserting on a string. `.click()`
 * is what a keyboard Enter/Space activation on a real `<button>` fires too:
 * the browser's own activation behaviour is what `type="button"` buys this
 * component, not a keydown handler this file would otherwise have to
 * simulate by hand.
 *
 * Mounted tests render `SideList.Tool` on its own, not inside `SideList`
 * itself: the full component brings `ScrollArea`'s `ResizeObserver`, which
 * jsdom does not implement, and none of that machinery is what is under
 * test here. `SideListContext` defaults to `null` outside a `SideList`, and
 * `SideList.Item`'s `ctx?.close()` is already written to no-op when it is --
 * the same optional chain a bare `SideList.Item` in a unit test relies on
 * anywhere else in this package.
 *
 * The three helpers below exist for the same reason `formControls.test.ts`'s
 * own `field()` does: `createElement`'s three-argument form does not
 * reconcile rest-argument children against a required `children` field, so
 * each helper folds its children into the props object instead.
 */
import { act, createElement } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SideList, {
  type SideListItemProps,
  type SideListProps,
  type SideListToolProps,
} from '../src/components/SideList'

const nav = (props: Omit<SideListProps, 'children'>, children: React.ReactNode) =>
  createElement(SideList, { ...props, children })

const tool = (props: Omit<SideListToolProps, 'children'>, children: React.ReactNode) =>
  createElement(SideList.Tool, { ...props, children })

const item = (props: Omit<SideListItemProps, 'children'>, children: React.ReactElement) =>
  createElement(SideList.Item, { ...props, children })

const buckets = (extra: Omit<SideListItemProps, 'children'> = {}) =>
  item(extra, createElement('a', { href: '#buckets' }, 'Buckets'))

describe('SideList.Tool, server-rendered', () => {
  it('is collapsed by default: aria-expanded="false" and its sections carry hidden', () => {
    const html = renderToStaticMarkup(
      nav(
        { label: 'Places', open: false, onOpenChange: () => {} },
        tool({ label: 'Storage' }, buckets()),
      ),
    )
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/side-list-tool-sections" hidden=""/)
  })

  it('defaultOpen starts it open, expanded and visible', () => {
    const html = renderToStaticMarkup(
      nav(
        { label: 'Places', open: false, onOpenChange: () => {} },
        tool({ label: 'Storage', defaultOpen: true }, buckets()),
      ),
    )
    expect(html).toContain('aria-expanded="true"')
    expect(html).not.toMatch(/side-list-tool-sections"[^>]* hidden/)
  })

  it('aria-controls on the trigger names the id on its own sections', () => {
    const html = renderToStaticMarkup(
      nav(
        { label: 'Places', open: false, onOpenChange: () => {} },
        tool({ label: 'Storage' }, buckets()),
      ),
    )
    const controls = /aria-controls="([^"]+)"/.exec(html)?.[1]
    expect(controls).toBeTruthy()
    expect(html).toContain(`id="${controls}"`)
  })

  it('the trigger is a real <button>, not a link or a div with a handler', () => {
    const html = renderToStaticMarkup(
      nav(
        { label: 'Places', open: false, onOpenChange: () => {} },
        tool({ label: 'Storage' }, buckets()),
      ),
    )
    expect(html).toMatch(/<button type="button" class="side-list-link side-list-tool-trigger"/)
  })

  /** The whole point of the disclosure: a destination underneath a tool is
   *  still `SideList.Item`'s real anchor, current-page marking included --
   *  nothing about being nested changes that contract. */
  it('nested SideList.Items stay real anchors, and current still marks one', () => {
    const html = renderToStaticMarkup(
      nav(
        { label: 'Places', open: false, onOpenChange: () => {} },
        tool({ label: 'Storage', defaultOpen: true }, buckets({ current: true })),
      ),
    )
    expect(html).toMatch(/<a href="#buckets" class="side-list-link" aria-current="page">/)
  })
})

describe('SideList.Tool, mounted', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.body.appendChild(document.createElement('div'))
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('a press toggles aria-expanded and the sections’ hidden attribute, both ways', () => {
    act(() => root.render(tool({ label: 'Storage' }, buckets())))
    const trigger = container.querySelector('.side-list-tool-trigger') as HTMLButtonElement
    const sections = container.querySelector('.side-list-tool-sections') as HTMLDivElement

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(sections.hasAttribute('hidden')).toBe(true)

    act(() => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(sections.hasAttribute('hidden')).toBe(false)

    act(() => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(sections.hasAttribute('hidden')).toBe(true)
  })

  /** The rail and the sheet mount the same children twice, as two separate
   *  instances (see `SideList`'s own docblock) -- so two `SideList.Tool`s
   *  with the same label must not fight over one id, and toggling one must
   *  not touch the other. */
  it('two mounted instances of the same tool keep independent ids and state', () => {
    act(() =>
      root.render(
        createElement(
          'div',
          {},
          tool({ label: 'Storage' }, buckets()),
          tool({ label: 'Storage' }, buckets()),
        ),
      ),
    )
    const triggers = container.querySelectorAll('.side-list-tool-trigger')
    expect(triggers).toHaveLength(2)
    const [first, second] = Array.from(triggers) as HTMLButtonElement[]
    const firstControls = first.getAttribute('aria-controls')
    const secondControls = second.getAttribute('aria-controls')
    expect(firstControls).not.toBe(secondControls)

    act(() => first.click())
    expect(first.getAttribute('aria-expanded')).toBe('true')
    expect(second.getAttribute('aria-expanded')).toBe('false')
  })
})
