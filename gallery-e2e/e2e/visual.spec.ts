/**
 * Every specimen, in every theme, as an image.
 *
 * 68 specimens across 25 components, three themes each: 204 baselines. They are
 * taken **before** any React Aria lands, so each migration afterwards arrives as
 * a diff against the component it replaced. A baseline written during a
 * migration is a picture of the migrated component compared to itself, which
 * proves it renders and nothing else — and rendering was never the question.
 *
 * One test per image rather than a loop inside one test, so the report names the
 * component, the variant and the theme that moved, and so a failure in Paper
 * does not stop the other two from being checked.
 */
import { expect, test } from '@playwright/test'

import manifest from './manifest.json' with { type: 'json' }
import { THEMES, slug, specimenUrl, themeApplied } from './specimens'

for (const specimen of manifest) {
  for (const theme of THEMES) {
    test(`${specimen.c} · ${specimen.v} · ${theme}`, async ({ page }) => {
      /* Freeze the clock before anything mounts.
         `animations: 'disabled'` settles CSS, and settles nothing driven by a
         timer. `Callout`'s Timed variant counts five seconds down with a bar
         whose width is a function of the wall clock, so its baseline was a
         photograph of how long the page took to load that day -- deterministic
         enough to be written and never to be matched again. It failed on every
         run against an unchanged build, which is the most expensive kind of
         failure: one nobody can attribute to a change. */
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
      await page.goto(specimenUrl(specimen, theme))
      await page.clock.pauseAt(new Date('2026-01-01T00:00:02Z'))

      const stage = page.locator('.spec-stage')
      await expect(stage).toBeVisible()
      await themeApplied(page, theme)

      /* A specimen the gallery could not find renders a red box rather than
         nothing, because an empty page photographs perfectly well and its
         baseline would pass forever. Fail on the marker instead of quietly
         adopting a picture of the failure. */
      await expect(
        page.locator('[data-missing]'),
        `no specimen "${specimen.v}" on component "${specimen.c}"`,
      ).toHaveCount(0)

      /* Web fonts are not in play -- the type stack is the system one -- but
         `document.fonts.ready` also settles the first layout pass, and shooting
         before it lands gives a baseline of text at its fallback metrics. */
      await page.evaluate(() => document.fonts.ready)

      await expect(stage).toHaveScreenshot(`${slug(specimen.c)}--${slug(specimen.v)}--${theme}.png`)
    })
  }
}
