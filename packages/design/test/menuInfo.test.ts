// @vitest-environment jsdom
/**
 * `Menu`'s `info` slot, mounted.
 *
 * Server-rendering cannot see this: the popover does not exist in the markup
 * until the trigger has been pressed, and a static render never presses
 * anything. Mounted with `createRoot`, like `useMediaQuery.test.ts` -- what
 * is under test is the open menu's actual DOM, specifically where `info`
 * lands relative to `role="menu"`, which is the whole guarantee the
 * docblock makes: no keyboard focus, no choice semantics.
 */
import { act, createElement } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import Menu from '../src/components/Menu'

let container: HTMLDivElement | undefined
let root: Root | undefined

afterEach(() => {
  if (root) act(() => root?.unmount())
  container?.remove()
  container = undefined
  root = undefined
})

function mount(el: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root?.render(el))
}

/** Presses the trigger the way a mouse does: React Aria's `usePress` answers
 *  a plain `click` event whether or not the pointer events that would
 *  normally precede it exist. The open popover portals to `document.body`
 *  rather than rendering inside `container`, so everything queried after
 *  this reads from the document, not the mount point. */
function open() {
  const trigger = container?.querySelector('button')
  if (!trigger) throw new Error('no trigger button found')
  act(() => trigger.click())
}

const items = [{ id: 'sign-out', label: 'Sign out' }]

describe("Menu's info slot", () => {
  it('renders outside the menu list, with no menu-item semantics', () => {
    mount(
      createElement(Menu, {
        label: 'Your account',
        trigger: createElement(AriaButton, null, 'Account'),
        items,
        info: createElement('div', { 'data-testid': 'info' }, 'will@wtfalch.dev'),
      }),
    )
    open()

    // The open popover portals to `document.body`, not into `container`.
    const info = document.querySelector('[data-testid="info"]')
    const menu = document.querySelector('[role="menu"]')
    expect(info, 'info renders once the menu is open').toBeTruthy()
    expect(menu, 'the interactive list is still there').toBeTruthy()

    // A sibling of the list, not a descendant of it -- outside `role="menu"`.
    expect(menu?.contains(info as Node)).toBe(false)

    // Not a menu item: no menuitem role on it or an ancestor, no tabindex,
    // and it never ends up as the element focus landed on when the menu
    // opened.
    expect(info?.closest('[role="menuitem"]')).toBeNull()
    expect(info?.getAttribute('role')).toBeNull()
    expect(info?.hasAttribute('tabindex')).toBe(false)
    expect(document.activeElement).not.toBe(info)

    // It sits above the actions in document order.
    const actionRow = document.querySelector('[role="menuitem"]')
    expect(info?.compareDocumentPosition(actionRow as Node) as number).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('adds nothing to the sheet when omitted', () => {
    mount(
      createElement(Menu, {
        label: 'Message actions',
        trigger: createElement(AriaButton, null, 'Actions'),
        items,
      }),
    )
    open()
    expect(document.querySelector('.menu-info')).toBeNull()
  })
})
