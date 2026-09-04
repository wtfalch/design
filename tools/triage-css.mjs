/**
 * Which side of the split does each rule belong to?
 *
 * `tf/dashboard/src/styles.css` is one 4,527-line file serving both the
 * components that are leaving and the screens that are staying. Deciding that
 * by reading it is how you miss twenty rules; deciding it by grepping a class
 * name is how you take the app's layout with you.
 *
 * The rule this encodes: **a selector belongs to the app if it names anything
 * the app owns.** `.switch-row` is the package's. `.set-row > .switch-row` is
 * not — it positions the package's component inside a container the package has
 * never heard of, and shipping it would mean the package asserting things about
 * a document it does not own. Those rules stay behind and become the app's
 * problem, which is the correct answer and also the one that keeps the package
 * honest about its own edges.
 *
 * Usage:
 *   node tools/triage-css.mjs ../tf/dashboard [--component Toggle]
 *
 * Output is a report, never an edit. The extraction itself is done by hand,
 * per component, so each rule is looked at once by somebody.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

/** The 24 that have no app import — the package's surface. */
const PACKAGE_COMPONENTS = [
  'Brand',
  'Callout',
  'Card',
  'Checkbox',
  'DangerZone',
  'Dialog',
  'Empty',
  'Field',
  'Icon',
  'Illustration',
  'Markdown',
  'Modal',
  'Progress',
  'Rows',
  'Select',
  'SizeGrid',
  'Skeleton',
  'Slider',
  'Table',
  'Tabs',
  'Toast',
  'Toggle',
  'Tooltip',
  'Tour',
]

/**
 * Every class a file could put in the DOM.
 *
 * Static `className="a b"` is the easy half. The other half is
 * `` className={`switch-row switch-${size}${disabled ? ' is-disabled' : ''}`} ``
 * — a template literal whose class names are split across interpolations. So
 * this reads class-shaped tokens out of every string literal in the file rather
 * than only out of `className=`, and accepts the false positives: over-reading
 * shows a rule as the package's and asks a human, while under-reading drops it
 * silently. The two failures are not symmetric.
 *
 * **Comments come out first, and that is not tidiness.** These files carry long
 * prose docblocks, and prose has apostrophes -- so a naive string-literal scan
 * reads "a checkbox that stretches pushes everything else off the row" as an
 * open quote and tokenises the sentences after it. Toggle.tsx alone yielded
 * `panel`, `set`, `choice`, `status` and eighty English words as class names,
 * which is over-reading far past the point where asking a human is useful.
 */
function classesIn(raw) {
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const found = new Set()
  const strings = source.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) ?? []
  for (const raw of strings) {
    for (const token of raw.slice(1, -1).split(/[\s`${}()?:,;<>[\]!=&|+/\\'"]+/)) {
      if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(token) && token.length > 2) found.add(token)
    }
  }
  return found
}

/**
 * Split a stylesheet into rules, at-rules included.
 *
 * Comments are stripped from the whole source first rather than from each
 * selector afterwards. This file's comments are long, contain braces, and sit
 * between rules -- stripping per-selector left a comment that opened before the
 * previous rule ended attached to the next one, and reported the tail of a
 * comment plus `.applet-review-row .mono` as though the whole thing were one
 * selector. Harmless in a count, misleading in a list somebody works from.
 * (And writing that example out literally closed this comment early, which is
 * the same class of mistake one layer up.)
 */
function rules(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = []
  let i = 0
  while (i < css.length) {
    const brace = css.indexOf('{', i)
    if (brace === -1) break
    // Walk back over the selector and any comment attached above it.
    const head = css.slice(i, brace)
    let depth = 1
    let j = brace + 1
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const selector = head.trim()
    if (selector) out.push({ selector, start: i, end: j, body: css.slice(brace + 1, j - 1) })
    i = j
  }
  return out
}

const [, , tfPath, ...rest] = process.argv
if (!tfPath) {
  console.error('usage: node tools/triage-css.mjs <path-to-tf/dashboard> [--component Name]')
  process.exit(1)
}
const only = rest.includes('--component') ? rest[rest.indexOf('--component') + 1] : null

const src = resolve(tfPath, 'src')
const componentDir = join(src, 'components')
const css = readFileSync(join(src, 'styles.css'), 'utf8')

const pkgClasses = new Set()
const appClasses = new Set()
for (const file of readdirSync(componentDir).filter((f) => f.endsWith('.tsx'))) {
  const name = basename(file, '.tsx')
  const target = PACKAGE_COMPONENTS.includes(name) ? pkgClasses : appClasses
  for (const c of classesIn(readFileSync(join(componentDir, file), 'utf8'))) target.add(c)
}
// App.tsx and the gallery are app-side too.
for (const extra of ['App.tsx', 'design/Gallery.tsx']) {
  try {
    for (const c of classesIn(readFileSync(join(src, extra), 'utf8'))) appClasses.add(c)
  } catch {}
}

/**
 * **A class is the package's if a package component renders it**, whether or
 * not an app file also writes it.
 *
 * The first version of this treated "an app file mentions `.card`" as the app
 * having a claim on it, and reported 197 rules as contested. Nearly all of them
 * were `.card`, `.row`, `.muted`, `button.primary` — the app *consuming* the
 * design system, which is the thing the design system is for. Consumption is
 * not ownership, and a rule that says otherwise makes every widely-used
 * component look like a conflict and hides the ten that are real.
 */
const owned = pkgClasses
/** Written by an app file and rendered by no package component. */
const appOnly = new Set([...appClasses].filter((c) => !owned.has(c)))

const buckets = { package: [], app: [], mixed: [] }

for (const rule of rules(css)) {
  const named = [...(rule.selector.match(/\.[a-z][a-z0-9-]*/g) ?? [])].map((s) => s.slice(1))
  if (named.length === 0) continue
  if (only) {
    const want = classesIn(readFileSync(join(componentDir, `${only}.tsx`), 'utf8'))
    if (!named.some((c) => want.has(c))) continue
  }
  const hasPkg = named.some((c) => owned.has(c))
  const hasApp = named.some((c) => appOnly.has(c))
  if (hasPkg && hasApp) buckets.mixed.push(rule)
  else if (hasPkg) buckets.package.push(rule)
  else buckets.app.push(rule)
}

const label = only ? `${only} — ` : ''
console.log(`${label}${rules(css).length} rules in styles.css\n`)
for (const [name, list] of Object.entries(buckets)) {
  console.log(`${String(list.length).padStart(5)}  ${name}`)
}
console.log()

if (buckets.mixed.length) {
  console.log('MIXED — a package class positioned by an app container.')
  console.log('These stay in the app. The package cannot ship a rule about a')
  console.log('selector it has never heard of.\n')
  for (const r of buckets.mixed.slice(0, 40)) console.log(`   ${r.selector.replace(/\s+/g, ' ')}`)
  if (buckets.mixed.length > 40) console.log(`   … and ${buckets.mixed.length - 40} more`)
  console.log()
}

if (only) {
  console.log(`PACKAGE — ${buckets.package.length} rules to lift for ${only}:\n`)
  for (const r of buckets.package) console.log(`   ${r.selector.replace(/\s+/g, ' ')}`)
}
