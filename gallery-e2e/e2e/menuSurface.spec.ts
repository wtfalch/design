/**
 * `Menu`'s sheet has an actual surface, in a real browser.
 *
 * A markup assertion cannot see this: `.menu-sheet` was a real class on a
 * real element and every render test passed, because none of them looked at
 * what the browser painted. The submenu's own popover carried
 * `surface-panel border border-border rounded-md` as utilities on top of the
 * class; the top-level popover carried only the class, and `menu.css` gave
 * `.menu-sheet` nothing but a box-shadow and an animation. So the top-level
 * sheet computed a transparent background, no border and no radius, and the
 * menu's own rows sat directly on whatever was behind them -- invisible only
 * because the gallery's page background happens to be near-white.
 *
 * The fix put the surface on `.menu-sheet` itself and stopped the submenu
 * restating it, so this asserts both popovers agree rather than asserting one
 * number: the failure mode was exactly two surfaces silently drifting apart.
 */
import { expect, test } from '@playwright/test'

import { THEMES, specimenUrl, themeApplied } from './specimens'

const MESSAGE_ACTIONS = { c: 'menu', v: 'On a message' }
const GROUPED = { c: 'menu', v: 'Grouped, with a description' }

function surfaceOf(el: Element) {
  const s = getComputedStyle(el)
  return { background: s.backgroundColor, borderWidth: s.borderTopWidth, radius: s.borderRadius }
}

for (const theme of THEMES) {
  test(`the top-level menu sheet paints a real surface -- ${theme}`, async ({ page }) => {
    await page.goto(specimenUrl(MESSAGE_ACTIONS, theme))
    await themeApplied(page, theme)
    await page.getByRole('button', { name: 'Actions' }).click()

    const sheet = page.locator('.menu-sheet')
    await expect(sheet).toBeVisible()

    const surface = await sheet.evaluate(surfaceOf)
    expect(surface.background, 'background must not be transparent').not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.borderWidth, 'border must be drawn, not 0px').not.toBe('0px')
    expect(surface.radius, 'the sheet must have a real radius').not.toBe('0px')
  })
}

test('the submenu sheet paints the identical surface, not a second one', async ({ page }) => {
  const theme = 'paper'
  await page.goto(specimenUrl(GROUPED, theme))
  await themeApplied(page, theme)
  await page.getByRole('button', { name: 'Mailbox' }).click()

  const outer = page.locator('.menu-sheet').first()
  await expect(outer).toBeVisible()
  const outerSurface = await outer.evaluate(surfaceOf)

  /* `Grouped, with a description` has no submenu of its own; `On a message`
     does, through the "Move to" item -- open that one instead, in the same
     page, to compare both sheets at once. */
  await page.goto(specimenUrl(MESSAGE_ACTIONS, theme))
  await themeApplied(page, theme)
  await page.getByRole('button', { name: 'Actions' }).click()
  await page.getByText('Move to').hover()
  await expect(page.locator('.menu-sheet')).toHaveCount(2)

  const surfaces = await page.locator('.menu-sheet').evaluateAll((els) => {
    return els.map((el) => {
      const s = getComputedStyle(el)
      return {
        background: s.backgroundColor,
        borderWidth: s.borderTopWidth,
        radius: s.borderRadius,
      }
    })
  })

  expect(surfaces[1]).toEqual(surfaces[0])
  expect(outerSurface.background).toEqual(surfaces[0].background)
})
