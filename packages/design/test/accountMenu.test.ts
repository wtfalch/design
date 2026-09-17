/**
 * `AccountMenu`, server-rendered.
 *
 * Like `formControls.test.ts`: what changed is markup and attributes, not
 * behaviour React Aria already owns and `menuInfo.test.ts` already covers by
 * mounting. What is worth pinning here is the trigger's own shape -- one
 * `.account-trigger` wrapping the `Identity` chip directly, nothing else
 * between them -- because that adjacency is the whole fix for the hover bug
 * the component's docblock describes: a second box around the chip is
 * exactly what would show up here as an extra element between the two
 * classes.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AccountMenu from '../src/components/AccountMenu'

const render = () =>
  renderToStaticMarkup(
    createElement(AccountMenu, {
      name: 'Ada Lovelace',
      address: 'ada@example.com',
      label: 'Your account',
      info: createElement('span', null, 'ada@example.com'),
      items: [{ id: 'sign-out', label: 'Sign out' }],
    }),
  )

describe('AccountMenu', () => {
  it('wraps the identity chip directly in the trigger, no box between them', () => {
    const html = render()
    // The chip (`.ident`) is the trigger's own next element, not nested
    // inside a further wrapper -- `Button`'s `.btn` in particular, which is
    // the ghost rectangle this component exists to stop drawing.
    expect(html).toMatch(/class="account-trigger"[^>]*>(?:<!-- -->)?<span class="ident/)
    expect(html).not.toContain('class="btn')
  })

  it('names the trigger with the label and the address, not the chip text alone', () => {
    const html = render()
    expect(html).toContain('aria-label="Your account, ada@example.com"')
  })

  it('draws the chip small, the shape the title block has room for', () => {
    const html = render()
    expect(html).toContain('kind-chip')
    expect(html).toContain('size-sm')
  })
})
