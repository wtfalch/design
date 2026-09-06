import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BRAND_NAMES } from '../src/components/brandMarks'
import { PRODUCTS, bindProduct, defineProduct, productTheme } from '../src/products'
import { productStylesheet, themeId } from '../src/themes/css'

/** A root element `applyTheme` can write to, in Node. */
function fakeRoot() {
  const props = new Map<string, string>()
  const el = {
    style: {
      colorScheme: '',
      setProperty: (k: string, v: string) => props.set(k, v),
      removeProperty: (k: string) => props.delete(k),
    },
    dataset: {} as Record<string, string>,
  }
  return { el: el as unknown as HTMLElement, props, dataset: el.dataset }
}

describe('the products', () => {
  it('one per mark, under the same name', () => {
    expect(Object.keys(PRODUCTS)).toEqual(BRAND_NAMES)
    for (const [name, p] of Object.entries(PRODUCTS)) expect(p.name).toBe(name)
  })

  it('each defaults to one of its own themes, keyed as applyTheme would', () => {
    for (const p of Object.values(PRODUCTS)) expect(defineProduct(p)).toBe(p)
    expect(() => defineProduct({ ...PRODUCTS.valet, defaultTheme: 'paper' })).toThrow(
      /defaults to "paper"/,
    )
  })

  it("a palette does not restate its product's identity", () => {
    // The identity is the layer under the palettes. valet's two each carried
    // the same font and corner block once, and a theme shared between products
    // would have shown tf's font on valet wherever it kept quiet.
    for (const p of Object.values(PRODUCTS)) {
      const identity = Object.keys(p.identity)
      for (const [id, t] of Object.entries(p.themes)) {
        for (const key of Object.keys(t.tokens)) {
          expect(identity, `${id} restates ${key}`).not.toContain(key)
        }
      }
    }
  })

  it("tf's identity is the base values, and valet's is Plex and sharper corners", () => {
    expect(PRODUCTS.tf.identity).toEqual({})
    expect(PRODUCTS.valet.identity['--radius']).toBe('4px')
    expect(PRODUCTS.valet.identity['--font']).toContain('IBM Plex Sans')
  })

  it('a theme as the product wears it is the palette over the identity', () => {
    const t = productTheme(PRODUCTS.valet, 'valet-night')
    expect(themeId(t)).toBe('valet-night')
    expect(t.tokens['--radius']).toBe('4px')
    expect(t.tokens['--accent']).toBe('#8f88ff')
    // a theme may still change the identity on purpose
    const loud = productTheme(PRODUCTS.valet, {
      name: 'Loud',
      note: '',
      scheme: 'light',
      tokens: { '--radius': '20px' },
    })
    expect(loud.tokens['--radius']).toBe('20px')
    expect(loud.tokens['--font']).toContain('IBM Plex Sans')
    // an id the product dropped comes up as the product's default, not the package's
    expect(productTheme(PRODUCTS.valet, 'nope').name).toBe('valet')
  })

  it("a bound applyTheme writes the identity under the palette, so it holds without the product's CSS", () => {
    const valet = bindProduct(PRODUCTS.valet)
    const { el, props, dataset } = fakeRoot()
    valet.applyTheme(undefined, el)
    expect(dataset.theme).toBe('valet')
    expect(props.get('--radius')).toBe('4px')
    expect(props.get('--accent')).toBe('#4f46e5')
    valet.applyTheme('valet-night', el)
    expect(dataset.theme).toBe('valet-night')
    expect(props.get('--radius')).toBe('4px')
    expect(props.get('--accent')).toBe('#8f88ff')
    expect(valet.DEFAULT_THEME).toBe('valet')
    expect(Object.keys(valet.THEMES)).toEqual(['valet', 'valet-night'])
  })

  it("a bound Brand is the product's mark, and still takes a name", () => {
    const { Brand } = bindProduct(PRODUCTS.valet)
    const own = renderToStaticMarkup(createElement(Brand))
    expect(own).toContain('fill-rule="evenodd"')
    expect(own).toContain('aria-label="valet"')
    expect(renderToStaticMarkup(createElement(Brand, { name: 'tf' }))).toContain(
      'stroke-width="96"',
    )
  })

  it("a product's stylesheet is tokens, identity, default, components, themes, in that order", () => {
    const css = productStylesheet(PRODUCTS.valet, ':root{--x:1}', '.card{}')
    const at = (s: string) => {
      const i = css.indexOf(s)
      expect(i, s).toBeGreaterThan(-1)
      return i
    }
    expect(at(':root{--x:1}')).toBeLessThan(at(':root{--font:'))
    expect(at(':root{--font:')).toBeLessThan(at(':root:not([data-theme]){--bg:#f4f5f8;'))
    expect(at(':root:not([data-theme])')).toBeLessThan(at('.card{}'))
    expect(at('.card{}')).toBeLessThan(at(":root[data-theme='valet']{"))
    expect(css).toContain(":root[data-theme='valet-night']{")
    expect(css).toContain('color-scheme:light}')
  })

  it("tf's stylesheet writes no identity and no default, because the base is tf and system is a media query", () => {
    const css = productStylesheet(PRODUCTS.tf, ':root{--x:1}', '.card{}')
    expect(css).not.toContain(':root{--font')
    expect(css).not.toContain(':root:not([data-theme])')
    expect(css).toContain(":root[data-theme='night']{")
    expect(css).toContain(":root[data-theme='paper']{")
  })
})
