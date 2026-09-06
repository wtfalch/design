import type { Theme, ThemeTokens } from '../themes'
import type { Product } from './index'

/**
 * valet's two palettes.
 *
 * One hue that belongs to nothing else. The accent is an indigo, chosen so it
 * sits apart from all four status tones: good is green, warn is amber, bad is
 * red, and info is a cyan rather than a blue so a link and an information pill
 * cannot be confused at a glance. The accent is what a person acts on; the
 * tones are what the system says. They never share a colour.
 *
 * Every colour is measured, not judged: `contrast.test.ts` holds both palettes
 * to the same pairs as tf's.
 *
 * The palettes name colours and nothing else. What makes valet valet under
 * either of them -- the type and the corners -- is the identity below, on
 * `:root` in valet's stylesheet and under every palette `applyTheme` lays on.
 * Both palettes used to restate it, which is the shape that breaks the moment
 * a theme is shared between products: silent on the font, it would have fallen
 * back to tf's.
 */

const FONT =
  'var(--font-sans, "IBM Plex Sans"), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const FONT_MONO =
  'var(--font-mono, "JetBrains Mono"), ui-monospace, SFMono-Regular, Menlo, monospace'

/**
 * valet's identity: what it is under every theme.
 *
 * The fonts are named, not shipped. `--font` reads a `--font-sans` variable
 * the app defines with whatever loads its fonts, and falls back to the family
 * by name; the gallery loads both families from `gallery/public/fonts` so the
 * specimens are photographed in them. Sharper corners than the package
 * default, because a console is read in rows and columns and a large radius
 * rounds the grid away.
 */
export const VALET_IDENTITY: Partial<ThemeTokens> = {
  '--font': FONT,
  '--font-mono': FONT_MONO,
  '--radius-sm': '2px',
  '--radius': '4px',
  '--radius-md': '6px',
  '--radius-lg': '10px',
}

export const light: Theme = {
  name: 'valet',
  note: 'Light. Ink on paper, indigo where you act.',
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
    // Black shadows muddy a light surface; these carry the page's own ink.
    '--shadow-1': '0 4px 14px rgba(23, 26, 33, 0.08)',
    '--shadow-2': '0 8px 24px rgba(23, 26, 33, 0.10)',
    '--shadow-3': '0 12px 32px rgba(23, 26, 33, 0.12)',
    '--scrim': 'rgba(23, 26, 33, 0.32)',
  },
}

export const night: Theme = {
  name: 'valet night',
  note: 'Dark. The same ink, lit from behind.',
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
    // Near-black on the pale indigo, 6.46:1. White would be 2.6:1.
    '--on-accent': '#0d0b2e',
    '--good': '#5fcb8f',
    '--warn': '#e2ae58',
    '--bad': '#f28b84',
    '--info': '#57c4e8',
    '--app-bg': '#0c0f14',
    '--shadow-1': '0 6px 20px rgba(0, 0, 0, 0.28)',
    '--shadow-2': '0 8px 28px rgba(0, 0, 0, 0.34)',
    '--shadow-3': '0 10px 34px rgba(0, 0, 0, 0.38)',
    '--scrim': 'rgba(0, 0, 0, 0.5)',
  },
}

/** Keyed by the name `applyTheme` takes: `name` lowercased, spaces to hyphens. */
export const VALET_THEMES = { valet: light, 'valet-night': night } as const

/** valet, the product: its badge in `brandMarks.ts`, the identity above, the
 *  two palettes, and light until somebody picks. */
export const valet: Product = {
  name: 'valet',
  identity: VALET_IDENTITY,
  themes: VALET_THEMES,
  defaultTheme: 'valet',
}
