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

/**
 * The wiring reaches the control without a render prop.
 *
 * `Field`'s children used to have to be a function, which made every page
 * with a form a client component. Plain children read the wiring from
 * context instead -- and "read it" is the part a screenshot cannot show, so
 * the attributes are measured.
 *
 * `aria-invalid` on `Select` is measured for a second reason: React Aria's
 * `Button` filters every aria prop that is not a labelling one, so passing
 * it typechecks and does nothing. It is set through a ref, like `title` and
 * like `Button`'s `aria-busy` before it.
 */
test('Field wires plain children through context', async ({ page }) => {
  await page.goto(specimenUrl({ c: 'input', v: 'Plain children' }, 'system'))

  const wiring = await page.evaluate(() => {
    const read = (el: Element | null) => ({
      id: el?.getAttribute('id') ?? null,
      describedby: el?.getAttribute('aria-describedby') ?? null,
      invalid: el?.getAttribute('aria-invalid') ?? null,
      labelledby: el?.getAttribute('aria-labelledby') ?? null,
    })
    const labelFor = (id: string | null) =>
      id ? (document.querySelector(`label[for="${id}"]`)?.textContent ?? null) : null
    const input = read(document.querySelector('input[name="instance"]'))
    const select = read(document.querySelector('.sel-control'))
    const textarea = read(document.querySelector('textarea[name="notes"]'))
    return {
      input,
      select,
      textarea,
      inputLabel: labelFor(input.id),
      /* A token list, not one id: React Aria puts the value span first and
         appends what we passed, so the label is one of several. */
      selectLabelText: (select.labelledby ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .map((ref) => document.getElementById(ref)?.textContent ?? '')
        .join(' '),
      hintText: input.describedby
        ? (document.getElementById(input.describedby)?.textContent ?? null)
        : null,
    }
  })

  // Every control got an id, and the label points at it.
  expect(wiring.input.id).toBeTruthy()
  expect(wiring.inputLabel).toContain('Instance name')
  expect(wiring.hintText).toContain('Lowercase')

  // A Select is a <button>, so `htmlFor` cannot name it: it takes the label's
  // id instead, which is what removes the repeated aria-label.
  expect(wiring.select.id).toBeTruthy()
  expect(wiring.selectLabelText).toContain('Region')

  // The error field is marked invalid and describes itself.
  expect(wiring.textarea.invalid).toBe('true')
  expect(wiring.textarea.describedby).toBeTruthy()
})

/**
 * Tailwind's theme namespace collides with the vocabulary, and unlayered wins.
 *
 * Tailwind v4 names its font-size scale `--text-*` and its radius scale
 * `--radius-*`, which are the names this package's tokens already have. So
 * `@theme { --text-sm: var(--text-sm) }` compiles to a self-referential
 * custom property on `:root` -- invalid, and if it won it would take every
 * font size and every corner in the package with it.
 *
 * It does not win: `tokens.css` is unlayered and Tailwind's block is in
 * `@layer theme`, and an unlayered declaration beats a layered one whatever
 * the order. That is the whole reason the collision is survivable, it is not
 * obvious from either file, and it would break silently -- text would fall
 * back to the browser default everywhere at once -- if anyone ever moved
 * `tokens.css` into a layer. So it is measured.
 */
test('the vocabulary survives Tailwind’s theme namespace', async ({ page }) => {
  await page.goto(specimenUrl({ c: 'button', v: 'Kinds' }, 'system'))

  const resolved = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    const probe = document.createElement('div')
    document.body.append(probe)
    probe.style.fontSize = 'var(--text-sm)'
    probe.style.borderRadius = 'var(--radius-md)'
    const p = getComputedStyle(probe)
    const out = {
      textSm: cs.getPropertyValue('--text-sm').trim(),
      radiusMd: cs.getPropertyValue('--radius-md').trim(),
      usedFontSize: p.fontSize,
      usedRadius: p.borderRadius,
    }
    probe.remove()
    return out
  })

  // The token still holds a real value, not an empty self-reference.
  expect(resolved.textSm).not.toBe('')
  expect(resolved.radiusMd).not.toBe('')

  // And a real length, not the fallback a guaranteed-invalid property leaves.
  expect(resolved.usedRadius).toBe('8px')

  /* The negative control, so the assertions above are known to detect the
     thing they are written for: a self-referential custom property -- which
     is exactly what `@theme { --text-sm: var(--text-sm) }` compiles to --
     resolves to nothing, and `border-radius` falls back to 0. Without this
     the test would pass just as happily against a page where the collision
     had won. */
  const broken = await page.evaluate(() => {
    const el = document.createElement('div')
    el.style.setProperty('--radius-md', 'var(--radius-md)')
    el.style.borderRadius = 'var(--radius-md)'
    document.body.append(el)
    const out = {
      declared: getComputedStyle(el).getPropertyValue('--radius-md').trim(),
      used: getComputedStyle(el).borderRadius,
    }
    el.remove()
    return out
  })
  expect(broken.declared).toBe('')
  expect(broken.used).toBe('0px')
})

/**
 * A toast, open.
 *
 * `visual.spec.ts` photographs the buttons that push one, never the toast --
 * it is transient, and the region is empty when the stage is shot. So its
 * dismiss control had no baseline at all, which is how it went from
 * `className="ghost size-sm"` (borrowed from `Button`, and matching only
 * while `.ghost` was written against the `button` element) to a filled tile
 * without anything noticing. Same reason `modal` and `dialog` are opened
 * here: a thing nobody photographs is a thing that regresses in silence.
 */
for (const theme of THEMES) {
  test(`toast · open · ${theme}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.goto(specimenUrl({ c: 'toast', v: 'Tones' }, theme))
    await themeApplied(page, theme)
    await page.getByRole('button', { name: /^good$/i }).click()

    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()
    await expect(toast.getByRole('button', { name: 'Dismiss' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.toasts')).toHaveScreenshot(`toast--open--${theme}.png`)
  })
}

/**
 * The select's list, open.
 *
 * Portalled to the body, so `visual.spec.ts` photographs the closed control
 * and never the part the component exists for -- the list is the whole
 * reason this is not a native `<select>`. That is the second surface found
 * without a baseline, after the toast: both are things that only exist while
 * open, and the stage is shot closed.
 */
for (const theme of THEMES) {
  test(`select · open · ${theme}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.goto(specimenUrl({ c: 'select', v: 'Default' }, theme))
    await themeApplied(page, theme)
    await page.locator('.sel-control').first().click()

    const list = page.locator('.sel-list')
    await expect(list).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(list).toHaveScreenshot(`select--open--${theme}.png`)
  })
}
