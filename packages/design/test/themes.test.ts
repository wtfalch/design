import { describe, expect, it } from 'vitest'
import { THEMES, TOKEN_KEYS, applyTheme } from '../src/themes'
import { themeId } from '../src/themes/css'

/**
 * A theme is applied by name, and the name has to mean the same thing to
 * `applyTheme`, to the generated CSS and to the registry, or a consumer that
 * writes `data-theme="night"` in its HTML and later calls
 * `applyTheme('night')` is applying two different things.
 *
 * The registry is the package's own since 0.17.0: `system`, and nothing that
 * belongs to a product.
 */
describe('the package themes', () => {
  it('is system alone, under the id applyTheme derives', () => {
    expect(Object.keys(THEMES)).toEqual(['system'])
    for (const [id, theme] of Object.entries(THEMES)) {
      expect(themeId(theme), theme.name).toBe(id)
    }
  })

  it('names only tokens a theme may set', () => {
    const allowed = new Set<string>(TOKEN_KEYS)
    for (const [id, theme] of Object.entries(THEMES)) {
      for (const key of Object.keys(theme.tokens)) {
        expect(allowed.has(key), `${id} sets ${key}`).toBe(true)
      }
    }
  })

  it('applies a theme object, clearing what the previous one set', () => {
    // The package's tests run in Node, so this is the four members of an
    // element `applyTheme` touches and nothing else.
    const props = new Map<string, string>()
    const el = {
      style: {
        colorScheme: '',
        setProperty: (k: string, v: string) => props.set(k, v),
        removeProperty: (k: string) => props.delete(k),
      },
      dataset: {} as Record<string, string>,
    }
    const root = el as unknown as HTMLElement
    applyTheme(
      { name: 'Deep Sea', note: '', scheme: 'dark', tokens: { '--accent': '#8f88ff' } },
      root,
    )
    expect(el.dataset.theme).toBe('deep-sea')
    expect(props.get('--accent')).toBe('#8f88ff')
    expect(el.style.colorScheme).toBe('dark')
    applyTheme('system', root)
    expect(el.dataset.theme).toBe('system')
    expect(props.has('--accent')).toBe(false)
  })
})
