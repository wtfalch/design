/**
 * The committed work list, against the live one.
 *
 * `manifest.json` is committed so that adding or removing a variant shows up as
 * a line in a pull request. The cost of writing a work list down is that it can
 * go stale, and a stale one fails in the direction nobody notices: a variant
 * added to `specimens.tsx` and not to the manifest is simply never
 * photographed, and every test that does run still passes.
 *
 * So the file is held to the page. This is the only test here that talks to the
 * gallery's index rather than to a specimen.
 */
import { expect, test } from '@playwright/test'

import committed from './manifest.json' with { type: 'json' }
import { specimens } from './specimens'

test('the committed manifest matches what the gallery renders', async ({ page }) => {
  const live = await specimens(page)

  const key = (s: { c: string; v: string }) => `${s.c} · ${s.v}`
  const liveKeys = live.map(key).sort()
  const committedKeys = committed.map(key).sort()

  const missing = liveKeys.filter((k) => !committedKeys.includes(k))
  const stale = committedKeys.filter((k) => !liveKeys.includes(k))

  expect(
    missing,
    'these specimens exist and are photographed by nothing. ' +
      'Run `node scripts/manifest.mjs` and commit the result',
  ).toEqual([])

  expect(
    stale,
    'these are in the manifest and no longer in the gallery. ' +
      'Run `node scripts/manifest.mjs`, and delete their baselines',
  ).toEqual([])
})
