/**
 * How an identity disc is drawn: its two letters and its hue.
 *
 * **Its own module so `Identity.tsx` stays a Fast Refresh boundary.** A
 * component module that exports a value beside its component loses the
 * boundary, and editing it re-runs every importer instead of swapping the
 * component in place. `iconNames.ts` and `tourMarker.ts` exist for the same
 * reason.
 *
 * Exported from the package as well, because anything else colouring by
 * sender -- a thread list's left rule, a chart of who writes most -- has to
 * agree with the discs or the second cue contradicts the first.
 */

/**
 * Up to two initials.
 *
 * From the name's first and last word, which is right for "Ada Lovelace" and
 * for "Ada Byron King Lovelace"; from the address's local part when there is
 * no name, which is most machine senders. Split on whitespace only --
 * splitting on punctuation turns "O'Brien" into "OB" and "Smith-Jones" into
 * "SJ", which are worse than the single letter they replace.
 */
export function initialsOf(name: string | null | undefined, address: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    const first = words[0]?.[0] ?? ''
    const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
    return (first + last).toUpperCase()
  }
  const local = address.split('@')[0] ?? address
  return (local[0] ?? '?').toUpperCase()
}

/**
 * A hue from the address.
 *
 * A cheap, stable string hash. Not a cryptographic one and not trying to be:
 * the requirement is that the same address gives the same number everywhere
 * and on every machine, which any deterministic function satisfies, and that
 * neighbouring addresses do not land on the same hue, which multiplying by an
 * odd prime handles well enough.
 *
 * Case- and whitespace-insensitive, because `Ada@Example.com ` and
 * `ada@example.com` are one person and two colours would say they were two.
 */
export function hueOf(address: string): number {
  let hash = 0
  for (const character of address.trim().toLowerCase()) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 360
  }
  return hash
}
