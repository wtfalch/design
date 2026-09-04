/**
 * The package's front door.
 *
 * Components land here in phase 3, one export per file, alphabetically — the
 * order is not a hierarchy and pretending otherwise invites an argument about
 * where a new one goes.
 *
 * The theme API is re-exported rather than kept behind `@wtfalch/design/themes`
 * alone, because the first thing a consumer does is apply a theme, and making
 * that a second import path is a papercut on the one call everybody makes. The
 * subpath stays for the case that wants the vocabulary and none of the
 * components — theming an iframe, or a canvas that cannot read a CSS variable.
 */

export {
  applyTheme,
  DEFAULT_THEME,
  defineTheme,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  isTheme,
  resolvedTokens,
  THEMES,
  TOKEN_KEYS,
} from './themes'
export type { Theme, ThemeTokens } from './themes'
