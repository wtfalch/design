/**
 * The row's height is a floor, not a ceiling.
 *
 * `.side-list-link` shipped with `height: calc(var(--space-1) * 7)` -- a
 * fixed 28px. A `SideList.Item` or `SideList.Tool` label long enough to wrap,
 * or a theme's reduced `--density` (which scales `--space-1` but not the
 * font, so even a single line of `--text-sm` can exceed a reduced 28px on
 * its own), pushed content past that fixed box with no `overflow` rule to
 * catch it: the text spilled out and visibly overlapped the rows above and
 * below, and the row's own icon and caret. `css.test.ts`'s regex assertions
 * and `sideListTool.test.ts`'s `renderToStaticMarkup` checks both stayed
 * green through this, because neither one lays anything out -- text overflow
 * is a layout fact, invisible to a string of markup or a value of
 * `getComputedStyle` under jsdom (which does no layout at all). Only a real
 * browser, actually wrapping actual text against the actual built CSS,
 * shows it, which is why this file drives Chromium through Playwright
 * rather than mounting under `@vitest-environment jsdom` like
 * `useMediaQuery.test.ts` does.
 *
 * The fix is `min-height` in place of `height` (see `sidelist.css`'s own
 * docblock on `.side-list-link`): a single-line label still gets exactly
 * 28px, because `display: flex` + `align-items: center` on an `auto`-height
 * box with nothing taller inside it still resolves to the `min-height`
 * floor. A label that wraps, or a line that is simply taller than a reduced
 * density's floor, grows the box instead: no `white-space: nowrap`, no
 * `text-overflow: ellipsis` -- the chosen behaviour for a long name is to
 * push its own row taller and its neighbours down the column, not to hide
 * part of it. `scrollHeight <= clientHeight` is the general assertion for
 * "nothing this element contains is being clipped or spilling past its own
 * box" -- it holds whether the row grew to fit or the content already fit
 * the floor.
 *
 * Reads `dist/tokens.css` and `dist/styles/index.css` -- the actual shipped
 * cascade, `--density` included -- rather than the source files under `src`,
 * the same reasoning `css.test.ts`'s "built bundle" check already uses:
 * skipped, not failed, when `pnpm build` has not run first, exactly like
 * that file's own bundle check.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(here, '../dist')
const builtCss = resolve(distDir, 'styles/index.css')
const built = existsSync(builtCss)

/** A name nobody chose to keep short -- long enough that it wraps inside a
 *  256px rail at `--text-sm`, which is the case that overflowed before. */
const longLabel =
  'A destination whose name is long enough that it wraps onto more than one line inside the rail'

type Row = { tag: string; clientHeight: number; scrollHeight: number }

/** Renders `html` inside the real, built stylesheet in a real Chromium page,
 *  and reads back every `.side-list-link`'s box vs. its content. `extraCss`
 *  is how the density case overrides `--density` without touching the
 *  package's own tokens. */
async function measureRows(html: string, extraCss = ''): Promise<Row[]> {
  const tokens = readFileSync(resolve(distDir, 'tokens.css'), 'utf8')
  const styles = readFileSync(builtCss, 'utf8')
  const page = `<!doctype html>
<html>
<head><meta charset="utf-8"><style>${tokens}\n${styles}\n${extraCss}</style></head>
<body style="margin:0"><div style="width:256px">${html}</div></body>
</html>`

  const browser = await chromium.launch()
  try {
    const p = await browser.newPage({ viewport: { width: 400, height: 400 } })
    await p.setContent(page)
    return await p.evaluate(() =>
      Array.from(document.querySelectorAll('.side-list-link')).map((el) => ({
        tag: el.tagName,
        clientHeight: (el as HTMLElement).clientHeight,
        scrollHeight: (el as HTMLElement).scrollHeight,
      })),
    )
  } finally {
    await browser.close()
  }
}

describe.skipIf(!built)('the row height is a floor, not a ceiling (measured in Chromium)', () => {
  it('a single-line label still gets exactly the 28px row', async () => {
    const html = renderToStaticMarkup(
      h(
        'div',
        { className: 'side-list-item' },
        h('a', { href: '#x', className: 'side-list-link' }, 'Settings'),
      ),
    )
    const [row] = await measureRows(html)
    expect(row.clientHeight).toBe(28)
    expect(row.scrollHeight).toBeLessThanOrEqual(row.clientHeight)
  })

  it('a long label on a plain SideList.Item grows the row instead of overflowing it', async () => {
    const html = renderToStaticMarkup(
      h(
        'div',
        { className: 'side-list-item' },
        h('a', { href: '#x', className: 'side-list-link' }, longLabel),
      ),
    )
    const [row] = await measureRows(html)
    expect(row.scrollHeight).toBeLessThanOrEqual(row.clientHeight)
    // It actually wrapped -- otherwise this proves nothing about growth.
    expect(row.clientHeight).toBeGreaterThan(28)
  })

  it('a long label on a SideList.Tool trigger grows the row instead of overflowing it', async () => {
    const html = renderToStaticMarkup(
      h(
        'div',
        { className: 'side-list-item' },
        h(
          'button',
          {
            type: 'button',
            className: 'side-list-link side-list-tool-trigger',
            'aria-expanded': 'false',
          },
          longLabel,
        ),
      ),
    )
    const [row] = await measureRows(html)
    expect(row.scrollHeight).toBeLessThanOrEqual(row.clientHeight)
    expect(row.clientHeight).toBeGreaterThan(28)
  })

  /** `--density` scales `--space-1` (`tokens.css`) but never the font, so a
   *  product identity that sets a reduced density can put a single-line
   *  `--text-sm` label past a `height`-based floor on its own -- reachable,
   *  not hypothetical, since a real theme already sets `--density`. */
  it('holds at a reduced --density, where space shrinks but text does not', async () => {
    const html = renderToStaticMarkup(
      h(
        'div',
        { className: 'side-list-item' },
        h('a', { href: '#x', className: 'side-list-link' }, 'Settings'),
      ),
    )
    const [row] = await measureRows(html, ':root { --density: 0.6; }')
    expect(row.scrollHeight).toBeLessThanOrEqual(row.clientHeight)
  })
})
