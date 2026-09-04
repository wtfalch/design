/**
 * The people. Open Peeps, wearing the theme.
 *
 * Twenty-one hand-drawn figures, and the reason they can be in the app at all
 * is that they are two colours: black line and white fill, nothing else. That
 * makes them recolourable, which a photograph or a flat-colour illustration is
 * not -- and an app with several themes cannot carry artwork that only looks right
 * in one of them.
 *
 * **They take `currentColor`.** The build swaps `#000` for `class="ink"` and
 * `#FFF` for `class="paper"`, and the two rules in `styles.css` point those at
 * `currentColor` and `--panel`. So a figure inherits the colour of whatever it
 * sits in: grey in a muted block, accent when something is being pointed at,
 * `--bad` on a failure screen. One file, every theme, no second export.
 *
 * **Inlined, not `<img>`.** An SVG behind an `<img>` is a separate document: it
 * cannot see this page's custom properties, cannot inherit `currentColor`, and
 * would need twenty-one more files to cover light and dark. They are read at
 * build time and injected, which is what makes the colour work.
 *
 * **`aria-hidden` unless told otherwise.** These are decoration. A screen reader
 * announcing "person shrugging" before the sentence that actually says what
 * went wrong is noise; the caller passes `alt` only when the picture is the
 * message, which so far it never is.
 */

import { ILLUSTRATION_SVG, type IllustrationName } from '../illustrations'

export type { IllustrationName }

/* Read at build time and inlined, so there is no request and nothing to fail on
   an offline first run -- which is the run these are most likely to appear on.

   The app read them with Vite's `import.meta.glob('*.svg', {query: '?raw'})`,
   which is a bundler feature rather than a language one: `tsc` emits it
   untouched and the published `dist` would refer to twenty-one modules that do
   not exist. `scripts/build-illustrations.mjs` generates a plain module
   instead, which removes the dependency on a bundler rather than documenting
   it. */
const BY_NAME: Record<string, string> = ILLUSTRATION_SVG

export default function Illustration({
  name,
  size = 160,
  alt,
  className,
}: {
  name: IllustrationName
  /** Height in pixels. The width follows the drawing's own ratio. */
  size?: number
  /** Given only when the picture carries meaning of its own. Omit for
   *  decoration, which is nearly always. */
  alt?: string
  className?: string
}) {
  const svg = BY_NAME[name]
  if (!svg) return null

  return (
    <span
      className={`illo${className ? ` ${className}` : ''}`}
      style={{ height: size }}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      /* The file is ours: it comes off disk at build time, not from a model, an
         applet or the network, so there is no untrusted string to sanitise
         here. Anything that ever arrives at runtime must not use this path. */
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/* `ILLUSTRATIONS` is not re-exported from here. It lives in
   `../illustrations/names`, and re-exporting a value through a component
   module costs that module its Fast Refresh boundary for nothing. */
