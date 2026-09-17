import type { Theme, ThemeTokens } from './index'

/**
 * A theme as CSS, for the paint before React.
 *
 * `applyTheme` writes a theme as inline custom properties at run time, and
 * React mounts after the first paint, so a theme applied in an effect flashes
 * the base palette. A consumer wants the same values as a stylesheet rule it
 * can ship in `<head>`, and it must not write that rule by hand, because a
 * copy drifts from the object the contrast test measures. So the rule is
 * generated from the object, by the app that owns the theme.
 *
 * The selector is `:root[data-theme='<id>']`, the attribute `applyTheme` sets,
 * so the two mechanisms agree on which theme is on. A theme with no tokens,
 * which is `system`, gets no block: its palette is the base, and its light
 * half is the `prefers-color-scheme` block `base.css` scopes to it.
 *
 * It imports nothing but types, so it loads in plain Node: an app can write
 * its rules to a file at build time as well as into a `<style>` at run time.
 */

/** The name `applyTheme` derives for a theme object. */
export function themeId(theme: Theme): string {
  return theme.name.toLowerCase().replace(/\s+/g, '-')
}

/** The declarations of a token map, as one line. */
function declarations(tokens: Partial<ThemeTokens>): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

export function themeCss(id: string, theme: Theme): string {
  const rules = declarations(theme.tokens)
  if (!rules) return ''
  return `:root[data-theme='${id}']{${rules};color-scheme:${theme.scheme}}`
}

/**
 * A product's rules, whole: what an app puts on the page beside
 * `tokens.css` and `styles.css`.
 *
 * Three parts. The identity, under `html:root`: one element above the
 * `:root` in `tokens.css`, so it wins over the base values wherever the app's
 * bundler puts this string, and one class-level below a theme, so a theme may
 * still change the identity on purpose. The default theme on
 * `:root:not([data-theme])`, so the first paint is right with no attribute at
 * all. Then one rule per theme. A default with no tokens -- `system`, which is
 * a media query rather than a palette -- writes no default rule, and neither
 * does an empty identity.
 *
 * Until 0.17.0 the package wrote this at build time for the products it held,
 * as `dist/<name>.css` with the tokens and the components around it, and the
 * identity was a plain `:root` that won by coming second. A string an app
 * places itself cannot count on its position, so the selector carries the
 * order instead. A Next layout puts it in a `<style>` in `<head>`; a single
 * page app injects it before it renders.
 *
 * Structural, not typed to `Product`: that type lives beside the React
 * binding, and this module stays loadable without React.
 */
export function productCss(product: {
  name: string
  identity: Partial<ThemeTokens>
  themes: Record<string, Theme>
  defaultTheme: string
}): string {
  const parts: string[] = []
  const identity = declarations(product.identity)
  if (identity) parts.push(`html:root{${identity}}`)
  const fallback = product.themes[product.defaultTheme]
  if (!fallback) {
    throw new Error(
      `product "${product.name}" defaults to "${product.defaultTheme}", which is not one of its themes`,
    )
  }
  const rules = declarations(fallback.tokens)
  if (rules) parts.push(`:root:not([data-theme]){${rules};color-scheme:${fallback.scheme}}`)
  for (const [id, theme] of Object.entries(product.themes)) {
    if (themeId(theme) !== id) {
      throw new Error(
        `theme "${theme.name}" is keyed "${id}", but applyTheme calls it "${themeId(theme)}"`,
      )
    }
    const rule = themeCss(id, theme)
    if (rule) parts.push(rule)
  }
  return parts.join('\n')
}
