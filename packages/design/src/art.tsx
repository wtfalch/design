import type { ComponentProps } from 'react'
import { ArtContext } from './artContext'
import BrandDefault from './components/Brand'
import IconDefault from './components/Icon'
import IllustrationDefault from './components/Illustration'

/**
 * A product's art: its icons, its illustrations and its marks, as values.
 *
 * The components are the package's, and they carry the rules: an icon drawn at
 * its measured view rather than the one it shipped in, an illustration that
 * takes `currentColor` and the panel it sits on, a mark drawn in one stroke.
 * What they draw is a set of values a product supplies, the same seam a theme
 * is. tf's art is the default, so a product that has not drawn its own reuses
 * it without saying so; one that has hands a pack to `ArtProvider` and every
 * component, including the ones the package uses for itself, draws theirs.
 *
 * The one hard part is the names. `Icon` is typed to the default pack's names,
 * and a pack with different ones wants `<Icon name="…">` to fail to build on a
 * name it does not hold. `bindArt` returns the three components typed to the
 * pack, so a product uses its own `Icon` and gets that.
 */

/** A glyph, with the viewBox it is drawn *at* rather than the one it shipped in. */
export interface Glyph {
  /** `x y w h`, measured. Not the source viewBox. */
  view: string
  /** Filled outline paths. */
  d: string[]
  /** Dots drawn as circles, for a glyph that has them. */
  dots?: [number, number, number][]
}

/** A mark: one path in its own ink box, at the stroke weight it was drawn at. */
export interface Mark {
  view: string
  d: string
  stroke: number
}

export interface ArtPack<
  I extends string = string,
  L extends string = string,
  M extends string = string,
> {
  icons: Record<I, Glyph>
  /** SVG markup, read off disk at build time, never from a request. */
  illustrations: Record<L, string>
  marks: Record<M, Mark>
}

/**
 * The names the package's own components draw. A pack has to hold these, or
 * a Callout has no mark, a Modal no close, a password field no eye.
 */
export const SYSTEM_ICONS = [
  'info',
  'check',
  'warning',
  'error',
  'close',
  'eye',
  'eye-off',
] as const

export type SystemIconName = (typeof SYSTEM_ICONS)[number]

/** Declare a pack, so a typo in a name is an error where it is written. */
export function defineArt<I extends string, L extends string, M extends string>(
  pack: ArtPack<I, L, M> & { icons: Record<SystemIconName, Glyph> },
): ArtPack<I, L, M> {
  return pack
}

/**
 * What is wrong with a pack, as sentences. Empty means nothing.
 *
 * The rules are the ones `icons.test.ts` and `illustrations.test.ts` hold
 * tf's art to, so a product can hold its own to the same ones in a test of
 * its own: `expect(checkArt(myArt)).toEqual([])`.
 */
export function checkArt(pack: ArtPack): string[] {
  const out: string[] = []
  for (const name of SYSTEM_ICONS) {
    if (!pack.icons[name]) out.push(`icons: no "${name}", which the package's own components draw`)
  }
  for (const [name, g] of Object.entries(pack.icons)) {
    const parts = g.view.split(' ').map(Number)
    if (parts.length !== 4 || !parts.every(Number.isFinite)) {
      out.push(`icons: ${name}: view is not "x y w h"`)
    } else if (parts[2] !== parts[3]) {
      out.push(`icons: ${name}: icons are square, so the view must be`)
    }
    if (!g.d.length) out.push(`icons: ${name}: has no path`)
  }
  for (const [name, svg] of Object.entries(pack.illustrations)) {
    if (!/viewBox="/.test(svg)) out.push(`illustrations: ${name}: has no viewBox`)
    if (/<svg[^>]*\swidth="/.test(svg)) out.push(`illustrations: ${name}: has a hard-coded width`)
    if (/#[0-9a-f]{3,6}\b/i.test(svg)) out.push(`illustrations: ${name}: has a baked hex colour`)
    if (!svg.includes('class="ink"')) out.push(`illustrations: ${name}: has no ink`)
  }
  for (const [name, m] of Object.entries(pack.marks)) {
    const parts = m.view.split(' ').map(Number)
    if (parts.length !== 4 || !parts.every(Number.isFinite)) {
      out.push(`marks: ${name}: view is not "x y w h"`)
    }
    if (!m.d) out.push(`marks: ${name}: has no path`)
    if (!(m.stroke > 0)) out.push(`marks: ${name}: has no stroke weight`)
  }
  return out
}

type IconProps = ComponentProps<typeof IconDefault>
type IllustrationProps = ComponentProps<typeof IllustrationDefault>
type BrandProps = ComponentProps<typeof BrandDefault>

/**
 * The three components, typed to one pack, and the provider that installs it.
 *
 * `ArtProvider` goes at the root once. The components are the package's own,
 * so what a product renders is what the package renders for itself; only the
 * type of `name` is narrowed, which is the whole point.
 */
export function bindArt<I extends string, L extends string, M extends string>(
  pack: ArtPack<I, L, M>,
) {
  return {
    ArtProvider: ({ children }: { children: React.ReactNode }) => (
      <ArtContext.Provider value={pack}>{children}</ArtContext.Provider>
    ),
    Icon: IconDefault as unknown as (
      props: Omit<IconProps, 'name'> & { name: I },
    ) => React.JSX.Element | null,
    Illustration: IllustrationDefault as unknown as (
      props: Omit<IllustrationProps, 'name'> & { name: L },
    ) => React.JSX.Element | null,
    Brand: BrandDefault as unknown as (
      props: Omit<BrandProps, 'name'> & { name?: M },
    ) => React.JSX.Element | null,
  }
}
