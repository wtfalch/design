import { defineProduct } from '../../src/products'
import { THEMES } from '../../src/themes'

/**
 * A product declared the way an app declares one, in the app's own repo.
 *
 * The palettes are valet's two as they left the package at 0.17.0, renamed,
 * because they were measured and they differ from the base in both colour and
 * identity. The mark is a filled badge, so a bound `Brand` has a fill rule to
 * draw. Nothing here is offered to anyone: it is what the tests hold the
 * product API to.
 */
export const sample = defineProduct({
  name: 'sample',
  mark: {
    view: '0 0 24 24',
    d: 'M4 0 H20 A4 4 0 0 1 24 4 V20 A4 4 0 0 1 20 24 H4 A4 4 0 0 1 0 20 V4 A4 4 0 0 1 4 0 Z M8 8 H16 V16 H8 Z',
    fill: 'evenodd',
  },
  identity: {
    '--font': '"IBM Plex Sans", sans-serif',
    '--radius-sm': '2px',
    '--radius': '4px',
    '--radius-md': '6px',
    '--radius-lg': '10px',
  },
  themes: {
    system: THEMES.system,
    sample: {
      name: 'Sample',
      note: 'Light',
      scheme: 'light',
      tokens: {
        '--bg': '#f4f5f8',
        '--panel': '#ffffff',
        '--panel-2': '#eceef3',
        '--border': '#dcdfe7',
        '--border-strong': '#7b8597',
        '--text': '#171a21',
        '--muted': '#5b6474',
        '--accent': '#4f46e5',
        '--accent-dim': '#a9a4f0',
        '--on-accent': '#ffffff',
        '--good': '#1b7f4b',
        '--warn': '#8a5f0a',
        '--bad': '#bf3a31',
        '--info': '#0e6f8e',
        '--app-bg': '#f4f5f8',
      },
    },
    'sample-night': {
      name: 'Sample Night',
      note: 'Dark',
      scheme: 'dark',
      tokens: {
        '--bg': '#0c0f14',
        '--panel': '#141820',
        '--panel-2': '#1b2029',
        '--border': '#262c37',
        '--border-strong': '#616b7d',
        '--text': '#e8eaf0',
        '--muted': '#9ba4b5',
        '--accent': '#8f88ff',
        '--accent-dim': '#3f3a8f',
        '--on-accent': '#0d0b2e',
        '--good': '#5fcb8f',
        '--warn': '#e2ae58',
        '--bad': '#f28b84',
        '--info': '#57c4e8',
        '--app-bg': '#0c0f14',
      },
    },
  },
  defaultTheme: 'sample',
})
