/**
 * The themes, and the vocabulary they are allowed to speak.
 *
 * A theme is a `Partial<ThemeTokens>`: name the tokens you change, inherit the
 * rest from `tokens.css`. Without that, every theme is a forty-six line chore
 * and every token added later means editing all of them.
 *
 * The type is the enforcement. A typo in a token name is a compile error rather
 * than a property that silently does nothing — which is exactly the failure a
 * string-keyed map would produce, at run time, invisibly. That property is the
 * reason this file is exported from the package at all: a consumer writing a
 * theme gets the same compile error tf gets, and a theme that ships as JSON or
 * as a hand-written CSS file does not.
 *
 * ---
 *
 * **A token is themeable, derived, or fixed, and the three are separate lists.**
 *
 * The old contract had one list, and it had drifted from the stylesheet in both
 * directions: it declared `--pad-1`…`--pad-5`, which `tokens.css` stopped
 * defining when the spacing scale was renamed to `--space-*`, so five keys a
 * theme could name resolved to nothing at all. And it named none of the sixteen
 * derived tokens, so there was no way to tell a token deliberately withheld
 * from a token somebody forgot.
 *
 * Splitting the list is what makes that a decision rather than an omission:
 *
 * - **themeable** — a theme may set it. Forty-six of them.
 * - **derived** — computed from a themeable token, and a theme must NOT set it.
 *   `--text-*` are `calc()` off `--font-size` and `--space-*` are `calc()` off
 *   `--density`, so overriding one step with a literal is how you get a type
 *   scale that no longer scales. Move the input, not the output.
 * - **fixed** — not themeable at all. Geometry other things are measured
 *   against, and one glyph.
 *
 * `tokens.test.ts` holds all three to `tokens.css` in both directions, so a
 * token added to the stylesheet and to no list fails the suite rather than
 * becoming a fourth, undocumented category.
 */

/** Every token a theme may set. */
export interface ThemeTokens {
  /* ---- colour ------------------------------------------------------- */
  '--bg': string
  '--panel': string
  '--panel-2': string
  '--border': string
  /** A control's outline, which WCAG 1.4.11 wants at 3:1 — a different job
   *  from `--border`, which draws hairline dividers and has no minimum. They
   *  shared a value once and it could only ever be right for one of them. */
  '--border-strong': string
  '--text': string
  '--muted': string
  '--accent': string
  '--accent-dim': string
  '--good': string
  '--warn': string
  '--bad': string
  '--info': string
  /** Text that sits *on* the accent. Never assume white: on a pale accent a
   *  primary button vanishes into its own background. */
  '--on-accent': string

  /* ---- surface ------------------------------------------------------ */
  /** Consumed as `background:`, never `background-color:`, so a theme may hand
   *  it a gradient or an image rather than only a colour. */
  '--app-bg': string
  /** A slot. Inert unless a theme fills it — this is how a theme gets a grain,
   *  a vignette or a wash without shipping a rule to create the layer. */
  '--app-overlay': string
  '--app-overlay-opacity': string
  /** The surface a control sits on. Derived from the panel tones by default,
   *  and settable, the same bargain `--app-bg` makes. */
  '--control': string
  /** The paper an illustration is drawn on; its ink takes `currentColor`. */
  '--illo-paper': string
  '--shadow-1': string
  '--shadow-2': string
  '--shadow-3': string
  '--scrim': string

  /* ---- typography --------------------------------------------------- */
  '--font': string
  '--font-mono': string
  /** The one input to the type scale. Every `--text-*` step is `calc()` off
   *  this, so moving it moves all seven together. */
  '--font-size': string
  '--line-height': string
  '--tracking': string
  '--weight': string
  '--weight-strong': string

  /* ---- shape -------------------------------------------------------- */
  '--radius-sm': string
  '--radius': string
  '--radius-md': string
  '--radius-lg': string
  '--radius-pill': string
  '--border-width': string

  /* ---- density ------------------------------------------------------ */
  /** The one input to the spacing scale. Every `--space-*` step is `calc()`
   *  off this, so a theme can be roomy or tight without restating a single
   *  padding. */
  '--density': string

  /* ---- motion ------------------------------------------------------- */
  '--dur-fast': string
  '--dur-md': string
  '--dur-slow': string
  '--dur-drag': string
  '--ease': string
  '--ease-out': string
  '--ease-spring': string

  /* ---- interaction -------------------------------------------------- */
  '--hover-lift': string
  '--hover-scale': string
  '--press-scale': string
  /** How much darker a control goes while pressed: the share of `--text` mixed
   *  into its hover colour. One number, so a button, a row and a tab press the
   *  same amount. */
  '--press-ink': string
  '--focus-ring': string
}

/**
 * Computed from a themeable token, and not settable.
 *
 * A theme that sets `--text-lg` directly gets a scale with a step that no
 * longer moves when `--font-size` does, which is the same as having no scale.
 * Move `--font-size` and `--density`; these follow.
 */
export const DERIVED_TOKENS = [
  '--text-2xs',
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-md',
  '--text-lg',
  '--text-xl',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--space-10',
  '--space-15',
] as const

/**
 * Not themeable, and each for its own reason.
 *
 * `--tile-control` is geometry other things are measured against — a panel head
 * without a cog has to be the same height as one with, or the content below it
 * gets a different remainder.
 *
 * `--nudge` is optical alignment, not spacing: a 2px offset that nudges a glyph
 * off a baseline does not scale with density, because the glyph did not.
 *
 * `--tick-mask` is the checkmark, drawn once as a mask so whatever wears it
 * supplies its own colour. It stays fixed because an arbitrary SVG data URI
 * from a theme is a theme shipping markup, which is the one thing the whole
 * design refuses.
 */
export const FIXED_TOKENS = ['--tile-control', '--nudge', '--tick-mask'] as const

/**
 * The themeable vocabulary, at run time.
 *
 * `ThemeTokens` is a type and disappears at compile time, but applying a theme
 * — or sending one into an applet's frame — means enumerating the keys with the
 * program running. The check below keeps the two from drifting: adding a token
 * to the interface without adding it here is a compile error, which is the same
 * bargain the interface itself makes.
 */
export const TOKEN_KEYS = [
  '--bg',
  '--panel',
  '--panel-2',
  '--border',
  '--border-strong',
  '--text',
  '--muted',
  '--accent',
  '--accent-dim',
  '--good',
  '--warn',
  '--bad',
  '--info',
  '--on-accent',
  '--app-bg',
  '--app-overlay',
  '--app-overlay-opacity',
  '--control',
  '--illo-paper',
  '--shadow-1',
  '--shadow-2',
  '--shadow-3',
  '--scrim',
  '--font',
  '--font-mono',
  '--font-size',
  '--line-height',
  '--tracking',
  '--weight',
  '--weight-strong',
  '--radius-sm',
  '--radius',
  '--radius-md',
  '--radius-lg',
  '--radius-pill',
  '--border-width',
  '--density',
  '--dur-fast',
  '--dur-md',
  '--dur-slow',
  '--dur-drag',
  '--ease',
  '--ease-out',
  '--ease-spring',
  '--hover-lift',
  '--hover-scale',
  '--press-scale',
  '--press-ink',
  '--focus-ring',
] as const

// Compile error if a token exists in the type and not in the list above.
const _covers: Exclude<keyof ThemeTokens, (typeof TOKEN_KEYS)[number]> extends never
  ? true
  : never = true
void _covers

// And the other direction, which the old check did not have: a key in the list
// that the type does not declare.
const _exact: Exclude<(typeof TOKEN_KEYS)[number], keyof ThemeTokens> extends never ? true : never =
  true
void _exact

export interface Theme {
  /** What the picker calls it. */
  name: string
  /** One line, shown under the name. */
  note: string
  /**
   * Whether the palette reads light or dark, for `color-scheme`.
   *
   * Native controls and scrollbars follow this. Getting it wrong gives you a
   * white scrollbar down a black page, and there is no other signal that tells
   * the browser which way round the page is.
   */
  scheme: 'light' | 'dark'
  tokens: Partial<ThemeTokens>
}

/**
 * Declare a theme.
 *
 * The only thing this adds over an object literal is that the literal is
 * checked *at the point it is written* rather than wherever it is first used —
 * so a consumer gets the red squiggle under the typo, not under the import.
 */
export function defineTheme(theme: Theme): Theme {
  return theme
}

/**
 * The dark palette, written out rather than inherited.
 *
 * `night` was `tokens: {}` once — "whatever the base is" — and that was wrong
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

/**
 * The built-ins, which are **examples and not the menu**.
 *
 * tf ships these four; an app that installs this package is expected to bring
 * its own and is not expected to look like tf. They are here because a package
 * that ships a token vocabulary and no theme written in it leaves the first
 * consumer guessing at how wide the vocabulary really is — and because the
 * contrast test needs something concrete to measure.
 *
 * `system` is a theme, not a mode. A `prefers-color-scheme` block that
 * overrides `:root` unconditionally means choosing a dark theme on a
 * light-mode laptop gets silently repainted; that media query is scoped to this
 * theme, so following the OS is a choice among the others rather than a rule
 * above them.
 */
export const THEMES: Record<string, Theme> = {
  system: {
    name: 'System',
    note: 'Follows your OS between light and dark',
    scheme: 'dark',
    // Empty on purpose: this is the one theme that must *not* state a palette,
    // because the `prefers-color-scheme` block is scoped to it and needs the
    // base values to fall through. Its swatch is a special case.
    tokens: {},
  },

  night: {
    name: 'Night',
    note: 'The dark palette, fixed — ignores the OS',
    scheme: 'dark',
    tokens: NIGHT,
  },

  paper: {
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
  },
}

export const DEFAULT_THEME = 'system'

export function isTheme(name: unknown): name is string {
  return typeof name === 'string' && name in THEMES
}

/**
 * Put a theme on an element.
 *
 * **The element is an argument, and that is the whole difference between this
 * and the version that lived in the app.** tf owns its document, so writing to
 * `documentElement` was free. A package does not: mounted inside a page it did
 * not build, it has to be able to theme a subtree and leave the rest alone.
 * Defaulting to `documentElement` keeps the app case a no-op.
 *
 * Every themeable key is written, including the ones the theme did not name —
 * cleared to `''` so they fall back to `tokens.css`. Setting only what a theme
 * declares leaves the *previous* theme's values behind on every key it happens
 * not to mention, which reads as two themes at once and is very hard to see.
 */
export function applyTheme(
  theme: string | Theme,
  el: HTMLElement = document.documentElement,
): void {
  /* A registered name, or a `Theme` object straight from `defineTheme`.
     The second is how an app that is not tf applies its own palette without
     first pushing it into a registry it does not own -- `THEMES` is the
     built-ins, and a consumer's theme is theirs. */
  const resolved = typeof theme === 'string' ? (THEMES[theme] ?? THEMES[DEFAULT_THEME]) : theme
  const name = typeof theme === 'string' ? theme : resolved.name.toLowerCase().replace(/\s+/g, '-')
  for (const key of TOKEN_KEYS) {
    const value = resolved.tokens[key]
    if (value === undefined) el.style.removeProperty(key)
    else el.style.setProperty(key, value)
  }
  el.dataset.theme = name
  el.style.colorScheme = resolved.scheme
}

/**
 * The theme as *values*, resolved against the document.
 *
 * A theme is a sparse map, so reading it tells you what it overrode rather than
 * what is on screen. Anything that has to send the palette somewhere it cannot
 * follow a CSS variable — an applet's canvas, a chart library, a screenshot
 * runner — needs the resolved set instead.
 */
export function resolvedTokens(el: HTMLElement = document.documentElement): Partial<ThemeTokens> {
  const style = getComputedStyle(el)
  const out: Record<string, string> = {}
  for (const key of TOKEN_KEYS) out[key] = style.getPropertyValue(key).trim()
  return out as Partial<ThemeTokens>
}
