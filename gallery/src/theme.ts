/**
 * The picker's themes, and how one is applied.
 *
 * Each product's themes are applied as that product wears them -- the palette
 * over the product's identity -- so valet's night is Plex and sharp corners
 * here as it is in valet, not valet's colours on tf's type. tf's identity is
 * the base, so its three are unchanged and so are their baselines. `brand` is
 * the fixture from `brand.ts`, applied as an object the way a consumer's own
 * theme is.
 */
import { PRODUCTS, applyTheme, productTheme } from '@wtfalch/design'
import { brand } from './brand'

export function galleryThemes(): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const product of Object.values(PRODUCTS)) {
    for (const [id, theme] of Object.entries(product.themes)) out.push({ id, label: theme.name })
  }
  out.push({ id: 'brand', label: brand.name })
  return out
}

export function applyGalleryTheme(id: string): void {
  if (id === 'brand') {
    applyTheme(brand)
    return
  }
  const owner = Object.values(PRODUCTS).find((p) => id in p.themes)
  applyTheme(owner ? productTheme(owner, id) : id)
}
