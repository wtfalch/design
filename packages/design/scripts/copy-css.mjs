/**
 * The CSS half of the build, because `tsc` only moves TypeScript.
 *
 * `src/styles/index.css` is a list of `@import` lines and nothing else -- that
 * file IS the cascade order, written down where it can be reviewed, rather than
 * whatever `readdir` happens to return. This script reads it and writes the
 * imports out flat.
 *
 * Flattened rather than shipped as imports, because `@import` at run time is a
 * serial request per component before anything paints, and leaving them in
 * would make every consumer's bundler responsible for resolving them. One file
 * works in a bundler, behind a `<link>`, and inside a sandboxed applet frame
 * alike.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../src')
const dist = resolve(here, '../dist')

/** The vocabulary ships as its own file: a consumer may want the tokens with
 *  none of the components -- to theme an applet frame, say. */
mkdirSync(dist, { recursive: true })
writeFileSync(join(dist, 'tokens.css'), readFileSync(join(src, 'tokens.css')))

/**
 * Tailwind first, because `index.css` imports its output and this script
 * flattens imports textually -- it cannot resolve `tailwindcss/theme.css`
 * and would ship the literal `@import` line to every consumer.
 *
 * The CLI scans the components for the utilities they actually use and emits
 * only those, which is why this runs against `src` rather than `dist`: the
 * class names live in the TSX.
 */
const twIn = join(src, 'styles/tailwind.css')
const twOut = join(src, 'styles/_tailwind.built.css')
execFileSync(
  process.execPath,
  [
    resolve(here, '../node_modules/@tailwindcss/cli/dist/index.mjs'),
    '-i',
    twIn,
    '-o',
    twOut,
    '--content',
    join(src, '**/*.tsx'),
  ],
  { stdio: 'inherit' },
)

const indexPath = join(src, 'styles/index.css')
mkdirSync(join(dist, 'styles'), { recursive: true })

if (!existsSync(indexPath)) {
  // Phase 1 ships the vocabulary and no components yet. An empty sheet keeps
  // the exports map honest rather than pointing at a file that is not there.
  writeFileSync(join(dist, 'styles/index.css'), '/* no component styles yet */\n')
  console.log('css: tokens.css (no component styles yet)')
} else {
  const order = []
  const out = []
  for (const line of readFileSync(indexPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*@import\s+['"](.+?)['"]\s*;?\s*$/)
    if (m) {
      const file = join(src, 'styles', m[1])
      order.push(m[1])
      out.push(`/* ---- ${m[1]} ---- */`, readFileSync(file, 'utf8').trimEnd(), '')
      continue
    }
    // Anything that is not an import is a comment explaining the order. Keep it.
    if (line.trim()) out.push(line)
  }
  writeFileSync(join(dist, 'styles/index.css'), `${out.join('\n')}\n`)
  console.log(`css: tokens.css + ${order.length} component sheets`)
}
