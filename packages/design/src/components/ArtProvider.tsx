import type { ArtPack } from '../art'
import { ArtContext } from '../artContext'

/**
 * Installs a product's art for everything below it.
 *
 * Once, at the root. Without it every component draws tf's art, which is the
 * right default for a product that has not drawn its own. With it, the icons
 * inside a Callout, the close cross on a Modal and the mark in the header are
 * the product's, without the product touching a component.
 */
export default function ArtProvider({
  pack,
  children,
}: {
  pack: ArtPack
  children: React.ReactNode
}) {
  return <ArtContext.Provider value={pack}>{children}</ArtContext.Provider>
}
