/**
 * The product the gallery wears: a stand-in for an app's.
 *
 * Until 0.17.0 the package held otf's three themes and valet's two, and the
 * gallery photographed them. The themes and marks moved to the apps that wear
 * them, and the gallery kept copies of what it photographs -- night, paper
 * and the two marks -- as fixtures, so the baselines taken before the move
 * still answer whether a component moved a pixel. They are not offers, the
 * way `brand.ts` is not. otf's copies in otf are the ones that change.
 */
import { THEMES, type Theme, type ThemeTokens, defineProduct } from '@wtfalch/design'

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

/** A stroked mark and a filled one: otf's and valet's, as they left the package. */
export const MARKS = {
  /** A lowercase tf merged into an O, in one unbroken stroke. Both ends of
   *  the tf start on the O -- the crossbar runs left and folds down onto it,
   *  the stem runs up and turns right onto it -- and the 95 degrees of ring
   *  between those two points is left out, so the O reads as open across the
   *  top left rather than closed. One stroke, no loose ends. The view is the
   *  stroke's outer bounds, not the canvas: the stroke is 96 wide, so 48 of
   *  cap and arc on every side is already in these. */
  otf: {
    view: '69.3 -12.2 958.4 958.4',
    d: 'M470.2 43.0A120 120 0 0 0 372 161.0V620A100 100 0 0 0 572 620V330A92 92 0 0 1 756 330A100 100 0 0 1 656 430H248.6A120 120 0 0 0 132.9 582.0A431.2 431.2 0 1 0 470.2 43.0',
    stroke: 96,
  },
  /** valet's badge. The rounded square is the jacket, the shirt is cut out of
   *  it in an open collar that runs to the top edge, and the bow tie floats in
   *  the shirt just below the collar. One path under `evenodd` with five
   *  subpaths -- the jacket, the shirt, two wings and the knot -- so the shirt
   *  is a hole the surface shows through and the bow is drawn back inside it.
   *  Drawn 24-first, which is the header size: the 60 units of jacket over the
   *  bow are the pixel that keeps it a bow rather than a notch in the edge, and
   *  the collar rolls outward at the top so the shirt reads as lapels rather
   *  than a V. The view is the canvas, because the jacket fills it. */
  valet: {
    view: '0 0 1024 1024',
    d: 'M236 0 H788 A236 236 0 0 1 1024 236 V788 A236 236 0 0 1 788 1024 H236 A236 236 0 0 1 0 788 V236 A236 236 0 0 1 236 0 Z M234.2 0 L789.8 0 A16 16 0 0 1 805 21.1 C843.3 285.6 625.5 464.7 578.4 700.8 A70 70 0 0 1 445.6 700.8 C398.5 464.7 180.7 285.6 219 21.1 A16 16 0 0 1 234.2 0 Z M444 164.5 C376 162.7 327.4 127.5 322 127.5 A40 40 0 0 0 282 167.5 L282 272.5 A40 40 0 0 0 322 312.5 C327.4 312.5 376 277.4 444 275.5 Z M580 164.5 C648 162.7 696.6 127.5 702 127.5 A40 40 0 0 1 742 167.5 L742 272.5 A40 40 0 0 1 702 312.5 C696.6 312.5 648 277.4 580 275.5 Z M512 60 A68 68 0 0 1 580 128 V232 A68 68 0 0 1 512 300 A68 68 0 0 1 444 232 V128 A68 68 0 0 1 512 60 Z',
    fill: 'evenodd',
  },
} as const

export const galleryProduct = defineProduct({
  name: 'gallery',
  mark: MARKS.otf,
  identity: {},
  themes: { system: THEMES.system, night, paper },
  defaultTheme: 'system',
})
