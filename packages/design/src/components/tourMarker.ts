/**
 * Whether this browser has been walked round the chrome.
 *
 * **Its own module so `Tour.tsx` stays a Fast Refresh boundary.** Three
 * exported functions beside the component meant Vite could not swap the tour in
 * place -- `Could not Fast Refresh ("markTourSeen" export is incompatible)` --
 * and pushed every edit up to App instead. Editing the tour's copy is exactly
 * the thing somebody does over and over, so it is the worst file in the app to
 * have lost its boundary.
 *
 * These are also not React at all: three reads and writes of one string. They
 * were only in the component file because that is where the tour was written.
 */

/** Remembered per browser: a reload in the middle should not start it again,
 *  and neither should opening the app tomorrow.
 *
 *  Re-running onboarding clears it -- see `forgetTour`. There is still no way
 *  to replay the tour on its own without doing that, which is worth a row in
 *  Settings and is said here rather than left implied. */
/** Where a product records that the tour was seen. Every product that installs
 *  the package gets its own key by passing one; the default is the package's,
 *  so two products on one origin do not share a memory. tf passes
 *  `tf-tour-seen`, the key its users already hold. */
export const DEFAULT_TOUR_KEY = 'design-tour-seen'

export function tourSeen(key = DEFAULT_TOUR_KEY): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    // A browser refusing storage is not a reason to refuse the tour.
    return false
  }
}

/**
 * Forget it, so the next completed onboarding shows it again.
 *
 * Called when the onboarding window *appears*, which is the whole fix: the
 * marker lives in this browser and `config/` lives on disk, so clearing the
 * config replayed onboarding and left the tour suppressed by a value nothing
 * server-side could reach. Somebody re-bootstrapping to look at onboarding got
 * the onboarding and not the thing that follows it, with no way to tell why.
 *
 * Keying off "onboarding is on screen" rather than off a stored timestamp keeps
 * this a fact about one browser, which is what it is. If you are being asked
 * these questions again, you have not seen the walk that comes after them.
 */
export function forgetTour(key = DEFAULT_TOUR_KEY): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* nothing to do about it, and nothing that needs doing */
  }
}

export function markTourSeen(key = DEFAULT_TOUR_KEY): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* nothing to do about it, and nothing that needs doing */
  }
}
