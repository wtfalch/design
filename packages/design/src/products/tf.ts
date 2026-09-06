import type { Theme, ThemeTokens } from '../themes'
import type { Product } from './index'

/**
 * tf's themes: the three the package shipped with, and the ones the gallery
 * was photographed in first.
 *
 * `system` is a theme, not a mode. A `prefers-color-scheme` block that
 * overrides `:root` unconditionally means choosing a dark theme on a
 * light-mode laptop gets silently repainted; that media query is scoped to
 * this theme in `base.css`, so following the OS is a choice among the others
 * rather than a rule above them.
 */
export const system: Theme = {
  name: 'System',
  note: 'Follows your OS between light and dark',
  scheme: 'dark',
  // Empty on purpose: this is the one theme that must *not* state a palette,
  // because the `prefers-color-scheme` block is scoped to it and needs the
  // base values to fall through. Its swatch is a special case.
  tokens: {},
}

/**
 * The dark palette, written out rather than inherited.
 *
 * `night` was `tokens: {}` once, "whatever the base is", and that was wrong
 * twice over. It made the theme depend on a file it does not own, and it made
 * its swatch in the picker preview *the theme currently applied*, because an
 * empty map falls back to the live values.
 */
const NIGHT: Partial<ThemeTokens> = {
  '--bg': '#0f1115',
  '--panel': '#161a21',
  '--panel-2': '#1c222b',
  '--border': '#262d38',
  '--text': '#e6e9ef',
  '--muted': '#8b94a4',
  '--accent': '#5b9dff',
  '--accent-dim': '#2a4877',
  /* No `--on-accent` here on purpose, so it inherits the base near-black.
     Night used to set `#ffffff`, which is 2.72:1 on this accent -- the exact
     pair `tokens.css` records as the reason the token exists at all. The base
     was fixed and the theme carrying the old palette was never revisited, so
     the primary button in the app's fixed dark theme failed the body-text
     minimum by a wide margin for as long as the token had been "fixed".
     `#06181a` on `#5b9dff` is 6.69:1. Found by the contrast scan, which is the
     argument for shipping the measurement rather than the rule. */
  '--app-bg': '#0f1115',
}

export const night: Theme = {
  name: 'Night',
  note: 'The dark palette, fixed — ignores the OS',
  scheme: 'dark',
  tokens: NIGHT,
}

export const paper: Theme = {
  name: 'Paper',
  note: 'Light, with shadows that suit it',
  scheme: 'light',
  tokens: {
    '--bg': '#f6f7f9',
    '--panel': '#ffffff',
    '--panel-2': '#f0f2f5',
    '--border': '#e4e8ec',
    '--border-strong': '#8792a1',
    '--text': '#191d23',
    '--muted': '#5d6773',
    '--accent': '#0e7872',
    '--accent-dim': '#7fbdb8',
    '--on-accent': '#ffffff',
    // The base set is tuned for a dark panel. Unoverridden, `--good` was
    // 1.74:1 on white -- a `running` pill nobody could read.
    '--good': '#1c7a4a',
    '--warn': '#8a6216',
    '--bad': '#b3312c',
    // `#2f7fe6` was 3.96:1 on this theme's white panel -- the "information is
    // blue" colour was measured on the dark base when it was added and never
    // on a light one. Found by contrast.test.ts on its first run. This is the
    // lightest step on the same hue that clears 4.5:1 on the panel *and* the
    // page, with room: 5.24 on white, 4.88 on the page.
    '--info': '#216bc9',
    // Black shadows are right on a dark UI and muddy on a light one. This is
    // the whole reason elevation had to become a token.
    '--shadow-1': '0 4px 14px rgba(16, 24, 40, 0.08)',
    '--shadow-2': '0 8px 24px rgba(16, 24, 40, 0.10)',
    '--shadow-3': '0 12px 32px rgba(16, 24, 40, 0.12)',
    '--scrim': 'rgba(16, 24, 40, 0.32)',
  },
}

/** Keyed by the name `applyTheme` takes, which is `name` lowercased. */
export const TF_THEMES = { system, night, paper } as const

/**
 * tf, the product.
 *
 * Its identity is empty on purpose: `tokens.css` carries tf's font, shape and
 * density as the base values, so there is nothing to lay over them. `system`
 * is the default because following the OS is the choice a tool open all day
 * should make for you -- and because it is a `prefers-color-scheme` rule
 * rather than a palette, tf's stylesheet writes no default on `:root`; tf sets
 * `data-theme` before the bundle loads, as it always has.
 */
export const tf: Product = {
  name: 'tf',
  identity: {},
  themes: TF_THEMES,
  defaultTheme: 'system',
}
