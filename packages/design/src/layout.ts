import { useEffect, useState } from 'react'

/**
 * The widths at which a compact layout becomes more than one column.
 *
 * One source, shared by whatever draws the breakpoint and whatever asks
 * about it: a stylesheet's `@media` rule and a `matchMedia` caller read the
 * same query string in `MEDIA_QUERIES`, and that string is built off the same
 * pixel value in `BREAKPOINTS` rather than a second copy that can drift from
 * it.
 *
 * The values are `@wtfalch/email`'s mailbox shell's (`usePanes`,
 * `packages/email/src/mailbox/react/layout.ts`), promoted here so a shell
 * built from this package's `SplitPane` and `Shell` can collapse at the same
 * widths without a second, uncoordinated set of numbers: below `medium` is
 * one column, `medium` and up fits two, `wide` and up fits three. What each
 * width is *for* is the consumer's decision -- `usePanes` keeps its own
 * three-state read of them -- this module only owns the numbers.
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
  medium: 860,
  wide: 1150,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/** `BREAKPOINTS`, each as the `min-width` query that turns it on. */
export const MEDIA_QUERIES: Record<Breakpoint, string> = {
  medium: `(min-width: ${BREAKPOINTS.medium}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
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
