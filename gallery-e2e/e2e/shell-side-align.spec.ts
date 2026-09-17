/**
 * The header band lines up with the docked rail, at a width the stage cannot show.
 *
 * `visual.spec.ts` photographs every specimen inside `.spec-stage`, pinned to
 * 720px so a screenshot stays a promise about a rendering nobody's viewport
 * moves -- see `gallery.css`'s own comment on `.spec-solo .spec-stage`. That
 * is exactly why the bug this guards against never showed up there: `Shell`'s
 * header band centres itself independently of the rail, but only past
 * `--shell-measure`'s 1024px does centring pull it away from the rail's own
 * left edge -- at 720px the band still runs edge to edge and the two happen
 * to land close together. The defect was real only at a real 1440px window,
 * which nothing in this suite ever opened.
 *
 * So these tests strip the stage's fixed width for themselves alone --
 * `.spec-stage` becomes the actual viewport, the way an app's own root sees
 * `Shell` -- rather than standing up a second harness. `gallery.css`'s
 * solo-stage sizing is otherwise untouched, including its own narrow-viewport
 * bug (`gallery.css:287`, already logged): that bug is about the stage not
 * shrinking on its own, which is moot once these tests override its width
 * outright.
 */
import { type Page, expect, test } from '@playwright/test'

import { THEMES, specimenUrl, themeApplied } from './specimens'

/** Replaces the stage's pinned 720px box with the real viewport, for one page.
 *
 *  `gallery.css` pins it with `.spec-solo .spec-stage` -- a two-class
 *  descendant selector, specificity (0,2,0) -- so a plain `.spec-stage`
 *  override, (0,1,0), loses the cascade silently: it injects, and the box
 *  stays 720px regardless. Matching the selector shape is what makes this
 *  override real. */
async function unpinStage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      .spec-solo.spec-solo { padding: 0; }
      .spec-solo .spec-stage {
        width: 100vw;
        max-width: none;
        padding: 0;
        background: none;
        border-radius: 0;
      }
    `,
  })
}

/** The visible `brand`, whichever of `Shell`'s two header copies is showing --
 *  the other is `display: none` at this breakpoint and reports a zero rect.
 *
 *  `.side-list-switcher`'s own bounding box starts at the rail's left edge,
 *  x=0 -- its padding is *inside* that box, the way any padded box's is --
 *  so the content edge this is checking against is the box left plus its own
 *  `padding-left`, not the box left on its own. */
function geometry() {
  const brand = [...document.querySelectorAll('header strong')].find(
    (el) => el.getBoundingClientRect().width > 0,
  )
  const rail = document.querySelector('.side-list-switcher')
  const railContentLeft = rail
    ? rail.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(rail).paddingLeft)
    : null
  return {
    brandLeft: brand?.getBoundingClientRect().left ?? null,
    railContentLeft,
  }
}

test.describe('Shell + SideList · rail docked, 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const theme of THEMES) {
    test(`brand's left edge meets the rail's content edge · ${theme}`, async ({ page }) => {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
      await page.goto(specimenUrl({ c: 'sidelist', v: 'Default' }, theme))
      await themeApplied(page, theme)
      await unpinStage(page)
      await page.evaluate(() => document.fonts.ready)

      const geo = await page.evaluate(geometry)
      expect(geo.railContentLeft, 'the rail is docked at this width').not.toBeNull()
      expect(
        geo.brandLeft,
        `brand at ${geo.brandLeft}, rail content at ${geo.railContentLeft}`,
      ).toBe(geo.railContentLeft)

      await expect(page).toHaveScreenshot(`shell-side-align--1440--${theme}.png`)
    })
  }
})

test.describe('Shell + SideList · below the rail breakpoint, 390', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  for (const theme of THEMES) {
    test(`the rail is not docked, and the header is the one-band markup · ${theme}`, async ({
      page,
    }) => {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
      await page.goto(specimenUrl({ c: 'sidelist', v: 'Default' }, theme))
      await themeApplied(page, theme)
      await unpinStage(page)
      await page.evaluate(() => document.fonts.ready)

      // Below `md` there is no docked column to align against --
      // `SideList.Trigger` in `who` is the only way to the rail's contents --
      // so the header falls back to the one band a `Shell` with no `side`
      // renders, and `brand` sits inside it rather than in a column of its own.
      await expect(page.locator('.side-list-rail')).toBeHidden()
      const geo = await page.evaluate(geometry)
      expect(geo.brandLeft, 'brand renders inside the one-band mobile header').not.toBeNull()

      await expect(page).toHaveScreenshot(`shell-side-align--390--${theme}.png`)
    })
  }
})
