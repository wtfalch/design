/**
 * Every component module exports its component and nothing else.
 *
 * A module that exports a value beside a component loses its Fast Refresh
 * boundary: editing it re-runs every importer instead of swapping the
 * component in place. tf enforces this over its app components; this is the
 * same rule over the package's, ported so it holds here too. `iconNames.ts`
 * and `tourMarker.ts` exist because of it.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src/components')

function valueExports(src: string): string[] {
  const out: string[] = []
  for (const m of src.matchAll(
    /^export\s+(?!type\b|interface\b|default\b)(?:const|let|var|function|class)\s+(\w+)/gm,
  )) {
    out.push(m[1])
  }
  for (const m of src.matchAll(/^export\s+\{([^}]*)\}/gm)) {
    for (const raw of m[1].split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        .trim()
      if (name && !name.startsWith('type ')) out.push(name)
    }
  }
  return out
}

describe('fast refresh', () => {
  it('no component module exports a value beside its component', () => {
    const offenders: string[] = []
    for (const file of readdirSync(SRC).filter((f) => f.endsWith('.tsx'))) {
      const src = readFileSync(join(SRC, file), 'utf8')
      if (!/^export default/m.test(src)) continue
      const values = valueExports(src).filter((n) => !/^[A-Z]/.test(n) || n === n.toUpperCase())
      if (values.length) offenders.push(`${file} exports ${values.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })

  it('the tour does not snapshot its stops', () => {
    // A ref snapshot made copy edits invisible until the tour was restarted.
    const tour = readFileSync(join(SRC, 'Tour.tsx'), 'utf8')
    expect(tour).toMatch(/const live = useMemo\(\(\) => stops\.filter\([\s\S]*?\), \[stops\]\)/)
    expect(tour).not.toMatch(/live\.current/)
  })
})
