/**
 * `context` must not let `who` get squeezed -- a real layout check.
 *
 * `shellContext.test.ts` (in `packages/design/test/`) proves the markup: the
 * right class lands on the right element in the right condition. It cannot
 * prove the *layout* claim, because `renderToStaticMarkup` never runs
 * flexbox -- a class being present is not proof it does anything to a box's
 * width. That gap is exactly how the bug this guards against shipped once
 * already: `.shell-head-context`'s `flex: 1 1 auto` gives the header row a
 * second box sized to its own content before anything shrinks, so a long
 * value can overflow the row by itself, and without a shrink guard on `who`
 * the browser shrinks it too -- clipping whatever sits at its trailing edge
 * (a live "Sign out" button, in the case this was caught in).
 *
 * So this opens the real gallery build, in a real Chromium, at the width
 * that reproduced it, and reads `who`'s own box back from the page: its
 * `scrollWidth` (what its content actually needs) must never exceed its
 * `clientWidth` (what it was laid out at). That is the one measurement a
 * shrink guard is for -- `.shell-head-context` above it is free to give up
 * width; `.shell-head-who` is not.
 */
import { type Page, expect, test } from '@playwright/test'

import { specimenUrl, themeApplied } from './specimens'

/** Replaces the stage's pinned 720px box with the real viewport, for one
 *  page -- the same override `windows.spec.ts` and `shell-side-align.spec.ts`
 *  use, for the same reason: `.spec-solo .spec-stage` is a two-class
 *  descendant selector, specificity (0,2,0), so a plain `.spec-stage`
 *  override loses the cascade silently and the box stays pinned. */
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

test.describe('Shell · With a context · the width that reproduced the clip', () => {
  // 768px = 48rem = `md`, where `Shell`'s header stops being the phone-width
  // single column the gallery's fixed 720px stage always showed and starts
  // being genuinely tight -- the same reason `shell-side-align.spec.ts` had
  // to unpin the stage to see its own bug.
  test.use({ viewport: { width: 768, height: 600 } })

  test('the who box is never shrunk below its content, and the button stays fully visible', async ({
    page,
  }) => {
    await page.goto(specimenUrl({ c: 'shell', v: 'With a context' }, 'system'))
    await themeApplied(page, 'system')
    await unpinStage(page)
    await page.evaluate(() => document.fonts.ready)

    const signOut = page.getByRole('button', { name: /sign out/i })
    await expect(signOut).toBeVisible()

    const geo = await page.evaluate(() => {
      const who = document.querySelector('.shell-head-who')
      const doc = document.documentElement
      return {
        who: who ? { clientWidth: who.clientWidth, scrollWidth: who.scrollWidth } : null,
        pageScrollWidth: doc.scrollWidth,
        pageClientWidth: doc.clientWidth,
      }
    })

    expect(geo.who, '.shell-head-who is on the page at all').not.toBeNull()
    expect(
      geo.who?.scrollWidth,
      `who's content needs ${geo.who?.scrollWidth}px but its box is only ${geo.who?.clientWidth}px -- it shrank below its content`,
    ).toBeLessThanOrEqual(geo.who?.clientWidth ?? 0)

    expect(
      geo.pageScrollWidth,
      `page scrolls ${geo.pageScrollWidth - geo.pageClientWidth}px wider than its own viewport`,
    ).toBeLessThanOrEqual(geo.pageClientWidth)

    const box = await signOut.boundingBox()
    expect(box, 'Sign out has a real box').not.toBeNull()
    if (box) {
      expect(
        box.x + box.width,
        'Sign out’s right edge stays inside the viewport rather than clipping off it',
      ).toBeLessThanOrEqual(geo.pageClientWidth)
    }
  })
})
