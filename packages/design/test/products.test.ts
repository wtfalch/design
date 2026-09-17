import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Brand from '../src/components/Brand'
import { bindProduct, defineProduct, productTheme } from '../src/products'
import { THEMES } from '../src/themes'
import { productCss, themeId } from '../src/themes/css'
import { sample } from './fixtures/product'

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

describe('a product, declared outside the package', () => {
  it('defaults to one of its own themes, keyed as applyTheme would', () => {
    expect(() => defineProduct({ ...sample, defaultTheme: 'paper' })).toThrow(/defaults to "paper"/)
    expect(() =>
      defineProduct({ ...sample, themes: { ...sample.themes, wrong: sample.themes.sample } }),
    ).toThrow(/keyed "wrong"/)
  })

  it("refuses a palette that restates the product's identity", () => {
    // The identity is the layer under the palettes. valet's two each carried
    // the same font and corner block once, and a theme shared between products
    // would have shown the base font on valet wherever it kept quiet.
    const loud = { ...sample.themes.sample, tokens: { '--radius': '20px' } }
    expect(() => defineProduct({ ...sample, themes: { ...sample.themes, sample: loud } })).toThrow(
      /restates --radius/,
    )
  })

  it('a theme as the product wears it is the palette over the identity', () => {
    const t = productTheme(sample, 'sample-night')
    expect(themeId(t)).toBe('sample-night')
    expect(t.tokens['--radius']).toBe('4px')
    expect(t.tokens['--accent']).toBe('#8f88ff')
    // a theme may still change the identity on purpose
    const loud = productTheme(sample, {
      name: 'Loud',
      note: '',
      scheme: 'light',
      tokens: { '--radius': '20px' },
    })
    expect(loud.tokens['--radius']).toBe('20px')
    expect(loud.tokens['--font']).toContain('IBM Plex Sans')
    // an id the product dropped comes up as the product's default, not the package's
    expect(productTheme(sample, 'nope').name).toBe('Sample')
  })

  it("a bound applyTheme writes the identity under the palette, so it holds without the product's CSS", () => {
    const bound = bindProduct(sample)
    const { el, props, dataset } = fakeRoot()
    bound.applyTheme(undefined, el)
    expect(dataset.theme).toBe('sample')
    expect(props.get('--radius')).toBe('4px')
    expect(props.get('--accent')).toBe('#4f46e5')
    bound.applyTheme('sample-night', el)
    expect(dataset.theme).toBe('sample-night')
    expect(props.get('--radius')).toBe('4px')
    expect(props.get('--accent')).toBe('#8f88ff')
    expect(bound.DEFAULT_THEME).toBe('sample')
    expect(Object.keys(bound.THEMES)).toEqual(['system', 'sample', 'sample-night'])
  })

  it("a bound Brand is the product's mark and name, and still takes either", () => {
    const { Brand: Bound } = bindProduct(sample)
    const own = renderToStaticMarkup(createElement(Bound))
    expect(own).toContain('fill-rule="evenodd"')
    expect(own).toContain('aria-label="sample"')
    const stroked = { view: '0 0 10 10', d: 'M1 1L9 9', stroke: 2 }
    const other = renderToStaticMarkup(createElement(Bound, { mark: stroked, title: 'other' }))
    expect(other).toContain('stroke-width="2"')
    expect(other).toContain('aria-label="other"')
  })

  it('Brand draws the mark it is handed, stroked or filled', () => {
    const html = renderToStaticMarkup(
      createElement(Brand, { mark: { view: '0 0 10 10', d: 'M1 1L9 9', stroke: 3 }, title: 'x' }),
    )
    expect(html).toContain('viewBox="0 0 10 10"')
    expect(html).toContain('stroke-width="3"')
    expect(html).toContain('<title>x</title>')
  })
})

describe('productCss', () => {
  it('writes the identity, then the default, then one rule per theme', () => {
    const css = productCss(sample)
    const at = (s: string) => {
      const i = css.indexOf(s)
      expect(i, s).toBeGreaterThan(-1)
      return i
    }
    expect(at('html:root{--font:')).toBeLessThan(at(':root:not([data-theme]){--bg:#f4f5f8;'))
    expect(at(':root:not([data-theme])')).toBeLessThan(at(":root[data-theme='sample']{"))
    expect(css).toContain(":root[data-theme='sample-night']{")
    expect(css).toContain('color-scheme:light}')
    for (const [key, value] of Object.entries(sample.themes['sample-night'].tokens)) {
      expect(css).toContain(`${key}:${value}`)
    }
  })

  it('beats tokens.css with the identity and loses to a theme, wherever the app puts it', () => {
    // Specificity, not order: `html:root` is (0,1,1), the base `:root` is
    // (0,1,0) and a theme's `:root[data-theme]` is (0,2,0). The package used
    // to write the identity as `:root` and win by coming second in one file
    // it built; an app placing a string cannot promise second.
    expect(productCss(sample)).not.toMatch(/(^|\n):root\{/)
  })

  it('writes no identity, no default and no rule for system when there is nothing to say', () => {
    const plain = defineProduct({
      ...sample,
      identity: {},
      themes: { system: THEMES.system },
      defaultTheme: 'system',
    })
    expect(productCss(plain)).toBe('')
  })
})
