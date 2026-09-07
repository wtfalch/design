/**
 * Which page buttons a pager draws.
 *
 * **Its own module so `Pagination.tsx` stays a Fast Refresh boundary**, the
 * same rule `iconNames.ts` and `initials.ts` exist under.
 *
 * Never more than seven slots, with the first and last always present and an
 * ellipsis standing in for the run that is elided. A pager that lists
 * twenty-six pages is wider than the table above it; one that lists only the
 * current page's neighbours loses the jump to the end, which is the second
 * most common thing anybody does with one.
 *
 * The width is held at seven even near an end, so the row does not change size
 * as you move through it -- otherwise the button under the cursor shifts
 * between clicks, which is how somebody lands two pages from where they meant.
 */

/**
 * A slot in the row: a page to draw a button for, or an ellipsis.
 *
 * **The ellipsis carries a destination**, which is what makes it a control
 * rather than a piece of punctuation. Standing for pages 6 to 25 and doing
 * nothing when pressed, it is a dead spot in the middle of a row of live
 * buttons -- and the only way to reach page 17 of 26 is to press Next eleven
 * times. `jumpTo` is the middle of the run it hides, so two presses reach
 * anywhere in a twenty-six page list and the neighbours finish the job.
 */
export type PageSlot = number | { jumpTo: number }

export function isGap(slot: PageSlot): slot is { jumpTo: number } {
  return typeof slot !== 'number'
}

export function pageWindow(current: number, pages: number): PageSlot[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)

  const near = [current - 1, current, current + 1].filter((p) => p > 1 && p < pages)
  const slots = new Set<number>([1, ...near, pages])
  /* Near an end there is only one gap instead of two, so the run has to be one
     longer to keep the row at seven. Four rather than three: 1 2 3 4 5 … 26,
     not 1 2 3 4 … 26, which is six slots and a row that changes width as you
     leave the first page. */
  if (current <= 3) for (const p of [2, 3, 4, 5]) slots.add(p)
  if (current >= pages - 2) {
    for (const p of [pages - 4, pages - 3, pages - 2, pages - 1]) slots.add(p)
  }

  const out: PageSlot[] = []
  let previous = 0
  for (const page of [...slots].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)) {
    if (previous && page - previous > 1) {
      // The middle of what it hides, which is the only page an ellipsis
      // standing for a range can honestly claim to be about.
      out.push({ jumpTo: Math.floor((previous + page) / 2) })
    }
    out.push(page)
    previous = page
  }
  return out
}
