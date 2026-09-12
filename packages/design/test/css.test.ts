/**
 * Two pixel rules that used to live in tf's `pillTones.test.ts`, moved with
 * the CSS they govern on 2026-09-05. Each is here because it shipped wrong
 * once and was invisible until measured.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

/**
 * Every sheet closes every brace it opens, in the source and in what ships.
 *
 * 0.9.0 shipped `select.css` with one unmatched `}`: a regex had stopped at a
 * `}` inside a comment and left the rest of a rule dangling as text. Browsers
 * skip what they cannot parse, so nothing failed and nothing looked obviously
 * wrong -- what it cost was `.sel-list`'s `box-shadow`, and it took a release
 * to notice. tf lost two hundred lines of its own stylesheet the same way a
 * few days later, from a merge rather than a regex.
 *
 * The built bundle is checked as well as the source, because the flatten is
 * its own opportunity: an unbalanced sheet swallows every sheet concatenated
 * after it, which is how one bad rule became a release.
 */
describe('the stylesheet, parsed', () => {
  // a brace inside a comment is prose, not structure
  const bare = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
  const count = (css: string, ch: string) => (css.match(new RegExp(`\\${ch}`, 'g')) ?? []).length

  const dir = resolve(here, '../src/styles')
  const sheets = readdirSync(dir).filter((f) => f.endsWith('.css'))

  it('has sheets to check', () => {
    expect(sheets.length).toBeGreaterThan(10)
  })

  for (const name of sheets) {
    it(`${name} is brace-balanced`, () => {
      const css = bare(readFileSync(resolve(dir, name), 'utf8'))
      expect(count(css, '}')).toBe(count(css, '{'))
    })
  }

  it('the built bundle is brace-balanced', () => {
    const built = resolve(here, '../dist/styles/index.css')
    if (!existsSync(built)) return // `pnpm build` has not run; `dist.test.ts` owns that complaint
    const css = bare(readFileSync(built, 'utf8'))
    expect(count(css, '}')).toBe(count(css, '{'))
  })
})
