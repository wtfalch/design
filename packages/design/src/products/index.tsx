import type { ComponentProps } from 'react'
import BrandDefault from '../components/Brand'
import type { BrandName } from '../components/brandMarks'
import { type Theme, type ThemeTokens, applyTheme } from '../themes'
import { themeId } from '../themes/css'
import { tf } from './tf'
import { valet } from './valet'

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
 * shows: over the base it shows tf, over the product it shows the product.
 * Before this layer valet's two palettes each restated valet's font and
 * corners, because there was nowhere else to put them.
 *
 * A site is one product, so each ships as one entry -- `@wtfalch/design/valet`
 * and `valet.css` -- where `Brand`, `THEMES` and `applyTheme` are the
 * product's. This module is the neutral view of all of them, which is what the
 * gallery reads.
 */
export interface Product {
  /** The id: the mark's row in `brandMarks.ts` and the stem of the CSS entry. */
  name: BrandName
  /** On `:root` in the product's stylesheet, and under every palette when one
   *  is applied. Empty for a product the base values already describe. */
  identity: Partial<ThemeTokens>
  /** Keyed by the id `applyTheme` takes. */
  themes: Record<string, Theme>
  /** Worn until somebody picks; written on `:root` when no `data-theme` is set. */
  defaultTheme: string
}

/** Every product, by the name of its mark. */
export const PRODUCTS = { tf, valet } as const

/** Declare a product, so a default that is not a theme or a key `applyTheme`
 *  would not use is an error where it is written. */
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
  }
  return product
}

/**
 * A theme as the product wears it: the palette over the identity.
 *
 * An id the product does not offer resolves to the product's default rather
 * than the package's, so a valet setting that remembers a theme valet has
 * since dropped comes up as valet, not as tf.
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

type BrandProps = ComponentProps<typeof BrandDefault>

/**
 * The package, as one product.
 *
 * `Brand` defaults to the product's mark and still takes a name. `applyTheme`
 * resolves against the product's themes and writes the identity under the
 * palette, so it holds even where the product's stylesheet is not the one
 * loaded. The product entries are this, exported.
 */
export function bindProduct(product: Product) {
  function Brand(props: BrandProps) {
    return <BrandDefault {...props} name={props.name ?? product.name} />
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
