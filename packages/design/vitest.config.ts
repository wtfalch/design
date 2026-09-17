import { defineConfig } from 'vitest/config'

/**
 * One test file at a time.
 *
 * `fileParallelism: false` costs wall-clock and buys a gate that means
 * something. Two files here are not ordinary unit tests: `dist.test.ts`
 * spawns plain Node and measures that the built package loads, and
 * `sideListRowHeight.test.ts` drives a real Chromium to measure a row. Run
 * concurrently, the browser starves the Node one -- `dist.test.ts` passes in
 * 3.5s alone and times out at 30s beside it, which reads as "the built
 * package stopped loading" and is nothing of the kind.
 *
 * A suite that fails on how busy the machine is trains everyone to re-run it,
 * and a gate people re-run until it is green is not a gate. The measurements
 * these two files make are the reason the suite catches layout regressions a
 * markup assertion cannot see, so the answer is to run them honestly rather
 * than to widen a timeout until the flake hides.
 */
export default defineConfig({
  test: { include: ['test/**/*.test.ts'], fileParallelism: false },
})
