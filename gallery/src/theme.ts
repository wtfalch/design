/**
 * The picker's themes, and how one is applied.
 *
 * The gallery's product is a stand-in for an app's (`product.ts`), and each of
 * its themes is applied as the product wears it -- the palette over the
 * identity. The identity is empty, so night and paper are unchanged and so are
 * their baselines. `brand` is the fixture from `brand.ts`, applied as an
 * object the way a consumer's own theme is.
 */
import { applyTheme, productTheme } from '@wtfalch/design'
import { brand } from './brand'
import { galleryProduct } from './product'

export function galleryThemes(): { id: string; label: string }[] {
  const out = Object.entries(galleryProduct.themes).map(([id, theme]) => ({
    id,
    label: theme.name,
  }))
  out.push({ id: 'brand', label: brand.name })
  return out
}

export function applyGalleryTheme(id: string): void {
  applyTheme(id === 'brand' ? brand : productTheme(galleryProduct, id))
}
