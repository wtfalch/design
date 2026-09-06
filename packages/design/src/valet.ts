/**
 * valet's entry: the package, as valet.
 *
 * Everything the main entry exports, and on top of it `Brand`, `THEMES`,
 * `DEFAULT_THEME` and `applyTheme` bound to valet -- a local export shadows
 * the same name from `export *`. A site is one product, so it imports this
 * and `@wtfalch/design/valet.css` and nothing of anyone else's.
 */
export * from './index'
import { bindProduct } from './products'
import { valet } from './products/valet'

const bound = bindProduct(valet)

export const product = bound.product
export const Brand = bound.Brand
export const THEMES = bound.THEMES
export const DEFAULT_THEME = bound.DEFAULT_THEME
export const applyTheme = bound.applyTheme
