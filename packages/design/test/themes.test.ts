import { describe, expect, it } from 'vitest'
import { THEMES, TOKEN_KEYS, applyTheme } from '../src/themes'
import { productCss, themeId } from '../src/themes/css'
import { TF_THEMES } from '../src/themes/tf'
import { VALET_THEMES } from '../src/themes/valet'

/**
 * A theme is applied by name, and the name has to mean the same thing to
 * `applyTheme`, to the generated CSS and to the registry, or a consumer that
 * writes `data-theme="valet-night"` in its HTML and later calls
 * `applyTheme('valet-night')` is applying two different things.
 */
describe('the themes, per product', () => {
  it('registers every product theme under the id applyTheme derives', () => {
    for (const [id, theme] of Object.entries(THEMES)) {
      expect(themeId(theme), theme.name).toBe(id)
    }
    expect(Object.keys(THEMES)).toEqual([...Object.keys(TF_THEMES), ...Object.keys(VALET_THEMES)])
  })

  it('names only tokens a theme may set', () => {
    const allowed = new Set<string>(TOKEN_KEYS)
    for (const [id, theme] of Object.entries(THEMES)) {
      for (const key of Object.keys(theme.tokens)) {
        expect(allowed.has(key), `${id} sets ${key}`).toBe(true)
      }
    }
  })

  it('generates one rule per theme, and none for the one with no palette', () => {
    const css = productCss(TF_THEMES)
    expect(css).not.toContain("[data-theme='system']")
    expect(css).toContain(":root[data-theme='night']{")
    expect(css).toContain(":root[data-theme='paper']{")
    const valet = productCss(VALET_THEMES)
    expect(valet).toContain(":root[data-theme='valet']{--bg:#f4f5f8;")
    expect(valet).toContain('color-scheme:dark}')
    for (const [key, value] of Object.entries(VALET_THEMES['valet-night'].tokens)) {
      expect(valet).toContain(`${key}:${value}`)
    }
  })

  it('refuses a product module keyed by a name applyTheme would not use', () => {
    expect(() => productCss({ wrong: VALET_THEMES.valet })).toThrow(/keyed "wrong"/)
  })

  it('applies a registered theme by the same id', () => {
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
    applyTheme('valet-night', el as unknown as HTMLElement)
    expect(el.dataset.theme).toBe('valet-night')
    expect(props.get('--accent')).toBe('#8f88ff')
    expect(el.style.colorScheme).toBe('dark')
  })
})
