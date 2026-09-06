/**
 * Write each product's stylesheet beside the compiled module.
 *
 * Runs after `tsc` and `copy-css.mjs`, and reads the compiled product modules
 * and the compiled `css.ts` rather than the sources: Node cannot import a
 * `.ts` file, and each of those carries only `import type` lines, which
 * compile to nothing, so they load in plain Node where `dist/index.js` (which
 * imports its siblings without extensions) does not. A product module that
 * grows a value import breaks this build, which is the reminder.
 *
 *   node scripts/build-products.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '../dist')
const { productStylesheet } = await import(resolve(dist, 'themes/css.js'))
const tokens = readFileSync(resolve(dist, 'tokens.css'), 'utf8')
const components = readFileSync(resolve(dist, 'styles/index.css'), 'utf8')

for (const name of ['tf', 'valet']) {
  const mod = await import(resolve(dist, `products/${name}.js`))
  const product = mod[name]
  writeFileSync(resolve(dist, `${name}.css`), productStylesheet(product, tokens, components))
  console.log(`products: ${name}.css (${Object.keys(product.themes).length} themes)`)
}
