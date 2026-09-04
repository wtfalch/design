/**
 * Why do two renderings of the same specimen differ?
 *
 * A screenshot diff says "these corners moved". It does not say which rule
 * stopped applying, and the extraction moved 364 rules — so guessing costs more
 * than measuring. This loads one specimen from two galleries and reports the
 * computed properties that disagree, per element.
 *
 *   node tools/diff-computed.mjs <urlA> <urlB> <c> <v> [theme]
 */
import { chromium } from '@playwright/test'

const [, , urlA, urlB, c, v, theme = 'system'] = process.argv
if (!urlB) {
  console.error('usage: node tools/diff-computed.mjs <urlA> <urlB> <component> <variant> [theme]')
  process.exit(1)
}

/* Properties worth comparing. The full computed set is ~340 per element and
   most of it is noise that never differs; this is the shape, spacing, colour
   and type that a CSS extraction could plausibly break. */
const PROPS = [
  'display',
  'position',
  'boxSizing',
  'width',
  'height',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderTopStyle',
  'borderTopColor',
  'borderRadius',
  'backgroundColor',
  'backgroundImage',
  'color',
  'opacity',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'gap',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gridTemplateColumns',
  'boxShadow',
  'overflow',
  'textTransform',
  'transform',
]

async function read(url) {
  const page = await (await chromium.launch()).newPage({ viewport: { width: 1000, height: 800 } })
  const target = `${url}/design.html?${new URLSearchParams({ c, v, theme, chrome: '0' })}`
  await page.goto(target)
  await page.locator('.spec-stage').waitFor()
  await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme)
  const data = await page.evaluate((props) => {
    const out = []
    const walk = (el, path) => {
      const s = getComputedStyle(el)
      out.push([path, Object.fromEntries(props.map((p) => [p, s[p]]))])
      ;[...el.children].forEach((child, i) =>
        walk(child, `${path} > ${child.tagName.toLowerCase()}.${child.className || '·'}#${i}`),
      )
    }
    walk(document.querySelector('.spec-stage'), '.spec-stage')
    return out
  }, PROPS)
  await page.context().browser()?.close()
  return data
}

const [a, b] = await Promise.all([read(urlA), read(urlB)])

if (a.length !== b.length) {
  console.log(
    `different element counts: ${a.length} vs ${b.length} — the markup differs, not only the CSS`,
  )
}

let found = 0
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const [path, x] = a[i]
  const [, y] = b[i]
  const diffs = PROPS.filter((p) => x[p] !== y[p])
  if (diffs.length === 0) continue
  found++
  console.log(`\n${path}`)
  for (const p of diffs) console.log(`   ${p}\n     A: ${x[p]}\n     B: ${y[p]}`)
}
console.log(found === 0 ? '\nidentical' : `\n${found} elements differ`)
