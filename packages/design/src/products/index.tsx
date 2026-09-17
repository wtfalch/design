import type { ComponentProps } from 'react'
import BrandDefault from '../components/Brand'
import type { Mark } from '../components/brandMarks'
import { type Theme, type ThemeTokens, applyTheme } from '../themes'
import { themeId } from '../themes/css'

/**
 * A product: the layer between the system and a theme.
 *
 * Three layers, each falling back to the one under it. The system is the
 * components, the base values in `tokens.css`, the shared icons and
 * illustrations. The product is its mark and its identity -- the tokens that
 * make it itself under every theme: font, shape, density -- plus the themes it
 * offers and the one it wears until somebody picks. The theme is a palette and
 * a colour scheme, and anything else it deliberately changes.
 *
 * The middle layer is what lets a theme be shared between products. A theme
 * is a sparse map, and what it is sparse *over* decides what a silent token
 * shows: over the base it shows the base, over the product it shows the
 * product. Before this layer valet's two palettes each restated valet's font
 * and corners, because there was nowhere else to put them.
 *
 * **A product lives in its own repo.** From 0.3.0 to 0.16.2 otf and valet were
 * declared here, and each shipped as a package entry and a stylesheet. Every
 * new surface brought its own palette, and every palette became a release of
 * this package and a pin bump in every app. An app now declares its product
 * with `defineProduct`, binds it with `bindProduct`, puts `productCss` on the
 * page, and measures its palettes with `contrastFailures`. The package keeps
 * one theme of its own, `system`, because its light half is a rule in the
 * package's stylesheet.
 */
export interface Product {
  /** What a screen reader calls the mark, and the name in an error. */
  name: string
  /** The path `Brand` draws. */
  mark: Mark
  /** Under every palette, whether the palette comes from `productCss` or from
   *  a bound `applyTheme`. Empty for a product the base values already
   *  describe. */
  identity: Partial<ThemeTokens>
  /** Keyed by the id `applyTheme` takes. */
  themes: Record<string, Theme>
  /** Worn until somebody picks; written on `:root` when no `data-theme` is set. */
  defaultTheme: string
}

/**
 * Declare a product, so a mistake is an error where it is written: a default
 * that is not one of its themes, a key `applyTheme` would not use, or a
 * palette that restates the identity. The last one was a test over the
 * products in this package; with the products elsewhere, the declaration is
 * the only place left that sees every one.
 */
export function defineProduct(product: Product): Product {
  if (!(product.defaultTheme in product.themes)) {
    throw new Error(
      `product "${product.name}" defaults to "${product.defaultTheme}", which is not one of its themes`,
    )
  }
  for (const [id, theme] of Object.entries(product.themes)) {
    if (themeId(theme) !== id) {
      throw new Error(
        `theme "${theme.name}" is keyed "${id}", but applyTheme calls it "${themeId(theme)}"`,
      )
    }
    for (const key of Object.keys(theme.tokens)) {
      if (key in product.identity) {
        throw new Error(`theme "${theme.name}" restates ${key}, which is the product's identity`)
      }
    }
  }
  return product
}

/**
 * A theme as the product wears it: the palette over the identity.
 *
 * An id the product does not offer resolves to the product's default rather
 * than the package's, so a valet setting that remembers a theme valet has
 * since dropped comes up as valet, not as the base.
 */
export function productTheme(
  product: Product,
  theme: string | Theme = product.defaultTheme,
): Theme {
  const resolved =
    typeof theme === 'string'
      ? (product.themes[theme] ?? product.themes[product.defaultTheme])
      : theme
  return { ...resolved, tokens: { ...product.identity, ...resolved.tokens } }
}

type BrandProps = Partial<ComponentProps<typeof BrandDefault>>

/**
 * The package, as one product.
 *
 * `Brand` defaults to the product's mark and name, and still takes either.
 * `applyTheme` resolves against the product's themes and writes the identity
 * under the palette, so it holds even where `productCss` is not on the page.
 * An app binds its product once, in one module, and imports its `Brand`,
 * `THEMES` and `applyTheme` from there.
 */
export function bindProduct(product: Product) {
  function Brand(props: BrandProps) {
    return (
      <BrandDefault
        {...props}
        mark={props.mark ?? product.mark}
        title={props.title ?? product.name}
      />
    )
  }
  return {
    product,
    Brand,
    THEMES: product.themes,
    DEFAULT_THEME: product.defaultTheme,
    applyTheme: (theme: string | Theme = product.defaultTheme, el?: HTMLElement): void =>
      applyTheme(productTheme(product, theme), el),
  }
}
