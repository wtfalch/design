/**
 * Two pixel rules that used to live in tf's `pillTones.test.ts`, moved with
 * the CSS they govern on 2026-09-05. Each is here because it shipped wrong
 * once and was invisible until measured.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const sheet = (name: string) => readFileSync(resolve(here, '../src/styles', name), 'utf8')

describe('the stylesheet, measured', () => {
  it('draws the tick at a size that divides evenly into its ring', () => {
    /* A mask cannot land on half a pixel. `background-position: center` in a
       box whose spare room is odd gets snapped, and Chrome rounds one axis up
       and the other down -- which put the choice row's tick half a pixel right
       and half a pixel high inside a ring that was otherwise exactly
       concentric. The box is 16px, so the glyph has to be even. */
    const css = sheet('checkbox.css')
    const box = css.match(
      /\.choice::after,\s*\.choice\[data-selected\]::before \{[^}]*?width: (\d+)px/s,
    )
    const glyph = css.match(/mask: var\(--tick-mask\) center \/ (\d+)px/)
    expect(box, 'the ring box').toBeTruthy()
    expect(glyph, 'the tick mask').toBeTruthy()
    const spare = Number(box?.[1]) - Number(glyph?.[1])
    expect(
      spare % 2,
      `${box?.[1]}px ring and a ${glyph?.[1]}px tick leaves ${spare / 2}px a side`,
    ).toBe(0)
  })

  it('resets box-sizing on pseudo-elements too', () => {
    /* `*` does not match pseudo-elements and `box-sizing` is not inherited, so
       a reset that stops at `*` leaves every `::before` and `::after`
       content-box. That is invisible until one of them has a border, at which
       point it is two pixels wider than the sibling it is supposed to sit
       concentric with. */
    expect(sheet('base.css')).toMatch(/\*,\s*\*::before,\s*\*::after \{\s*box-sizing: border-box;/)
  })
})
