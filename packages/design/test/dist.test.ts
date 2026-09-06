import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The built package loads where a consumer's tests run.
 *
 * Every other test here imports `src`, through vitest, which resolves what a
 * bundler resolves. That is how `dist` shipped for three releases with
 * relative imports Node could not follow: nothing in this repo ever imported
 * the built files without a bundler in the way. This does, in a child Node,
 * which is exactly what a consumer's vitest does when it imports the package.
 *
 * It needs `dist`, so it runs after `pnpm build`, which is the order the gate
 * and CI already use. Missing `dist` is a failure rather than a skip, because a
 * skipped test is how this would go unnoticed again.
 */
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

function inNode(entry: string, expr: string): string {
  const script = `const m = await import(${JSON.stringify(resolve(dist, entry))}); console.log(${expr})`
  return execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim()
}

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(?:js|d\.ts)$/.test(name)) yield path
  }
}

describe('the built package', () => {
  it('exists, because these tests run after the build', () => {
    expect(existsSync(join(dist, 'index.js')), 'no dist: run pnpm build first').toBe(true)
  })

  it('loads in plain Node, with no bundler resolving its imports', () => {
    expect(inNode('index.js', 'typeof m.Brand + " " + m.BRAND_NAMES.join(",")')).toBe(
      'function tf,valet',
    )
    expect(inNode('valet.js', 'm.DEFAULT_THEME + " " + m.product.name')).toBe('valet valet')
    expect(inNode('tf.js', 'm.DEFAULT_THEME + " " + m.product.name')).toBe('system tf')
    expect(inNode('themes/index.js', 'Object.keys(m.THEMES).join(",")')).toBe(
      'system,night,paper,valet,valet-night',
    )
  })

  it('carries no extensionless relative import, in code or in declarations', () => {
    const bare: string[] = []
    for (const file of files(dist)) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.\.?\/[^'"]*)['"]/g)) {
        if (!/\.(?:[cm]?js|json|css|d\.ts)$/.test(m[1])) bare.push(`${file}: ${m[1]}`)
      }
    }
    expect(bare).toEqual([])
  })
})
