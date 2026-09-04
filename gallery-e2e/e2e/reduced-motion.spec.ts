/**
 * The rule that outranks every theme.
 *
 * `tokens.css` collapses the durations to `0s` under
 * `prefers-reduced-motion: reduce`, and cancels the hover lift, the hover scale
 * and the press shrink with them. That is stated as part of the vocabulary's
 * contract — a theme may set the durations, it may not decide whether they
 * apply — and the package test checks the *stylesheet* says so.
 *
 * This checks the *browser agrees*, which is a different claim. A media query
 * that never matches, a token overridden later in the cascade, or a theme
 * applied inline on `documentElement` (which beats a stylesheet rule, and is
 * exactly how `applyTheme` works) would each leave the file correct and the
 * page still moving.
 *
 * Only the tokens are asserted, not screenshots. Motion is not visible in a
 * still frame, so a baseline would photograph the resting state and pass
 * whatever the durations said.
 */
import { expect, test } from '@playwright/test'

const COLLAPSED = ['--dur-fast', '--dur-md', '--dur-slow', '--dur-drag']
const NEUTRAL: Record<string, string> = {
  '--hover-lift': '0px',
  '--hover-scale': '1',
  '--press-scale': '1',
}

/* Every theme, because `applyTheme` writes the theme's tokens as inline styles
   on the root element -- and an inline style beats a stylesheet rule at the
   same specificity. A theme that set a duration would win over the media query
   unless the media query is the one place durations are decided. */
for (const theme of ['system', 'night', 'paper']) {
  test(`motion collapses under prefers-reduced-motion · ${theme}`, async ({ page }) => {
    await page.goto(`/design.html?c=toggle&v=Sizes&theme=${theme}&chrome=0`)
    await expect(page.locator('.spec-stage')).toBeVisible()

    const values = await page.evaluate(
      (keys) => {
        const style = getComputedStyle(document.documentElement)
        return Object.fromEntries(keys.map((k) => [k, style.getPropertyValue(k).trim()]))
      },
      [...COLLAPSED, ...Object.keys(NEUTRAL)],
    )

    for (const key of COLLAPSED) {
      expect(values[key], `${key} must be 0s under reduced motion`).toBe('0s')
    }
    for (const [key, want] of Object.entries(NEUTRAL)) {
      expect(values[key], `${key} must be neutral under reduced motion`).toBe(want)
    }
  })
}
