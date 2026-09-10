/**
 * The windows, open.
 *
 * `visual.spec.ts` photographs each specimen's stage, and a modal is portalled
 * out of it -- so for `Modal` and `Dialog` the suite had a picture of the
 * button that opens one and no picture of the window. Two regressions lived
 * there unphotographed: React Aria's `Heading` put an `<h2>` with the browser's
 * own margins around every title (the head grew from 41px to 86px), and the
 * split filed `.dialog` ahead of `.modal` in the cascade, so every dialog
 * opened 760 wide instead of 440. Both were found by a person opening one.
 *
 * These open the window and photograph the whole viewport, then measure the two
 * things a screenshot cannot explain: the head is the height it was laid out
 * for, and a dialog is dialog-sized.
 */
import { expect, test } from '@playwright/test'

import { THEMES, specimenUrl, themeApplied } from './specimens'

const WINDOWS = [
  { c: 'modal', v: 'Default', trigger: /open a window/i, width: null },
  { c: 'dialog', v: 'Default', trigger: /ask something/i, width: 440 },
] as const

for (const w of WINDOWS) {
  for (const theme of THEMES) {
    test(`${w.c} · open · ${theme}`, async ({ page }) => {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
      await page.goto(specimenUrl({ c: w.c, v: w.v }, theme))
      await themeApplied(page, theme)
      await page.getByRole('button', { name: w.trigger }).click()

      const box = page.locator('.modal')
      await expect(box).toBeVisible()
      await page.evaluate(() => document.fonts.ready)

      const geo = await page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)?.getBoundingClientRect()
        return {
          head: r('.modal-head')?.height ?? 0,
          modal: r('.modal')?.width,
          /* The heading's line box, not the glyph's: a 14px title on a 1.5
             line-height is a 21px row. */
          title: r('.modal-title')?.height ?? 0,
          cross: r('.modal-head > .x')?.height ?? 0,
        }
      })
      /* 12px over and 8px under the tallest thing in the row -- one line of
         `--text-base`, or the 24px close cross when there is one. 86 is what
         an `<h2>`'s default margins made it; 54 is what the picker's 34px tile
         made it when the cross lost its own rule to the split. */
      const tallest = Math.max(geo.title, geo.cross)
      expect(
        Math.abs(geo.head - (tallest + 20)),
        `head ${geo.head} for a ${tallest}px row plus 20 of padding`,
      ).toBeLessThanOrEqual(1)
      if (w.width) expect(geo.modal, 'a dialog is dialog-sized').toBe(w.width)

      await expect(page).toHaveScreenshot(`windows--${w.c}--${theme}.png`)
    })
  }
}

/**
 * One region, however many hosts.
 *
 * `ToastHost` nesting is what lets a package -- `@wtfalch/email`'s mail
 * client -- wrap itself without giving an application that already has a host
 * two regions announcing into the same page. Two regions is not a thing a
 * screenshot shows: the second is empty until something is pushed, and then
 * the same message appears twice in two places. So it is counted.
 */
test('a nested ToastHost renders through to one region', async ({ page }) => {
  await page.goto(specimenUrl({ c: 'toast', v: 'Nested hosts' }, 'system'))
  await page.getByRole('button', { name: /^good$/i }).click()

  await expect(page.locator('.toast')).toHaveCount(1)
  await expect(page.locator('.toasts')).toHaveCount(1)
})
