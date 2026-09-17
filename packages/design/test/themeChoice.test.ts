import { describe, expect, it } from 'vitest'

import { THEME_STORAGE_KEY, themeChoiceScript, themeChoices } from '../src/themes/choice'
import { sample } from './fixtures/product'

/**
 * The script is a string that runs before anything else on the page, so it
 * cannot be typechecked where it is written and a mistake in it is a page
 * that renders unthemed. These are the checks the three hand-written copies
 * never had.
 */
describe('themeChoiceScript', () => {
  it('offers every theme the product declares, in order', () => {
    expect(themeChoices(sample).map((c) => c.id)).toEqual(['system', 'sample', 'sample-night'])
  })

  it('labels a choice with the theme’s own name, rather than a second copy', () => {
    for (const c of themeChoices(sample)) {
      expect(c.label).toBe(sample.themes[c.id].name)
    }
  })

  it('drops an id the product does not have, rather than throwing at first paint', () => {
    expect(themeChoices(sample, ['sample-night', 'sepia']).map((c) => c.id)).toEqual([
      'sample-night',
    ])
  })

  it('falls back to an id it actually offers', () => {
    /* The bug worth keeping from the hand-written copies: a browser holding
       `sepia` from a palette the app dropped must not render unthemed. */
    const script = themeChoiceScript(sample, { only: ['sample-night'] })
    expect(script).toContain('["sample-night"]')
    expect(script).not.toContain('"system"')
    expect(script).not.toContain('"sample"')
  })

  it('names the shared key by default and takes an override', () => {
    expect(themeChoiceScript(sample)).toContain(JSON.stringify(THEME_STORAGE_KEY))
    expect(themeChoiceScript(sample, { storageKey: 'app-theme' })).toContain('"app-theme"')
  })

  it('survives a browser that throws on localStorage', () => {
    const script = themeChoiceScript(sample)
    expect(script).toContain('try{')
    expect(script).toContain('catch(e){}')
  })

  it('runs, and writes the stored id when the app offers it', () => {
    const run = (stored: string | null) => {
      const el = { dataset: {} as Record<string, string> }
      const localStorage = { getItem: () => stored }
      new Function('document', 'localStorage', themeChoiceScript(sample))(
        { documentElement: el },
        localStorage,
      )
      return el.dataset.theme
    }
    expect(run('sample-night')).toBe('sample-night')
    expect(run('system')).toBe('system')
    expect(run('sepia')).toBe(sample.defaultTheme)
    expect(run(null)).toBe(sample.defaultTheme)
  })

  it('runs to the default when localStorage throws', () => {
    const el = { dataset: {} as Record<string, string> }
    new Function('document', 'localStorage', themeChoiceScript(sample))(
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
