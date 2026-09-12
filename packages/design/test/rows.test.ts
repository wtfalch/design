/**
 * `Row`'s `disabled`, pinned.
 *
 * Server-rendered, like `formControls.test.ts`: what the prop changes is an
 * attribute and a class, and the baselines cannot see the half that matters,
 * which is that the hit area is a disabled button and not a dimmed one that
 * still takes a click.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Rows, { Row } from '../src/components/Rows'

const here = dirname(fileURLToPath(import.meta.url))
const rowsCss = readFileSync(resolve(here, '../src/styles/rows.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

const render = (props: Parameters<typeof Row>[0]) =>
  renderToStaticMarkup(createElement(Rows, { look: 'pick' }, createElement(Row, props)))

describe('a disabled row', () => {
  it('disables its hit area, so a click does nothing rather than looking inert', () => {
    const html = render({ name: 'Automatically', onClick: () => {}, disabled: true })
    expect(html).toMatch(/<button[^>]*class="row-hit"[^>]*disabled=""/)
    expect(html).toContain('is-disabled')
  })

  it('keeps the chosen one showing, since a stored choice can be the inert one', () => {
    const html = render({ name: 'Automatically', onClick: () => {}, disabled: true, picked: true })
    expect(html).toContain('is-picked')
    expect(html).toContain('is-disabled')
  })

  it('is not waiting, which is the word it replaces for this case', () => {
    const html = render({ name: 'Automatically', onClick: () => {}, disabled: true })
    expect(html).not.toContain('is-waiting')
  })

  it('leaves an ordinary row alone', () => {
    const html = render({ name: 'When I say so', onClick: () => {} })
    expect(html).not.toContain('disabled')
  })

  it('is dimmed wherever a waiting row is', () => {
    expect(rowsCss).toMatch(
      /\.rows-row\.is-waiting,\s*\.rows-pick > \.rows-row\.is-disabled \{ opacity/,
    )
  })

  it('does not light up on hover, and neither does a waiting one', () => {
    // Every hover rule on a row keys on an enabled hit. One that says only
    // `.row-hit` lit a waiting row under its own not-allowed cursor.
    const hovers = rowsCss.match(/[^{}]*:hover[^{]*\{/g) ?? []
    expect(hovers.length).toBeGreaterThan(0)
    for (const rule of hovers) {
      if (rule.includes('row-hit')) expect(rule).toContain('row-hit:enabled')
    }
  })
})
