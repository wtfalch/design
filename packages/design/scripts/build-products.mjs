/**
 * Write each product's stylesheet beside the compiled module.
 *
 * Runs after `tsc`, `fix-extensions.mjs` and `copy-css.mjs`, and reads the
 * compiled product modules and the compiled `css.ts` rather than the sources,
 * because Node cannot import a `.ts` file. It can import the compiled ones
 * since 0.3.1, when the build started writing the file extensions Node needs;
 * before that, only a module with nothing but `import type` lines would load.
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
