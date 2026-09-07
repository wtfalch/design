/**
 * Which page buttons a pager draws.
 *
 * **Its own module so `Pagination.tsx` stays a Fast Refresh boundary**, the
 * same rule `iconNames.ts` and `initials.ts` exist under.
 *
 * Never more than seven slots, with the first and last always present and a
 * gap standing in for the run that is elided. A pager that lists twenty-six
 * pages is wider than the table above it; one that lists only the current
 * page's neighbours loses the jump to the end, which is the second most
 * common thing anybody does with one.
 *
 * The width is held at seven even near an end, so the row does not change size
 * as you move through it -- otherwise the button under the cursor shifts
 * between clicks, which is how somebody lands two pages from where they meant.
 *
 * The gap is where the pager puts its "go to page" field, because that is
 * exactly where the pages you cannot see are. What the gap *does* is the
 * component's business; this only says where one goes.
 */
export function pageWindow(current: number, pages: number): (number | 'gap')[] {
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

  const out: (number | 'gap')[] = []
  let previous = 0
  for (const page of [...slots].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)) {
    if (previous && page - previous > 1) out.push('gap')
    out.push(page)
    previous = page
  }
  return out
}
