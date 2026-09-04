/**
 * Operating the components without a mouse.
 *
 * The third suite, and the one that checks the thing screenshots cannot: a
 * control can look perfect in 204 images and be unreachable. Every rule here is
 * one the design system already states in prose and nothing enforced.
 *
 * chef-monorepo's `focusRings.spec.ts` is the model, and the part worth copying
 * is what it asserts: the **computed** focus ring, not the presence of a class.
 * A class says a rule was intended; `getComputedStyle` says the ring is on the
 * screen. Those came apart once already here — `--focus-ring` was
 * `--accent-dim`, so the marker on the focused control was fainter than the
 * control, and every class was exactly where it should be.
 *
 * This grows one component at a time alongside the React Aria migration. A
 * component with no test here has not been migrated yet.
 */
import { expect, test } from '@playwright/test'

import { specimenUrl, themeApplied } from './specimens'

const BUTTONS = { c: 'button', v: 'Kinds' }

test.describe('Button', () => {
  test('every kind is reachable by Tab, in order', async ({ page }) => {
    await page.goto(specimenUrl(BUTTONS, 'system'))
    await themeApplied(page, 'system')

    const labels = ['Default', 'Primary', 'Ghost', 'Danger']
    for (const label of labels) {
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toHaveText(label)
    }
  })

  test('a focused button paints a ring that is actually on the screen', async ({ page }) => {
    await page.goto(specimenUrl(BUTTONS, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')

    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const s = getComputedStyle(el)
      return { outline: s.outlineWidth, shadow: s.boxShadow }
    })

    /* Either mechanism counts -- `--focus-ring` is a box-shadow and some
       controls use a real outline. What does not count is neither. */
    const painted = ring.outline !== '0px' || (ring.shadow !== 'none' && ring.shadow !== '')
    expect(painted, `focused button painted no ring: ${JSON.stringify(ring)}`).toBe(true)
  })

  test('Enter and Space both activate it', async ({ page }) => {
    /* Activation is asserted through what the button *does* -- the dialog
       specimen's trigger opens a dialog -- rather than by counting `click`
       events on it.
       Counting clicks was the first attempt and it was testing the wrong
       thing: React Aria raises `onPress`, and whether a native `click` also
       fires turned out to vary with browser-context options. That made the test
       a measurement of Playwright's configuration rather than of the component.
       What a person needs is that pressing the key does the thing. */
    for (const key of ['Enter', 'Space']) {
      await page.goto(specimenUrl({ c: 'dialog', v: 'Default' }, 'system'))
      await themeApplied(page, 'system')

      const trigger = page.getByRole('button', { name: 'Ask something' })
      await trigger.focus()
      await page.keyboard.press(key)

      await expect(page.getByRole('dialog'), `${key} did not activate the button`).toBeVisible()
    }
  })

  test('defaults to type="button", so it cannot submit a form it is dropped into', async ({
    page,
  }) => {
    await page.goto(specimenUrl(BUTTONS, 'system'))
    await themeApplied(page, 'system')

    /* The reason the component exists rather than a class. A `<button>` with no
       type is `type="submit"`: fifty-eight of them here were found by a linter
       rather than by a person, which is what a default is for. */
    const types = await page
      .locator('.spec-stage button')
      .evaluateAll((els) => els.map((el) => (el as HTMLButtonElement).type))
    expect(types.length).toBeGreaterThan(0)
    expect(new Set(types), 'every button defaults to type="button"').toEqual(new Set(['button']))
  })

  test('a disabled button is skipped by Tab', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'button', v: 'Disabled' }, 'system'))
    await themeApplied(page, 'system')

    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    // Nothing in the stage is focusable, so focus stays on the body rather than
    // landing on a control nobody can operate.
    expect(focused).not.toBe('BUTTON')
  })
})

test.describe('Toggle', () => {
  const SIZES = { c: 'toggle', v: 'Sizes' }

  test('Tab reaches the switch and Space flips it', async ({ page }) => {
    /* `Default` renders `ToggleDemo`, which holds state. `Sizes` is three
       switches with `checked` and a no-op `onChange` -- a picture of a switch,
       which is right for a screenshot and cannot flip. */
    await page.goto(specimenUrl({ c: 'toggle', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')

    await page.keyboard.press('Tab')
    const first = page.getByRole('switch').first()
    await expect(first, 'the first switch takes focus').toBeFocused()
    const was = await first.isChecked()

    /* `role="switch"` is the docblock's core promise -- announced as on/off
       rather than checked/unchecked, the only signal a non-visual reader gets
       that it applies as it moves. React Aria keeps it. */
    await page.keyboard.press('Space')
    await expect(first, 'Space flips it').toBeChecked({ checked: !was })
    await page.keyboard.press('Space')
    await expect(first, 'Space flips it back').toBeChecked({ checked: was })
  })

  test('the focus ring is painted on the track, not the hidden input', async ({ page }) => {
    await page.goto(specimenUrl(SIZES, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')

    /* The input is one pixel square and off in a corner; a ring on it is a
       ring nobody sees. The row carries `data-focus-visible`, and the track
       reads it. */
    const ring = await page.evaluate(() => {
      const track = document.querySelector('.switch-row[data-focus-visible] .toggle')
      if (!track) return null
      const s = getComputedStyle(track)
      return { outline: s.outlineWidth, shadow: s.boxShadow }
    })
    expect(ring, 'the focused row must carry data-focus-visible').not.toBeNull()
    expect(ring?.outline !== '0px' || (ring?.shadow && ring.shadow !== 'none')).toBe(true)
  })
})

test.describe('Checkbox', () => {
  const PARTS = { c: 'checkbox', v: 'The parts' }

  test('Tab reaches each box in order and Space toggles it', async ({ page }) => {
    /* `A set` renders `CheckboxDemo`, which holds state; `The parts` is
       controlled with a no-op and cannot change. */
    await page.goto(specimenUrl({ c: 'checkbox', v: 'A set' }, 'system'))
    await themeApplied(page, 'system')

    await page.keyboard.press('Tab')
    const first = page.getByRole('checkbox').first()
    await expect(first).toBeFocused()
    const was = await first.isChecked()
    await page.keyboard.press('Space')
    await expect(first, 'Space toggles it').toBeChecked({ checked: !was })

    await page.keyboard.press('Tab')
    await expect(page.getByRole('checkbox').nth(1), 'Tab moves to the next box').toBeFocused()
  })

  test('a disabled box is skipped, and its row says so', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')

    const boxes = page.getByRole('checkbox')
    await expect(boxes).toHaveCount(4)
    await expect(boxes.nth(3), 'the fourth is disabled').toBeDisabled()

    // Three Tabs land on the three enabled boxes; a fourth leaves the stage.
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab')
    await expect(boxes.nth(2)).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(boxes.nth(3), 'Tab must not land on a disabled box').not.toBeFocused()

    const rowSaysSo = await page.locator('.choice[data-disabled]').count()
    expect(rowSaysSo, 'the disabled row carries data-disabled for the stylesheet').toBe(1)
  })

  test('the focus ring lands on the row, which is what is actually focused', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')

    const shadow = await page.evaluate(() => {
      const row = document.querySelector('.choice[data-focus-visible]')
      return row ? getComputedStyle(row).boxShadow : null
    })
    expect(shadow, 'the focused row must carry data-focus-visible').not.toBeNull()
    expect(shadow, 'the row paints --focus-ring').not.toBe('none')
  })
})

test.describe('Tooltip', () => {
  const TIP = { c: 'tooltip', v: 'Default' }

  test('Tab focuses the mark, the tip opens, and it is wired by aria-describedby', async ({
    page,
  }) => {
    await page.goto(specimenUrl(TIP, 'system'))
    await themeApplied(page, 'system')

    /* The old component was `role="note"` with a `tabIndex`: focusable, and
       announced as its label and nothing else, because a note is not
       interactive and the tip's text was never associated with anything. This
       is the measurement of the fix. */
    await expect(page.getByRole('tooltip'), 'closed at rest').toHaveCount(0)

    await page.keyboard.press('Tab')
    const tip = page.getByRole('tooltip')
    await expect(tip, 'focus opens it').toBeVisible()
    await expect(tip).toContainText('Reasoning is generated separately')

    const wired = await page.evaluate(() => {
      const trigger = document.activeElement as HTMLElement
      const id = trigger.getAttribute('aria-describedby')
      const tip = document.querySelector('[role="tooltip"]')
      return { id, tipId: tip?.id, tag: trigger.tagName }
    })
    expect(wired.tag, 'the mark stays a span — a button inside a label row would toggle it').toBe(
      'SPAN',
    )
    expect(wired.id, 'the trigger must be described by the tip').toBe(wired.tipId)
  })

  test('Escape closes it', async ({ page }) => {
    await page.goto(specimenUrl(TIP, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('tooltip')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
  })

  test('hovering the mark opens it too', async ({ page }) => {
    await page.goto(specimenUrl(TIP, 'system'))
    await themeApplied(page, 'system')

    /* Moved to, not teleported. `locator.hover()` lands the pointer in one
       jump and React Aria's hover intent never opened the tip; the same mark
       opened within 100ms when the mouse *travelled* there in steps. That is
       hover intent doing its job -- a tip that opens for a pointer passing
       through is the thing it exists to prevent -- so the test moves like a
       hand does. */
    const box = await page.locator('.explain').boundingBox()
    if (!box) throw new Error('no mark to hover')
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx - 60, cy + 40)
    await page.mouse.move(cx, cy, { steps: 8 })
    await expect(page.getByRole('tooltip')).toBeVisible()
  })
})

test.describe('Field', () => {
  const PARTS = { c: 'input', v: 'The parts' }

  test('the label is an element, and clicking it focuses the input', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')

    /* "A label is an element, not a placeholder" -- the placeholder disappears
       the moment somebody types. A real `<label for>` is what makes clicking
       the words land in the box, and what a screen reader announces. */
    await page.getByText('Plain', { exact: true }).click()
    await expect(page.getByLabel('Plain', { exact: true })).toBeFocused()
  })

  test('the description and the error are wired with aria-describedby', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')

    const described = page.getByLabel('With a description')
    const hintId = await described.getAttribute('aria-describedby')
    expect(hintId, 'a described field names its hint').toBeTruthy()
    await expect(page.locator(`#${hintId}`)).toHaveText('What to put in it, or what it will do.')

    /* An error is wired to its field, and it is an alert: it appears in
       response to something the reader just did, usually while they are
       looking at the button and not the field. Red is the third signal. */
    const bad = page.getByLabel('In error')
    await expect(bad).toHaveAttribute('aria-invalid', 'true')
    const errId = (await bad.getAttribute('aria-describedby')) ?? ''
    const alert = page.locator(`#${errId.split(' ').pop()}`)
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toHaveText('Something is wrong with this one.')
  })

  test('a hidden label is still a label', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')
    // Announced, not drawn: the accessible name survives `labelHidden`.
    await expect(page.getByLabel('Hidden label')).toHaveAttribute('placeholder', 'Search…')
  })

  test('Tab walks the inputs in order', async ({ page }) => {
    await page.goto(specimenUrl(PARTS, 'system'))
    await themeApplied(page, 'system')
    /* `Required` is labelled "Required *" -- the asterisk is inside the label
       with its own `aria-label`, so the accessible name is not the bare word.
       A prefix match is the honest one here; `exact` was hiding that the name
       includes the requirement, which is the point of the asterisk having a
       name at all. */
    for (const name of [/^Plain$/, /^With a description$/, /^Required/]) {
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(name)).toBeFocused()
    }
  })
})
