import type { Theme, ThemeTokens } from './index'

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
 * No imports but a type, on purpose: `build-products.mjs` loads the compiled
 * copy of this file in plain Node, which cannot follow the package's
 * extensionless relative imports.
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

/**
 * A product's stylesheet, whole: the one file a site imports.
 *
 * In cascade order: the vocabulary; the product's identity on `:root`, so it
 * wins over the base values by coming later at the same specificity; the
 * default theme on `:root:not([data-theme])`, so the first paint is right with
 * no attribute at all; the components; and one rule per theme. A default with
 * no tokens -- tf's `system`, which is a media query rather than a palette --
 * writes no default rule, and neither does an empty identity.
 *
 * Structural, not typed to `Product`: that type lives beside the React
 * binding, and this module has to stay loadable in plain Node for the build.
 */
export function productStylesheet(
  product: {
    name: string
    identity: Partial<ThemeTokens>
    themes: Record<string, Theme>
    defaultTheme: string
  },
  tokens: string,
  components: string,
): string {
  const parts = ['/* ---- tokens.css ---- */', tokens.trimEnd()]
  const identity = declarations(product.identity)
  if (identity) {
    parts.push(
      `/* ---- ${product.name}: the identity, under every theme ---- */`,
      `:root{${identity}}`,
    )
  }
  const fallback = product.themes[product.defaultTheme]
  if (!fallback) {
    throw new Error(
      `product "${product.name}" defaults to "${product.defaultTheme}", which is not one of its themes`,
    )
  }
  const rules = declarations(fallback.tokens)
  if (rules) {
    parts.push(
      `/* ---- ${product.name}: ${product.defaultTheme}, until a theme is picked ---- */`,
      `:root:not([data-theme]){${rules};color-scheme:${fallback.scheme}}`,
    )
  }
  parts.push(
    '/* ---- styles.css ---- */',
    components.trimEnd(),
    `/* ---- ${product.name}: the themes ---- */`,
    productCss(product.themes),
  )
  return `${parts.join('\n')}\n`
}
