import type { Theme } from './index'

/**
 * A theme as CSS, for the paint before React.
 *
 * `applyTheme` writes a theme as inline custom properties at run time, and
 * React mounts after the first paint, so a theme applied in an effect flashes
 * the base palette. A consumer wants the same values as a stylesheet rule it
 * can ship in `<head>`, and it must not write that rule by hand, because a
 * copy drifts from the object the contrast test measures. So the rule is
 * generated from the object: at build time for the products here, or by a
 * consumer for a theme of its own.
 *
 * The selector is `:root[data-theme='<id>']`, the attribute `applyTheme` sets,
 * so the two mechanisms agree on which theme is on. A theme with no tokens,
 * which is `system`, gets no block: its palette is the base, and its light
 * half is the `prefers-color-scheme` block `base.css` scopes to it.
 *
 * No imports but a type, on purpose: `build-themes.mjs` loads the compiled
 * copy of this file in plain Node, which cannot follow the package's
 * extensionless relative imports.
 */

/** The name `applyTheme` derives for a theme object. */
export function themeId(theme: Theme): string {
  return theme.name.toLowerCase().replace(/\s+/g, '-')
}

export function themeCss(id: string, theme: Theme): string {
  const entries = Object.entries(theme.tokens)
  if (entries.length === 0) return ''
  const rules = entries.map(([key, value]) => `${key}:${value}`).join(';')
  return `:root[data-theme='${id}']{${rules};color-scheme:${theme.scheme}}`
}

/** Every theme of one product, one rule each, ids checked against the names. */
export function productCss(themes: Record<string, Theme>): string {
  return Object.entries(themes)
    .map(([id, theme]) => {
      if (themeId(theme) !== id) {
        throw new Error(
          `theme "${theme.name}" is keyed "${id}", but applyTheme calls it "${themeId(theme)}"`,
        )
      }
      return themeCss(id, theme)
    })
    .filter(Boolean)
    .join('\n')
}
