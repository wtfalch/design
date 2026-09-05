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

test.describe('Modal', () => {
  const open = async (page: import('@playwright/test').Page) => {
    await page.goto(specimenUrl({ c: 'modal', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    const trigger = page.getByRole('button', { name: 'Open a window' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    return trigger
  }

  test('is a dialog to a screen reader, named by its title', async ({ page }) => {
    await open(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog, 'named by its heading').toHaveAccessibleName('Model settings')
  })

  test('focus moves in, and is kept in', async ({ page }) => {
    await open(page)
    const inside = () =>
      page.evaluate(() =>
        document.querySelector('[role="dialog"]')?.contains(document.activeElement),
      )
    expect(await inside(), 'focus lands inside on open').toBe(true)

    /* Tab past the last button and you are on the page behind it, operating
       controls under the scrim you cannot see. No mouse ever finds that, which
       is why all eight hand-built modals shipped without a trap. */
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await inside(), `focus escaped the dialog on Tab ${i + 1}`).toBe(true)
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab')
      expect(await inside(), `focus escaped the dialog on Shift+Tab ${i + 1}`).toBe(true)
    }
  })

  test('Escape closes it, and focus goes back where it came from', async ({ page }) => {
    const trigger = await open(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    /* Not to the top of the document, which makes a keyboard user start the
       page again. */
    await expect(trigger).toBeFocused()
  })

  test('the ✕ closes it', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('the scrim closes a workspace', async ({ page }) => {
    await open(page)
    // Top-left corner of the viewport is scrim, never box.
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('Dialog', () => {
  test('the scrim decides nothing', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'dialog', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    await page.getByRole('button', { name: 'Ask something' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    /* For "may this applet write to your files", a click that lands on the
       scrim by accident would be an answer. Escape still works here because
       this dialog has a safe default (`onCancel`); one without has no Escape
       either. */
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog'), 'still open after a scrim click').toBeVisible()
    /* A press on the scrim of a non-dismissable dialog is handled by React
       Aria pulling focus back inside -- asynchronously. Escape is read by the
       dialog, so it has to be sent once focus is back there, and "focus is
       inside" is the condition to wait on rather than a sleep. */
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.querySelector('[role="dialog"]')?.contains(document.activeElement),
        ),
      )
      .toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('has no ✕ — the answers are the buttons', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'dialog', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    await page.getByRole('button', { name: 'Ask something' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Close' })).toHaveCount(0)
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Allow' })).toBeVisible()
  })
})

test.describe('Tabs', () => {
  /* Not migrated, and that is a decision: the strip already implements the
     WAI-ARIA tabs pattern exactly -- `tablist`, `role="tab"`, `aria-selected`,
     one tab stop with the arrows moving inside it, Home and End, selection
     following focus. React Aria's `Tabs` would add nothing here and would
     insist on owning `TabPanel`s the strip deliberately does not. These tests
     are what make "already correct" a claim rather than an impression. */
  const tabs = (page: import('@playwright/test').Page) => page.getByRole('tab')

  test('one tab stop for the whole strip, on the selected tab', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'tabs', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await expect(tabs(page).filter({ hasText: 'Model' })).toBeFocused()
    // A second Tab leaves the strip entirely rather than visiting the next tab.
    await page.keyboard.press('Tab')
    await expect(page.locator('[role="tab"]:focus')).toHaveCount(0)
  })

  test('the arrows move selection and focus together, and skip a disabled tab', async ({
    page,
  }) => {
    await page.goto(specimenUrl({ c: 'tabs', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')

    await page.keyboard.press('ArrowRight')
    const perms = tabs(page).filter({ hasText: 'Permissions' })
    await expect(perms).toBeFocused()
    await expect(perms).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(tabs(page).filter({ hasText: 'Memories' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    /* "Discarded" is disabled. The next arrow wraps past it to "Model" rather
       than landing on a tab that cannot be chosen. */
    await page.keyboard.press('ArrowRight')
    await expect(tabs(page).filter({ hasText: 'Model' })).toHaveAttribute('aria-selected', 'true')
    await expect(tabs(page).filter({ hasText: 'Discarded' })).toBeDisabled()
  })

  test('Home and End', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'tabs', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await page.keyboard.press('End')
    // End lands on the last *enabled* tab.
    await expect(tabs(page).filter({ hasText: 'Memories' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await page.keyboard.press('Home')
    await expect(tabs(page).filter({ hasText: 'Model' })).toHaveAttribute('aria-selected', 'true')
  })

  test('a vertical rail walks with Up and Down, and the group headings are not tabs', async ({
    page,
  }) => {
    await page.goto(specimenUrl({ c: 'tabs', v: 'Vertical, grouped' }, 'system'))
    await themeApplied(page, 'system')
    await expect(tabs(page), 'two headings, four tabs').toHaveCount(4)
    await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')

    await page.keyboard.press('Tab')
    await expect(tabs(page).filter({ hasText: 'Assistant' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(tabs(page).filter({ hasText: 'Speech' })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowDown')
    // Across the heading into the next group, without stopping on it.
    await expect(tabs(page).filter({ hasText: 'Files' })).toBeFocused()
  })
})

test.describe('Progress', () => {
  /* Not migrated: the bar is already a correct `progressbar`, and the part
     worth holding is the one that is easy to get wrong -- an indeterminate bar
     carries no `aria-valuenow`, because "nought per cent" and "unknown" are
     different statements and the second is the true one. React Aria's
     `ProgressBar` says the same thing with a different DOM; there is nothing
     to gain and a structure to lose. */
  test('a determinate bar states its value, its range and its text', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'progress', v: 'Determinate' }, 'system'))
    await themeApplied(page, 'system')
    const bar = page.getByRole('progressbar', { name: 'ollama-darwin.tgz' })
    await expect(bar).toHaveAttribute('aria-valuenow', '62')
    await expect(bar).toHaveAttribute('aria-valuemin', '0')
    await expect(bar).toHaveAttribute('aria-valuemax', '100')
    await expect(bar).toHaveAttribute('aria-valuetext', '412 MB of 660 MB')
    const width = await bar.locator('i').evaluate((el) => (el as HTMLElement).style.width)
    expect(width, 'the fill tracks the value').toBe('62%')
  })

  test('an indeterminate bar carries no value at all', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'progress', v: 'Indeterminate' }, 'system'))
    await themeApplied(page, 'system')
    const bar = page.getByRole('progressbar', { name: 'Fetching' })
    await expect(bar).not.toHaveAttribute('aria-valuenow', /.*/)
    await expect(bar).toHaveAttribute('aria-valuetext', 'contacting GitHub…')
    const anim = await bar.locator('i').evaluate((el) => getComputedStyle(el).animationName)
    expect(anim, 'it moves, so it is not the same picture as stalled').not.toBe('none')
  })
})

test.describe('Slider', () => {
  /* Not migrated. It is a native `<input type="range">` laid over a drawn
     track, and the platform already supplies the whole pattern: the `slider`
     role, arrows by `step`, Home and End, touch, the announced value. What the
     component adds on top -- `aria-valuetext` and a visible `<output>` from
     `format`, a ring on the box -- is what these hold. React Aria's `Slider`
     rebuilds all of it on divs, and would take the drawing with it. */
  const STEPPED = { c: 'slider', v: 'Stepped, continuous, disabled' }

  test('Tab reaches the first slider, and the ring is on the box', async ({ page }) => {
    await page.goto(specimenUrl(STEPPED, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    const slider = page.getByRole('slider').first()
    await expect(slider).toBeFocused()
    const ring = await page.evaluate(() => {
      const box = document.activeElement?.closest('.slider-box')
      return box ? getComputedStyle(box).outlineWidth : null
    })
    expect(ring, 'the box paints the ring; the input inside is invisible').toBe('2px')
  })

  test("the arrows move by step, and the value is said in the caller's words", async ({ page }) => {
    await page.goto(specimenUrl(STEPPED, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    const slider = page.getByRole('slider').first()
    await expect(slider).toHaveAttribute('aria-valuetext', '12.0 GB')

    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveValue('12.5')
    await expect(slider, 'the announced value follows format()').toHaveAttribute(
      'aria-valuetext',
      '12.5 GB',
    )
    await expect(page.locator('output').first(), 'and so does the visible one').toHaveText(
      '12.5 GB',
    )

    await page.keyboard.press('End')
    await expect(slider).toHaveValue('19.5')
    await page.keyboard.press('Home')
    await expect(slider).toHaveValue('2')
  })

  test('a disabled slider is skipped by Tab', async ({ page }) => {
    await page.goto(specimenUrl(STEPPED, 'system'))
    await themeApplied(page, 'system')
    await expect(page.getByRole('slider')).toHaveCount(4)
    await expect(page.locator('input[type="range"]:disabled')).toHaveCount(1)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const onDisabled = await page.evaluate(
        () => (document.activeElement as HTMLInputElement | null)?.disabled === true,
      )
      expect(onDisabled, `Tab ${i + 1} must not land on the disabled slider`).toBe(false)
    }
  })
})

test.describe('Select', () => {
  const DEFAULT = { c: 'select', v: 'Default' }

  test('is a combobox that opens a listbox', async ({ page }) => {
    await page.goto(specimenUrl(DEFAULT, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    const control = page.locator('.sel-control')
    await expect(control).toBeFocused()
    await expect(control).toHaveAttribute('aria-haspopup', 'listbox')
    await expect(control).toHaveAttribute('aria-expanded', 'false')
    /* React Aria names the button as the value and the label together --
       "qwen3:4b — thinks, tools Model" -- which is what a native select is
       announced as, and what the first version of this test wrongly expected
       to be the label alone. The label must be in it; the value is allowed. */
    await expect(control).toHaveAccessibleName(/Model/)

    await page.keyboard.press('ArrowDown')
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    await expect(list.getByRole('option')).toHaveCount(3)
    await expect(control).toHaveAttribute('aria-expanded', 'true')
    /* The chosen row is marked, and it is where the list opens. */
    await expect(list.getByRole('option', { selected: true })).toHaveText(
      'qwen3:4b — thinks, tools',
    )
  })

  test('the arrows and Enter choose, and the choice reaches onChange', async ({ page }) => {
    await page.goto(specimenUrl(DEFAULT, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    /* `SelectDemo` holds the value in state and hands it back through
       `onChange({target: {value}})` -- the native-select-shaped seam every
       call site was written against. The visible value is the proof it fired. */
    await expect(page.locator('.sel-value')).toHaveText('qwen2.5vl:3b — reads images')
    await expect(page.locator('.sel-control'), 'focus returns to the control').toBeFocused()
  })

  test('Escape closes it without choosing', async ({ page }) => {
    await page.goto(specimenUrl(DEFAULT, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await expect(page.locator('.sel-value'), 'the value is unchanged').toHaveText(
      'qwen3:4b — thinks, tools',
    )
    await expect(page.locator('.sel-control')).toBeFocused()
  })

  test('typing jumps to the option that starts with it', async ({ page }) => {
    await page.goto(specimenUrl(DEFAULT, 'system'))
    await themeApplied(page, 'system')
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.type('s')
    await expect(page.getByRole('option', { name: /^sd15/ })).toBeFocused()
  })

  test('a disabled select is not a tab stop', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'select', v: 'Disabled' }, 'system'))
    await themeApplied(page, 'system')
    await expect(page.locator('.sel-control')).toBeDisabled()
    await page.keyboard.press('Tab')
    await expect(page.locator('.sel-control')).not.toBeFocused()
  })
})

test.describe('Toast', () => {
  const TONES = { c: 'toast', v: 'Tones' }

  test('a toast is announced, without being focused', async ({ page }) => {
    await page.goto(specimenUrl(TONES, 'system'))
    await themeApplied(page, 'system')
    const info = page.getByRole('button', { name: 'Info' })
    await info.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.toast')).toBeVisible()
    /* Measured before it was assumed: React Aria's region is a landmark, not
       a live region, and after a push there was no `aria-live` in the document
       at all. The mirror is what reads it out. */
    await expect(page.locator('[aria-live="polite"]')).toContainText('Settings saved')
    await expect(info, 'the trigger keeps focus; a toast is not a dialog to fill in').toBeFocused()
  })

  test('a failure is assertive; the rest are polite', async ({ page }) => {
    await page.goto(specimenUrl(TONES, 'system'))
    await themeApplied(page, 'system')
    await page.getByRole('button', { name: 'Bad' }).click()
    await expect(page.locator('[aria-live="assertive"]')).toContainText('The download failed')
    await expect(page.locator('[aria-live="polite"]')).not.toContainText('The download failed')
  })

  test('Dismiss puts focus back where it was', async ({ page }) => {
    await page.goto(specimenUrl(TONES, 'system'))
    await themeApplied(page, 'system')
    const good = page.getByRole('button', { name: 'Good' })
    await good.click()
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible()
    await toast.getByRole('button', { name: 'Dismiss' }).click()
    await expect(toast).toHaveCount(0)
    /* Not to the body, which is where a removed element leaves focus by
       default and from where a keyboard user starts the page again. */
    await expect(good).toBeFocused()
  })

  test('it lives in a landmark a screen reader can reach', async ({ page }) => {
    await page.goto(specimenUrl(TONES, 'system'))
    await themeApplied(page, 'system')
    await page.getByRole('button', { name: 'Info' }).click()
    await expect(page.getByRole('region', { name: /notification/ })).toBeVisible()
  })
})

test.describe('Rows and Table', () => {
  test('a list of rows has a name, and a clickable row is a real button', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'rows', v: 'Clickable' }, 'system'))
    await themeApplied(page, 'system')
    await expect(page.getByRole('list')).toHaveCount(1)
    /* "A <div onClick> has no keyboard." Row's onClick renders a <button>
       for exactly this reason, so Tab reaches it and Enter presses it. */
    await page.keyboard.press('Tab')
    const hit = page.locator('.row-hit').first()
    await expect(hit).toBeFocused()
    expect(await hit.evaluate((el) => el.tagName)).toBe('BUTTON')
  })

  test('a table is a real table, read across as well as down', async ({ page }) => {
    await page.goto(specimenUrl({ c: 'table', v: 'Default' }, 'system'))
    await themeApplied(page, 'system')
    const table = page.getByRole('table')
    await expect(table).toHaveCount(1)
    await expect(table.locator('caption'), 'named by its caption').toHaveCount(1)
    await expect(table.locator('thead th[scope="col"]').first()).toBeVisible()
    /* The first cell of a row is its name, so it is a header for the row --
       what lets a screen reader say "pillow, version, 11.1.0" rather than a
       bare "11.1.0" with no idea whose it is. */
    await expect(table.locator('tbody th[scope="row"]').first()).toBeVisible()
  })
})

test.describe('Input', () => {
  const PASSWORD = { c: 'input', v: 'Password' }

  test('the eye on a password reveals it, and announces as a toggle', async ({ page }) => {
    await page.goto(specimenUrl(PASSWORD, 'system'))
    await themeApplied(page, 'system')
    const input = page.locator('.secret input').first()
    const eye = page.locator('.secret .secret-eye').first()

    await expect(input).toHaveAttribute('type', 'password')
    await expect(eye).toHaveAttribute('aria-pressed', 'false')
    await expect(eye).toHaveAccessibleName('Show password')

    /* Tab from the box lands on its eye: the toggle is in the tab order right
       after the thing it toggles, not at the end of the form. */
    await input.focus()
    await page.keyboard.press('Tab')
    await expect(eye).toBeFocused()

    await page.keyboard.press('Space')
    await expect(input).toHaveAttribute('type', 'text')
    await expect(eye).toHaveAttribute('aria-pressed', 'true')
    /* The label does not flip. A toggle that reads "Hide password, pressed"
       says the same thing twice, one of them backwards. */
    await expect(eye).toHaveAccessibleName('Show password')
    /* Switching `type` must not remount the box and lose what was in it. */
    await expect(input).toHaveValue('tf_live_8f3a9c2e1b7d')

    await page.keyboard.press('Space')
    await expect(input).toHaveAttribute('type', 'password')
  })

  test('the eye sits inside the box, at every size', async ({ page }) => {
    await page.goto(specimenUrl(PASSWORD, 'system'))
    await themeApplied(page, 'system')
    const boxes = await page.locator('.secret').evaluateAll((els) =>
      els.map((el) => {
        const input = el.querySelector('input')?.getBoundingClientRect()
        const eye = el.querySelector('.secret-eye')?.getBoundingClientRect()
        if (!input || !eye)
          return { size: el.className, inside: false, centred: false, fits: false }
        return {
          size: el.className,
          inside: eye.right < input.right && eye.left > input.left,
          centred: Math.abs(eye.top + eye.height / 2 - (input.top + input.height / 2)) <= 1,
          fits: eye.height <= input.height,
        }
      }),
    )
    expect(boxes.length).toBeGreaterThanOrEqual(4)
    for (const b of boxes) {
      expect(b.inside, `${b.size}: the eye is not inside the box`).toBe(true)
      expect(b.centred, `${b.size}: the eye is off the box's centre line`).toBe(true)
      expect(b.fits, `${b.size}: the eye is taller than the box`).toBe(true)
    }
  })

  test('a disabled password has a disabled eye', async ({ page }) => {
    await page.goto(specimenUrl(PASSWORD, 'system'))
    await themeApplied(page, 'system')
    await expect(page.locator('.secret .secret-eye').last()).toBeDisabled()
  })
})

test.describe('Toggle · pointer', () => {
  const TOGGLE = { c: 'toggle', v: 'Default' }
  /* The first row, "Enabled", starts on. */
  const track = (page: import('@playwright/test').Page) =>
    page.locator('.switch-row').first().locator('.toggle')
  /* The input's `checked` property. React Aria writes no `aria-checked` on a
     native checkbox -- the property is the state, and a screen reader reads it
     as one. */
  const state = (page: import('@playwright/test').Page) =>
    page.locator('.switch-row').first().locator('[role=switch]').isChecked()

  async function drag(
    page: import('@playwright/test').Page,
    fromX: number,
    toX: number,
    back = false,
  ) {
    const box = (await track(page).boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 }
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + fromX, y)
    await page.mouse.down()
    await page.mouse.move(box.x + toX, y, { steps: 6 })
    if (back) await page.mouse.move(box.x + fromX, y, { steps: 6 })
    await page.mouse.up()
  }

  test('the knob drags across, and a drag toggles exactly once', async ({ page }) => {
    await page.goto(specimenUrl(TOGGLE, 'system'))
    await themeApplied(page, 'system')
    expect(await state(page)).toBe(true)
    await drag(page, 24, 4)
    expect(await state(page), 'dragged left: off').toBe(false)
    await drag(page, 4, 24)
    expect(await state(page), 'dragged right: on again').toBe(true)
    /* Once, not twice: a drag must not also fire the label's own click. If it
       did, the state would flip and flip back and read unchanged here -- so
       check the intermediate too. */
    await drag(page, 24, 4)
    expect(await state(page)).toBe(false)
  })

  test('a drag that ends where it began changes nothing', async ({ page }) => {
    await page.goto(specimenUrl(TOGGLE, 'system'))
    await themeApplied(page, 'system')
    await drag(page, 24, 4, true)
    expect(await state(page)).toBe(true)
  })

  test('a click with a few pixels of hand jitter is a tap, not a drag', async ({ page }) => {
    await page.goto(specimenUrl(TOGGLE, 'system'))
    await themeApplied(page, 'system')
    const box = (await track(page).boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 }
    const y = box.y + box.height / 2
    /* Down on the knob, drift 4px sideways and 3px down the way a hand does,
       release. Under the old 3px slop this was a drag that settled by side and
       changed nothing; it is a press, and it toggles. */
    await page.mouse.move(box.x + 24, y)
    await page.mouse.down()
    await page.mouse.move(box.x + 20, y + 3, { steps: 2 })
    await page.mouse.up()
    expect(await state(page), 'toggled off by a jittery click').toBe(false)
    expect(await track(page).getAttribute('data-dragging')).toBeNull()
  })

  test('a tap on the knob is still a tap', async ({ page }) => {
    await page.goto(specimenUrl(TOGGLE, 'system'))
    await themeApplied(page, 'system')
    await track(page).click()
    expect(await state(page), 'one tap: off').toBe(false)
    await track(page).click()
    expect(await state(page), 'two taps: on').toBe(true)
  })

  test('the knob follows the pointer while held', async ({ page }) => {
    await page.goto(specimenUrl(TOGGLE, 'system'))
    await themeApplied(page, 'system')
    const box = (await track(page).boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 }
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + 24, y)
    await page.mouse.down()
    await page.mouse.move(box.x + 14, y, { steps: 4 })
    const mid = await track(page).evaluate((el) => ({
      dragging: el.hasAttribute('data-dragging'),
      x: Number(el.style.getPropertyValue('--knob-x')),
    }))
    expect(mid.dragging).toBe(true)
    expect(mid.x).toBeGreaterThan(0)
    expect(mid.x).toBeLessThan(1)
    await page.mouse.up()
    expect(await track(page).getAttribute('data-dragging')).toBeNull()
  })
})

test.describe('Toggle · async', () => {
  const ASYNC = { c: 'toggle', v: 'Async' }
  const row = (page: import('@playwright/test').Page, n: number) =>
    page.locator('.switch-row').nth(n)
  const on = (page: import('@playwright/test').Page, n: number) =>
    row(page, n).locator('[role=switch]').isChecked()

  test('a resolving handler moves the knob at once, is busy until it settles, then holds', async ({
    page,
  }) => {
    await page.clock.install()
    await page.goto(specimenUrl(ASYNC, 'system'))
    await themeApplied(page, 'system')
    expect(await on(page, 0)).toBe(false)

    await row(page, 0).click()
    expect(await on(page, 0), 'moved before the request landed').toBe(true)
    await expect(row(page, 0)).toHaveAttribute('data-pending', 'true')
    await expect(row(page, 0).locator('[role=switch]')).toHaveAttribute('aria-busy', 'true')
    await expect(row(page, 0).locator('.toggle-sweep')).toHaveCount(1)

    /* A second press while busy is refused: the state does not flip back. */
    await row(page, 0).click()
    expect(await on(page, 0)).toBe(true)

    await page.clock.runFor(1300)
    await expect(row(page, 0)).not.toHaveAttribute('data-pending', 'true')
    await expect(row(page, 0).locator('.toggle-sweep')).toHaveCount(0)
    expect(await on(page, 0), 'held after the request landed').toBe(true)
  })

  test('a rejecting handler puts the knob back', async ({ page }) => {
    await page.clock.install()
    await page.goto(specimenUrl(ASYNC, 'system'))
    await themeApplied(page, 'system')
    expect(await on(page, 1)).toBe(true)

    await row(page, 1).click()
    expect(await on(page, 1), 'moved before the request was refused').toBe(false)
    await expect(row(page, 1)).toHaveAttribute('data-pending', 'true')

    await page.clock.runFor(1300)
    expect(await on(page, 1), 'back where it was').toBe(true)
    await expect(row(page, 1)).not.toHaveAttribute('data-pending', 'true')
  })

  test('the knob travels on the spring over --dur-fast, with the track', async ({ page }) => {
    await page.goto(specimenUrl(ASYNC, 'system'))
    await themeApplied(page, 'system')
    const t = await row(page, 0)
      .locator('.toggle')
      .evaluate((el) => {
        const s = getComputedStyle(el, '::after')
        return { duration: s.transitionDuration, easing: s.transitionTimingFunction }
      })
    expect(t.duration).toBe('0.12s')
    expect(t.easing.startsWith('linear(')).toBe(true)
  })
})
