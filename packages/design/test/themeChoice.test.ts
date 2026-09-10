import { describe, expect, it } from 'vitest'

import { PRODUCTS } from '../src/products'
import { THEME_STORAGE_KEY, themeChoiceScript, themeChoices } from '../src/themes/choice'

/**
 * The script is a string that runs before anything else on the page, so it
 * cannot be typechecked where it is written and a mistake in it is a page
 * that renders unthemed. These are the checks the three hand-written copies
 * never had.
 */
describe('themeChoiceScript', () => {
  it('offers every theme the product declares, in order', () => {
    expect(themeChoices('tf').map((c) => c.id)).toEqual(Object.keys(PRODUCTS.tf.themes))
    expect(themeChoices('valet').map((c) => c.id)).toEqual(Object.keys(PRODUCTS.valet.themes))
  })

  it('labels a choice with the theme’s own name, rather than a second copy', () => {
    for (const c of themeChoices('tf')) {
      expect(c.label).toBe(PRODUCTS.tf.themes[c.id].name)
    }
  })

  it('drops an id the product does not have, rather than throwing at first paint', () => {
    expect(themeChoices('tf', ['night', 'sepia']).map((c) => c.id)).toEqual(['night'])
  })

  it('falls back to an id it actually offers', () => {
    /* The bug worth keeping from the hand-written copies: a browser holding
       `sepia` from a palette the app dropped must not render unthemed. */
    const script = themeChoiceScript('tf', { only: ['night'] })
    expect(script).toContain('["night"]')
    expect(script).toContain('"night"')
    expect(script).not.toContain('"system"')
  })

  it('names the shared key by default and takes an override', () => {
    expect(themeChoiceScript('tf')).toContain(JSON.stringify(THEME_STORAGE_KEY))
    expect(themeChoiceScript('tf', { storageKey: 'valet-theme' })).toContain('"valet-theme"')
  })

  it('survives a browser that throws on localStorage', () => {
    const script = themeChoiceScript('tf')
    expect(script).toContain('try{')
    expect(script).toContain('catch(e){}')
  })

  it('runs, and writes the stored id when the app offers it', () => {
    const run = (stored: string | null) => {
      const el = { dataset: {} as Record<string, string> }
      const localStorage = { getItem: () => stored }
      new Function('document', 'localStorage', themeChoiceScript('tf'))(
        { documentElement: el },
        localStorage,
      )
      return el.dataset.theme
    }
    expect(run('night')).toBe('night')
    expect(run('paper')).toBe('paper')
    expect(run('sepia')).toBe(PRODUCTS.tf.defaultTheme)
    expect(run(null)).toBe(PRODUCTS.tf.defaultTheme)
  })

  it('runs to the default when localStorage throws', () => {
    const el = { dataset: {} as Record<string, string> }
    new Function('document', 'localStorage', themeChoiceScript('valet'))(
      { documentElement: el },
      {
        getItem() {
          throw new Error('site data blocked')
        },
      },
    )
    expect(el.dataset.theme).toBeUndefined()
  })
})
