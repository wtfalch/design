/**
 * Write each product's themes out as CSS beside the compiled module.
 *
 * Runs after `tsc`, and reads the compiled product modules and the compiled
 * `css.ts` rather than the sources: Node cannot import a `.ts` file, and each
 * of those carries only `import type` lines, which compile to nothing, so
 * they load in plain Node where `dist/themes/index.js` (which imports its
 * siblings without extensions) does not.
 *
 *   node scripts/build-themes.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '../dist/themes')
const { productCss } = await import(resolve(dist, 'css.js'))

const PRODUCTS = {
  tf: 'TF_THEMES',
  valet: 'VALET_THEMES',
}

for (const [product, exportName] of Object.entries(PRODUCTS)) {
  const mod = await import(resolve(dist, `${product}.js`))
  const css = productCss(mod[exportName])
  writeFileSync(resolve(dist, `${product}.css`), `${css}\n`)
  console.log(`themes: ${product}.css (${Object.keys(mod[exportName]).length} themes)`)
}
