/**
 * Lift the package's rules out of the app's stylesheet, one file per component.
 *
 * Two things this must not lose, and they pull in opposite directions:
 *
 * **The comments.** `styles.css` carries its reasoning beside the rules — why a
 * divider and a control outline cannot share a token, why a placeholder must
 * not name the colour it sits on. `dashboard/CLAUDE.md` is explicit that
 * compressing counts as removing, so a comment above a rule travels with it.
 *
 * **The order.** CSS is a cascade: two rules of equal specificity are decided by
 * which came last. Splitting one file into twenty-five and concatenating them
 * in any order at all would silently reorder rules that never moved. So a rule
 * keeps its position, `index.css` lists the sheets in order of first
 * appearance, and anything that cannot be attributed to a single component
 * stays in `base.css` at the position it had.
 *
 * The order is still *changed* — interleaved rules from two components end up
 * grouped. That is what the 204 baselines are for: this is the one step in the
 * whole extraction where "it looks identical" is a claim a machine can check.
 *
 *   node tools/extract-css.mjs ../tf/dashboard packages/design/src/styles
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

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

/** Class-shaped tokens in a file's string literals, comments stripped first —
 *  prose has apostrophes, and a naive scan reads half the docblock as markup. */
function classesIn(raw) {
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const found = new Set()
  for (const str of source.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) ?? []) {
    for (const token of str.slice(1, -1).split(/[\s`${}()?:,;<>[\]!=&|+/\\'"]+/)) {
      /* Two characters is a class name. `md` is Markdown's, and a `> 2` filter
         -- there to cut noise from short words -- took every `.md p` and
         `.md ol` rule with it, so a rendered document fell back to the
         browser's default margins. `on`, `sm` and `lg` are the same shape. */
      if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(token) && token.length >= 2) found.add(token)
    }
  }
  return found
}

/**
 * Split into `{ comment, selector, body }`, keeping the comment that sits above
 * a rule with it.
 *
 * Comments are located on the original text rather than a stripped copy,
 * because the whole point is to carry them across.
 */
function parse(css) {
  const out = []
  let i = 0
  while (i < css.length) {
    // Find the next `{` that is not inside a comment or a string.
    let j = i
    let brace = -1
    while (j < css.length) {
      if (css.startsWith('/*', j)) {
        j = css.indexOf('*/', j + 2)
        if (j === -1) {
          j = css.length
          break
        }
        j += 2
        continue
      }
      if (css[j] === '{') {
        brace = j
        break
      }
      j++
    }
    if (brace === -1) break

    const head = css.slice(i, brace)
    // The selector is whatever follows the last comment in the head; the
    // comments before it are the rule's documentation.
    const lastClose = head.lastIndexOf('*/')
    const selector = (lastClose === -1 ? head : head.slice(lastClose + 2)).trim()
    const comment = (lastClose === -1 ? '' : head.slice(0, lastClose + 2)).trim()

    let depth = 1
    let k = brace + 1
    while (k < css.length && depth > 0) {
      if (css.startsWith('/*', k)) {
        k = css.indexOf('*/', k + 2) + 2
        continue
      }
      if (css[k] === '{') depth++
      else if (css[k] === '}') depth--
      k++
    }
    out.push({ comment, selector, body: css.slice(brace + 1, k - 1), end: k })
    i = k
  }
  return out
}

const [, , tfPath, outPath] = process.argv
if (!tfPath || !outPath) {
  console.error('usage: node tools/extract-css.mjs <tf/dashboard> <out dir>')
  process.exit(1)
}

const src = resolve(tfPath, 'src')
const componentDir = join(src, 'components')
const css = readFileSync(join(src, 'styles.css'), 'utf8')
const out = resolve(outPath)

/** class -> component that renders it. A class rendered by several package
 *  components (`.mono`, `.row`) belongs to none of them and goes to base. */
const owner = new Map()
const shared = new Set()
const appClasses = new Set()
for (const file of readdirSync(componentDir).filter((f) => f.endsWith('.tsx'))) {
  const name = basename(file, '.tsx')
  const classes = classesIn(readFileSync(join(componentDir, file), 'utf8'))
  if (!PACKAGE_COMPONENTS.includes(name)) {
    for (const c of classes) appClasses.add(c)
    continue
  }
  for (const c of classes) {
    if (owner.has(c) && owner.get(c) !== name) shared.add(c)
    else owner.set(c, name)
  }
}
for (const c of shared) owner.delete(c)

/* The gallery is the authority on what is *in* the design system.
   `.pill`, `.btn`, `.input`, `.textarea` and the type scale are rendered by no
   component -- they are the five pages that document markup nobody can import,
   which is one of the reasons this extraction is happening. Left to the
   component files alone, their CSS would stay behind and the gallery would
   render them unstyled, so `specimens.tsx` counts as a package source: the
   system is what the gallery documents, and phase 5 gives each of these a
   component.

   This over-includes, and deliberately. A rule that travels and is used by
   nothing is dead weight a later test can name; a rule that stays behind is a
   component that renders wrong, and the 204 baselines are exactly the thing
   that would catch it. The two failures are not symmetric. */
for (const c of classesIn(readFileSync(join(src, 'design/specimens.tsx'), 'utf8'))) {
  if (!owner.has(c)) shared.add(c)
}

const ownedByPackage = new Set([...owner.keys(), ...shared])
const appOnly = new Set([...appClasses].filter((c) => !ownedByPackage.has(c)))

/**
 * A class is also the package's if a package class is its prefix.
 *
 * Class names here are composed at run time -- `` `skel skel-${shape}
 * skel-on-${surface}` `` -- so scanning string literals sees `skel` and never
 * `skel-rounded`. Twelve skeleton specimens rendered with square corners and
 * full opacity because `.skel-rounded` and `.skel-pulse` stayed behind, and the
 * screenshot diff showed only a few corner pixels: the least legible possible
 * symptom of a whole rule not applying.
 *
 * Prefix ownership catches the whole family from the one literal that is always
 * written out, because the base class is the one you cannot interpolate.
 */
function ownerOf(cls) {
  if (owner.has(cls)) return owner.get(cls)
  // The longest matching prefix wins: `skel-on-muted` is Skeleton's by `skel`,
  // but if some component ever owned `skel-on` that would be the better answer.
  let bestPrefix = ''
  let bestOwner = null
  for (const [known, component] of owner) {
    if (cls.startsWith(`${known}-`) && known.length > bestPrefix.length) {
      bestPrefix = known
      bestOwner = component
    }
  }
  return bestOwner
}
const isPackage = (cls) => ownedByPackage.has(cls) || ownerOf(cls) !== null

/* Assign each rule, in source order. A rule naming an app-only class stays
   behind entirely -- `.set-row > .switch-row` positions the component inside a
   container the package has never heard of, and shipping it would be the
   package asserting things about a document it does not own. */
const sheets = new Map() // component -> [chunk]
const order = []
let kept = 0
let left = 0

/**
 * At-rules, which the first two passes dropped entirely.
 *
 * `@keyframes` and `@media` have no class in their selector, so the
 * "element-level rules go to base" branch skipped them and the "no package
 * class" branch left them behind. That silently removed the whole
 * `prefers-color-scheme: light` block -- the mechanism the `system` theme is
 * built on -- every `prefers-reduced-motion` override, and all six animations.
 * The screenshot diff for a card showed white-on-dark, which reads as a broken
 * component and was a missing media query.
 *
 * `@keyframes` go to base whole: they are named globally, so which file they
 * sit in changes nothing.
 *
 * `@media` blocks are *split*, because one can hold rules for both sides. Each
 * inner rule is assigned exactly as a top-level rule would be, then re-wrapped
 * in its own copy of the query. Two `@media` blocks with the same condition
 * behave as one.
 */
function assign(target, text) {
  if (!sheets.has(target)) {
    sheets.set(target, [])
    order.push(target)
  }
  sheets.get(target).push(text)
}

for (const rule of parse(css)) {
  if (rule.selector.startsWith('@keyframes')) {
    assign('base', chunk(rule))
    kept++
    continue
  }

  if (rule.selector.startsWith('@media') || rule.selector.startsWith('@supports')) {
    const inner = parse(rule.body)
    const byTarget = new Map()
    for (const sub of inner) {
      const subNamed = [...(sub.selector.match(/\.[a-z][a-z0-9-]*/g) ?? [])].map((x) => x.slice(1))
      const subMine = subNamed.filter((c) => isPackage(c))
      if (subNamed.some((c) => appOnly.has(c) && !isPackage(c))) {
        left++
        continue
      }
      // No class at all inside a query is `:root`, `body` or an element -- the
      // foundation, same as at the top level.
      const owners = subMine.map((c) => ownerOf(c)).filter(Boolean)
      const target =
        subNamed.length === 0 ? 'base' : owners.length ? owners[owners.length - 1] : 'base'
      if (subNamed.length > 0 && subMine.length === 0) {
        left++
        continue
      }
      if (!byTarget.has(target)) byTarget.set(target, [])
      byTarget.get(target).push(chunk(sub))
      kept++
    }
    for (const [target, chunks] of byTarget) {
      const body = chunks.join('\n\n').replace(/^/gm, '  ')
      assign(target, `${rule.comment ? `${rule.comment}\n` : ''}${rule.selector} {\n${body}\n}`)
    }
    continue
  }

  const named = [...(rule.selector.match(/\.[a-z][a-z0-9-]*/g) ?? [])].map((s) => s.slice(1))
  const mine = named.filter((c) => isPackage(c))

  /* A rule with no class at all is the foundation, and it goes to base.
     The first pass required a class in the selector and so left all thirty-two
     of them behind: the `box-sizing` reset, the body type baseline, the
     `--app-overlay` slot, and every base style for `button`, `input`,
     `textarea`, `select`, checkbox and radio. Every component is drawn on top
     of those, so without them the package renders subtly wrong everywhere and
     obviously wrong nowhere -- all 204 baselines failed and each diff was a few
     pixels of padding.

     `body` is deliberate rather than accidental: a design system that sets the
     type baseline is a design system whose components share one, and an app
     that disagrees can say so after the import. */
  if (named.length === 0) {
    assign('base', chunk(rule))
    kept++
    continue
  }

  if (mine.length === 0 || named.some((c) => appOnly.has(c) && !isPackage(c))) {
    left++
    continue
  }

  /* The owning component is the one that renders the *last* package class in
     the selector -- the subject of the rule. `.card .toggle::after` is Toggle's
     business drawn inside a Card, not Card's. */
  const owners = mine.map((c) => ownerOf(c)).filter(Boolean)
  const target = owners.length ? owners[owners.length - 1] : 'base'

  assign(target, chunk(rule))
  kept++
}

mkdirSync(out, { recursive: true })
for (const [name, chunks] of sheets) {
  writeFileSync(join(out, `${fileFor(name)}.css`), `${chunks.join('\n\n')}\n`)
}

const index = [
  '/* The cascade, written down.',
  ' *',
  ' * Two rules of equal specificity are decided by which came last, so this',
  ' * order is behaviour rather than tidiness. It follows the order the rules',
  ' * appeared in the stylesheet they were lifted from; `base.css` is first',
  ' * because it holds the reset and the shared utilities everything else',
  ' * assumes.',
  ' *',
  ' * `scripts/copy-css.mjs` flattens these into one file at build time.',
  ' */',
  ...order.map((n) => `@import './${fileFor(n)}.css';`),
].join('\n')
writeFileSync(join(out, 'index.css'), `${index}\n`)

/** A rule with the comment that documented it. */
function chunk(rule) {
  return `${rule.comment ? `${rule.comment}\n` : ''}${rule.selector} {${rule.body}}`
}

function fileFor(name) {
  return name === 'base' ? 'base' : name.toLowerCase()
}

console.log(`${kept} rules into ${sheets.size} sheets; ${left} left in the app`)
for (const [name, chunks] of [...sheets].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(chunks.length).padStart(4)}  ${fileFor(name)}.css`)
}
