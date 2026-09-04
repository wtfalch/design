/**
 * The visual suite.
 *
 * Modelled on chef-monorepo's config, and different from it in the way that
 * matters: chef drives four live QA sites for *behaviour*, so it carries a
 * `globalSetup`, a `storageState`, retries and a flake budget. This drives one
 * static gallery for *pixels*, where a retry that passes is a bug being hidden
 * rather than a network settling down. So: no auth, no setup, no retries.
 *
 * ---
 *
 * **Determinism is the whole job, and fonts are the part that kills it.**
 *
 * `--font` is `-apple-system`, which resolves to SF on macOS and to whatever
 * `fontconfig` picks on a Linux runner. Baselines written on one and checked on
 * the other differ on every glyph in every image, so the suite fails everywhere
 * and tells you nothing. There are two honest ways out — ship the fonts, or fix
 * the machine — and the second is cheaper here because the token deliberately
 * names the *system* stack.
 *
 * So the images are always made inside `mcr.microsoft.com/playwright:v1.62.1-noble`,
 * on CI and on a laptop alike (`pnpm e2e:docker`). Running `pnpm e2e` on a Mac
 * against Mac-made baselines works and is useful while iterating; it is not what
 * gets committed, and `snapshotPathTemplate` keeps the two sets apart by
 * platform so a stray local run cannot overwrite the ones CI checks.
 */
import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.GALLERY_PORT ?? 5199)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  /* The suite is pure rendering: the same input must give the same image every
     time, so a retry can only ever paper over a real difference. */
  retries: 0,
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  reporter: [
    ['list'],
    // The diff PNGs live in here. A visual suite whose failures nobody can look
    // at is a suite that gets its baselines updated unread.
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  /* Baselines are keyed by platform on purpose. `linux` is the set CI writes and
     checks; a laptop run writes `darwin` beside it and neither can silently
     stand in for the other. */
  snapshotPathTemplate: '__screenshots__/{platform}/{arg}{ext}',

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      /* Both numbers were measured against this gallery, not chosen.

         `maxDiffPixelRatio` is how many pixels may differ; `threshold` is how
         different one pixel has to be before it counts. Getting either wrong
         defeats the suite silently, and both were wrong in turn:

         - `maxDiffPixelRatio: 0.002` let a 6px-to-7px radius change through on
           203 of 204 specimens. A corner is about fifteen pixels and the
           allowance on a small stage was eighty-six.
         - Then, at ratio zero, the same change still passed everywhere --
           because `threshold` defaults to 0.2, and a one-pixel radius only
           moves anti-aliased corner pixels by less than that. Nothing was
           counted as differing at all.
         - And `threshold: 0` is genuinely flaky: three runs of an unchanged
           build gave 1, 0 and 2 failures. Sub-threshold anti-aliasing jitter is
           real, so exact match is not available.

         0.02 is the measured answer: three runs of an unchanged build with no
         spurious failures, and 100 of 205 specimens failing on that same
         one-pixel radius change. Stable, and sensitive to the smallest token
         change anybody would make. */
      maxDiffPixelRatio: 0,
      threshold: 0.02,
      // CSS transitions and the indeterminate progress bar both animate; without
      // this the shot lands wherever the clock happened to be.
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  use: {
    baseURL,
    trace: 'on-first-retry',
    // A fixed window, because the specimen container is fixed and a viewport
    // that differs is a layout that differs.
    viewport: { width: 1000, height: 800 },
    deviceScaleFactor: 1,
  },

  /* The suite serves its own target, so a laptop and CI run the same thing and
     neither depends on a dev server somebody remembered to start. `dist` is the
     build, which is what actually ships -- a dev server serves unminified
     modules through an HMR client, and those are not the pixels being promised. */
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `${baseURL}/design.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
  },

  projects: [
    {
      name: 'motion',
      /* `reducedMotion` moved under `contextOptions` in Playwright 1.62 -- it is
         still a `use` option in playwright-core's types, which is why the config
         looked right and only `tsc` disagreed. */
      use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'no-preference' } },
      testIgnore: ['**/reduced-motion.spec.ts'],
    },
    {
      /* Reduced motion is a second real state, not a variation on the first:
         `tokens.css` collapses every duration to `0s` under it and cancels the
         hover and press transforms. That is a rendering the app ships and
         nothing else screenshots. */
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'reduce' } },
      testMatch: ['**/reduced-motion.spec.ts'],
    },
  ],
})
