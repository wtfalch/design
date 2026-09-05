import { describe, expect, it } from 'vitest'
import { SYSTEM_ICONS, checkArt } from '../src/art'
import { tfArt } from '../src/art/tf'

/**
 * The pack rules, held against the pack every product starts from, and
 * against a pack that breaks each of them, so the sentences a product would
 * read are the ones this test read first.
 */
describe('the art pack', () => {
  it("holds tf's art to its own rules", () => {
    expect(checkArt(tfArt)).toEqual([])
  })

  it('carries every icon the package draws for itself', () => {
    for (const name of SYSTEM_ICONS) expect(tfArt.icons[name], name).toBeTruthy()
  })

  it('says what is wrong with a pack, one sentence each', () => {
    const problems = checkArt({
      icons: { close: { view: '0 0 20 10', d: [] } },
      illustrations: { one: '<svg width="20"><path fill="#000"/></svg>' },
      marks: { x: { view: '0 0', d: '', stroke: 0 } },
    })
    expect(problems).toEqual([
      'icons: no "info", which the package\'s own components draw',
      'icons: no "check", which the package\'s own components draw',
      'icons: no "warning", which the package\'s own components draw',
      'icons: no "error", which the package\'s own components draw',
      'icons: no "eye", which the package\'s own components draw',
      'icons: no "eye-off", which the package\'s own components draw',
      'icons: close: icons are square, so the view must be',
      'icons: close: has no path',
      'illustrations: one: has no viewBox',
      'illustrations: one: has a hard-coded width',
      'illustrations: one: has a baked hex colour',
      'illustrations: one: has no ink',
      'marks: x: view is not "x y w h"',
      'marks: x: has no path',
      'marks: x: has no stroke weight',
    ])
  })
})
