/**
 * The three named size steps, pinned against the numbers they stand for.
 *
 * `sm` / `md` / `lg` are 14 / 16 / 20 -- the sizes this package's own call
 * sites already drew at before they had names. The default stays the bare
 * number 18 so that a caller who passes no size, and every one who already
 * wrote `size={18}`, keeps the icon it had. Server-rendered, like
 * `formControls.test.ts`, because what is worth pinning is the `width` and
 * `height` attributes React Aria's markup carries, not any interaction.
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Icon from '../src/components/Icon'

function dims(html: string) {
  const width = /width="(\d+)"/.exec(html)?.[1]
  const height = /height="(\d+)"/.exec(html)?.[1]
  return { width, height }
}

describe('Icon size', () => {
  it('sm is 14', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'settings', size: 'sm' }))
    expect(dims(html)).toEqual({ width: '14', height: '14' })
  })

  it('md is 16', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'settings', size: 'md' }))
    expect(dims(html)).toEqual({ width: '16', height: '16' })
  })

  it('lg is 20', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'settings', size: 'lg' }))
    expect(dims(html)).toEqual({ width: '20', height: '20' })
  })

  it('a number still passes straight through', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'settings', size: 28 }))
    expect(dims(html)).toEqual({ width: '28', height: '28' })
  })

  /** The default predates the steps and none of the three lands on it --
   *  naming it would move every icon that relies on it. */
  it('defaults to 18 when no size is given', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'settings' }))
    expect(dims(html)).toEqual({ width: '18', height: '18' })
  })
})
