/**
 * axe, per specimen.
 *
 * Two scans, because the two kinds of finding have different shapes:
 *
 * **Structure runs once per specimen**, in one theme. Whether a switch has a
 * name, whether an error is wired to its field, whether a `div` was given a
 * click and no keyboard — none of that changes when the palette does, so
 * running it three times would treble the cost of the suite to learn the same
 * thing.
 *
 * **Contrast runs in every theme**, because it is the one class of failure that
 * is a property of the palette rather than of the markup. A `running` pill sat
 * at 1.67:1 on Paper for weeks while looking perfectly correct on every dark
 * theme anyone tested, and the light theme never overrode the status colours at
 * all. A single-theme scan is exactly the scan that missed it.
 *
 * The scan is scoped to `.spec-stage` — the component, not the page it is
 * standing on. Page-level rules (`region`, `page-has-heading-one`,
 * `html-has-lang`) are facts about the gallery scaffold, and a component library
 * that fails them is being blamed for its harness.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import known from './a11y-known.json' with { type: 'json' }
import manifest from './manifest.json' with { type: 'json' }
import { THEMES, specimenUrl, stillPage, themeApplied } from './specimens'

/** The tags worth failing on. `wcag2a`/`wcag2aa` are the legal floor;
 *  `best-practice` is opinion and is left out, because a suite that mixes a
 *  missing label with a preference about heading order gets skimmed. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

type Known = Record<string, string[]>

/** Violations that exist today, per specimen, recorded so that the suite is
 *  green on arrival and any NEW violation is red.
 *
 *  This is a to-do list with a test attached, not an excuse: phase 5 empties it
 *  one component at a time, and `a11y-known.json` shrinking is the measure of
 *  that phase. Recording them beats starting red, because a suite that has
 *  always been red is one nobody reads. */
const KNOWN = known as Known

function key(c: string, v: string, theme?: string) {
  return theme ? `${c} · ${v} · ${theme}` : `${c} · ${v}`
}

for (const specimen of manifest) {
  test(`a11y · ${specimen.c} · ${specimen.v}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.goto(specimenUrl(specimen, 'system'))
    await expect(page.locator('.spec-stage')).toBeVisible()
    await themeApplied(page, 'system')
    await stillPage(page)

    const results = await new AxeBuilder({ page })
      .include('.spec-stage')
      .withTags(TAGS)
      // Contrast is the other test's job, in every theme rather than this one.
      .disableRules(['color-contrast'])
      .analyze()

    const ids = [...new Set(results.violations.map((v) => v.id))].sort()
    const allowed = KNOWN[key(specimen.c, specimen.v)] ?? []
    const fresh = ids.filter((id) => !allowed.includes(id))
    const fixed = allowed.filter((id) => !ids.includes(id))

    expect(fresh, `new accessibility violations in ${specimen.c} / ${specimen.v}`).toEqual([])
    /* And the other direction. A recorded violation that no longer happens is a
       line in the to-do list that has quietly become a lie, and leaving it there
       means the next real one can hide behind it. */
    expect(fixed, 'these are recorded as known and no longer occur — remove them').toEqual([])
  })
}

for (const specimen of manifest) {
  for (const theme of THEMES) {
    test(`contrast · ${specimen.c} · ${specimen.v} · ${theme}`, async ({ page }) => {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
      await page.goto(specimenUrl(specimen, theme))
      await expect(page.locator('.spec-stage')).toBeVisible()
      await themeApplied(page, theme)
      await stillPage(page)

      const results = await new AxeBuilder({ page })
        .include('.spec-stage')
        .withRules(['color-contrast'])
        .analyze()

      const nodes = results.violations.flatMap((v) =>
        v.nodes.map((n) => n.failureSummary?.split('\n')[1]?.trim() ?? n.html.slice(0, 80)),
      )
      const allowed = KNOWN[key(specimen.c, specimen.v, theme)] ?? []
      // Contrast findings are recorded by count rather than by id: the rule id
      // is always `color-contrast`, so the only thing that distinguishes a new
      // failure from a known one is how many there are.
      expect(
        nodes.length,
        `contrast failures in ${specimen.c} / ${specimen.v} on ${theme}:\n${nodes.join('\n')}`,
      ).toBeLessThanOrEqual(allowed.length)
    })
  }
}
