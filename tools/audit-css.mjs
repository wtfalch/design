/**
 * Custom properties that resolve to nothing, and tokens nobody declared.
 *
 * **An undefined custom property is not an error, it is a blank.** `var(--line)`
 * with no `--line` anywhere makes the whole declaration invalid at
 * computed-value time, so `border-left: 1px solid var(--line)` draws no border
 * and reports nothing — not in the console, not in the build, not in a test.
 * That exact line sat in `styles.css:2852` and every thinking block in the
 * studio and the ask pane rendered with its indent and without the rule that
 * makes the indent mean something.
 *
 * Three things are checked, and the second and third are not failures:
 *
 * 1. **Undefined, no fallback** — a bug. The declaration does not apply.
 * 2. **Slots** — used with a fallback and declared nowhere. These work, but no
 *    theme can fill them, which makes them themeable in appearance only.
 *    `--illo-paper` and `--shadow-lg` are both this: the "pre-declare the slot"
 *    pattern done halfway, since the slot was never added to the vocabulary.
 * 3. **Secret tokens** — declared on `:root` outside `tokens.css`. `--control`
 *    is one, used seven times. A theme cannot name it, and it is not local to a
 *    component either, so it is a token in every respect except being in the
 *    vocabulary that the contract test checks.
 *
 * Component-local properties (declared inside the rule that uses them, like
 * `--toggle-off` or the `--slider-*` family) are fine and are not reported:
 * they are implementation, not vocabulary.
 *
 * Usage:
 *   node tools/audit-css.mjs ../tf/dashboard/src/tokens.css ../tf/dashboard/src/styles.css ...
 *
 * This becomes a test inside the package once the component sheets exist. It is
 * a script first because it had to be run against tf to find out what was
 * there.
 */
import { readFileSync } from 'node:fs'

/** Properties the program sets at run time. Declared in JS, so no stylesheet
 *  will ever contain them, and flagging them is noise. */
const SET_FROM_JS = new Set(['--cols', '--row', '--rows', '--tabs'])

/**
 * Blank the comments, keeping the newlines.
 *
 * Deleting them shifts every line after the first comment, so a reported
 * `styles.css:2095` pointed at a rule 750 lines away from the one that was
 * wrong. A tool that names the wrong line costs more than it saves.
 */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node tools/audit-css.mjs <tokens.css> <sheet.css> [...]')
  process.exit(1)
}

const sources = files.map((f) => ({ file: f, css: strip(readFileSync(f, 'utf8')) }))

/** `--x:` anywhere is a declaration. Indented at the top level of a `:root`
 *  block is a token; inside any other rule it is component-local. */
const declared = new Set()
const rootDeclared = new Set()
for (const { css } of sources) {
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(m[1])
  for (const block of css.matchAll(/:root[^{]*\{([^}]*)\}/g)) {
    for (const m of block[1].matchAll(/(--[a-z0-9-]+)\s*:/g)) rootDeclared.add(m[1])
  }
}

/** The vocabulary is whatever the first file declares — `tokens.css`. */
const vocabulary = new Set()
for (const m of sources[0].css.matchAll(/(--[a-z0-9-]+)\s*:/g)) vocabulary.add(m[1])

const undefinedNoFallback = new Map()
const slots = new Map()
for (const { file, css } of sources) {
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/g)) {
    const [, name, next] = m
    if (declared.has(name) || SET_FROM_JS.has(name)) continue
    const line = css.slice(0, m.index).split('\n').length
    const target = next === ',' ? slots : undefinedNoFallback
    if (!target.has(name)) target.set(name, [])
    target.get(name).push(`${file}:${line}`)
  }
}

const secret = [...rootDeclared].filter((k) => !vocabulary.has(k)).sort()

let failed = false

if (undefinedNoFallback.size) {
  failed = true
  console.log('UNDEFINED, NO FALLBACK — the declaration does not apply:\n')
  for (const [name, at] of undefinedNoFallback) console.log(`   ${name}  ${at.join(', ')}`)
  console.log()
}

if (slots.size) {
  console.log('SLOTS — used with a fallback, declared nowhere.')
  console.log('These render, but no theme can fill them:\n')
  for (const [name, at] of slots) console.log(`   ${name}  ${at.join(', ')}`)
  console.log()
}

if (secret.length) {
  console.log('SECRET TOKENS — on :root, outside the vocabulary.')
  console.log('Not component-local, and not nameable by a theme:\n')
  for (const name of secret) console.log(`   ${name}`)
  console.log()
}

if (!failed && !slots.size && !secret.length) console.log('clean')
process.exit(failed ? 1 : 0)
