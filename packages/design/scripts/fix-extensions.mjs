/**
 * Give every relative import in `dist` its file extension.
 *
 * `tsc` emits specifiers as written, and the sources write `./Brand`, which
 * `moduleResolution: bundler` resolves and native Node ESM refuses. So
 * `import '@wtfalch/design'` in plain Node, or under vitest, died on the first
 * relative import with ERR_MODULE_NOT_FOUND, and both consumers' tests read
 * the built table with a regex to get round it (tf's `brandMark.test.ts`,
 * valet's `icon.test.ts`). A bundler never noticed, which is how 0.1.0 through
 * 0.3.0 shipped that way. Found 2026-09-06.
 *
 * The build finishes the job: in every `.js` and `.d.ts` under `dist`, a
 * `./x` or `../x` that names a file becomes `./x.js`, and one that names a
 * directory becomes `./x/index.js`. The `.d.ts` files get the same treatment
 * because a consumer on `moduleResolution: nodenext` resolves their imports by
 * the same rule. A specifier this script cannot resolve is an error, since it
 * is one Node will not resolve either. `dist.test.ts` then imports the built
 * entries in a child Node with no bundler in the way.
 *
 *   node scripts/fix-extensions.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

/* `from './x'`, `import './x'`, `import('./x')` and the `import("./x").T` of a
   declaration file. The specifier is group 3; group 1 is kept as written. */
const SPEC = /((?:^|[^\w$.])(?:from|import)\s*\(?\s*)(['"])(\.\.?\/[^'"]*)\2/g
const HAS_EXTENSION = /\.(?:[cm]?js|json|css|d\.ts)$/

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(?:js|d\.ts)$/.test(name)) yield path
  }
}

let rewritten = 0
let touched = 0
for (const file of files(dist)) {
  const dir = dirname(file)
  let changed = false
  const out = readFileSync(file, 'utf8').replace(SPEC, (whole, lead, quote, spec) => {
    if (HAS_EXTENSION.test(spec)) return whole
    const target = resolve(dir, spec)
    let fixed
    if (existsSync(`${target}.js`)) fixed = `${spec}.js`
    else if (existsSync(join(target, 'index.js'))) fixed = `${spec}/index.js`
    else throw new Error(`${file}: cannot resolve '${spec}' to a file under dist`)
    rewritten += 1
    changed = true
    return `${lead}${quote}${fixed}${quote}`
  })
  if (changed) {
    writeFileSync(file, out)
    touched += 1
  }
}
console.log(`extensions: ${rewritten} specifiers in ${touched} files`)
