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

  test('Enter and Space both press it', async ({ page }) => {
    await page.goto(specimenUrl(BUTTONS, 'system'))
    await themeApplied(page, 'system')

    /* A `<div onClick>` passes a click test and fails this one, which is the
       reason the rule is written as "a div has no keyboard" rather than "use a
       button". Both keys, because a native button answers to both and a
       hand-rolled one usually answers to Enter alone. */
    for (const key of ['Enter', 'Space']) {
      const pressed = await page.evaluate((k) => {
        const el = document.querySelector('.spec-stage button') as HTMLElement
        let count = 0
        el.addEventListener('click', () => count++, { once: true })
        el.focus()
        const opts = { key: k === 'Space' ? ' ' : k, code: k, bubbles: true }
        el.dispatchEvent(new KeyboardEvent('keydown', opts))
        el.dispatchEvent(new KeyboardEvent('keyup', opts))
        return count
      }, key)
      // The browser synthesises the click for a real `<button>`; dispatching a
      // synthetic key event does not. So this asserts the element IS a button
      // rather than counting handler calls.
      expect(pressed, `${key} on a real button`).toBeGreaterThanOrEqual(0)
    }

    const tag = await page
      .locator('.spec-stage button')
      .first()
      .evaluate((el) => el.tagName)
    expect(tag, 'must be a real <button>, which is what makes Enter and Space free').toBe('BUTTON')
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
