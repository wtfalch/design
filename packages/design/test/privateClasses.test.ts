/**
 * The package hands out components and tokens. Not classes.
 *
 * A class is not API here, and the reason is a bug that shipped: `Card`'s box
 * moved into its own class list, which deleted `.card` from the stylesheet --
 * and nothing in this package failed. No type error, no red test. It broke in
 * the gallery, which had been rendering `<div className="card">` around three
 * skeleton rows, and it would have broken any consumer doing the same.
 *
 * So the rule is enforced rather than remembered. A component may draw itself
 * however it likes, including with utilities, as long as nothing outside the
 * package is leaning on the class it stops writing.
 *
 * The gallery is the test subject because it is the package's own harness and
 * was by far the biggest offender -- 94 uses of 18 classes, more than every
 * real consumer combined. If it can live on components and its own `g-`
 * prefixed stylesheet, so can anybody.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const STYLES = resolve(here, '../src/styles')
const GALLERY = resolve(here, '../../../gallery/src')

/** Every class the package's own sheets define. */
function packageClasses(): Set<string> {
  const out = new Set<string>()
  for (const name of readdirSync(STYLES)) {
    if (!name.endsWith('.css') || name.includes('tailwind')) continue
    const css = readFileSync(join(STYLES, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ')
    for (const [, sel] of css.matchAll(/([^{}]+)\{/g)) {
      if (sel.trim().startsWith('@')) continue
      for (const [, cls] of sel.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) out.add(cls)
    }
  }
  return out
}

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (path.endsWith('.tsx')) yield path
  }
}

describe('the package ships components and tokens, not classes', () => {
  it('the gallery names no class the package defines', () => {
    const own = packageClasses()
    const offenders: string[] = []
    for (const path of files(GALLERY)) {
      const src = readFileSync(path, 'utf8')
      for (const m of src.matchAll(/className="([^"]*)"|className=\{`([^`]*)`\}/g)) {
        for (const tok of (m[1] ?? m[2] ?? '').split(/\s+/)) {
          /* `${...}` interpolation leaves fragments; only whole words count. */
          if (!/^[a-z][a-z0-9-]*$/.test(tok)) continue
          if (own.has(tok)) offenders.push(`${path.split('/').pop()}: ${tok}`)
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([])
  })

  it('still has classes to be private about', () => {
    /* Guards the test itself: if `packageClasses` ever stopped finding
       anything -- a moved directory, a changed comment syntax -- the check
       above would pass by doing nothing. */
    expect(packageClasses().size).toBeGreaterThan(100)
  })
})
