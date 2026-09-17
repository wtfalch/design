import { useEffect, useState } from 'react'

/**
 * The widths at which a layout changes, and they are Tailwind's.
 *
 * One source, shared by whatever draws the breakpoint and whatever asks
 * about it: a stylesheet's `@media` rule, a Tailwind `md:` utility and a
 * `matchMedia` caller all mean the same width. `Shell` and `SideList` switch
 * at `md:` and `shell.css` at `48rem`, which are Tailwind's defaults, because
 * the package's Tailwind never overrode them. The first version of this
 * module (0.16.0) exported `medium: 860` and `wide: 1150` instead, copied
 * from `@wtfalch/email`'s mailbox shell (`usePanes`), so the package shipped
 * two sets of widths that agreed on nothing and no component used the
 * exported one. `layout.test.ts` now holds these to Tailwind's own
 * `theme.css`, so they cannot drift apart again.
 *
 * Pixels at the default 16px root, for arithmetic. The queries are in `rem`,
 * as Tailwind writes them, so a person who raised their browser's font size
 * gets the same layout from a `matchMedia` caller as from a `md:` utility.
 *
 * No CSS custom properties for these: a `@media` condition cannot read a
 * custom property (`@media (min-width: var(--x))` is not valid CSS), which is
 * the one place a breakpoint is actually consumed, so a `--breakpoint-*`
 * variable would sit unread beside the rule that matters. The token
 * vocabulary in `themes/index.ts` is also the wrong shelf for it regardless:
 * every token there is a per-theme value `applyTheme` writes to `:root`, and a
 * breakpoint is neither themeable nor derived from a theme -- it does not
 * vary with which theme is on.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

const query = (px: number) => `(min-width: ${px / 16}rem)`

/** `BREAKPOINTS`, each as the `min-width` query that turns it on. */
export const MEDIA_QUERIES: Record<Breakpoint, string> = {
  sm: query(BREAKPOINTS.sm),
  md: query(BREAKPOINTS.md),
  lg: query(BREAKPOINTS.lg),
  xl: query(BREAKPOINTS.xl),
  '2xl': query(BREAKPOINTS['2xl']),
}

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/**
 * Whether a media query matches, updated as the window changes.
 *
 * Built on `matchMedia` rather than a resize listener, the same choice
 * `usePanes` makes and for the same reason: a resize fires on every pixel
 * crossed, and the question here is only ever "did a breakpoint flip",
 * which `matchMedia`'s own `change` event already answers.
 *
 * Safe with no `window` or no `matchMedia` -- a server render, or a test that
 * has stubbed neither. Unlike `usePanes`, which defaults to `wide` because
 * that specific layout has nothing hidden to get wrong, this hook has no
 * domain to reason about the query with, so it takes the conventional,
 * conservative default of `false` and never subscribes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => hasMatchMedia() && window.matchMedia(query).matches)

  useEffect(() => {
    if (!hasMatchMedia()) return
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    mql.addEventListener('change', update)
    // Once on mount as well: the query can have matched a different way
    // between the initialiser running and the listener being attached.
    update()
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}
