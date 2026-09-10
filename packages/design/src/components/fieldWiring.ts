/**
 * What a `Field` tells the control inside it.
 *
 * Its own module for the reason `iconNames.ts` and `tourMarker.ts` are:
 * `fastRefresh.test.ts` holds every component module to exporting its
 * component and nothing else, because a module exporting a value beside a
 * component loses its Fast Refresh boundary and editing it re-runs every
 * importer instead of swapping the component in place.
 *
 * The context exists so `Field`'s children can be elements rather than a
 * function. A function cannot cross the server boundary, so the render prop
 * made every page with a form a client component whether or not it needed to
 * be -- which is the line all three consuming apps have in their
 * `design.ts`.
 */

import { createContext, useContext } from 'react'

export interface FieldWiring {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': boolean | undefined
  /** The label element's own id, for a control a `<label for>` cannot name.
   *
   *  `htmlFor` is enough for an `<input>`, which is what almost every caller
   *  wraps. It is not enough for `Select`, or for anything else built on a
   *  `<button>`: a button takes its accessible name from its *contents*, and
   *  a `<label for>` pointing at one is ignored by the name computation. A
   *  caller that put a `Select` in a `Field` got a label on screen and a
   *  control announcing only its current value — and the workaround was an
   *  `aria-label` repeating the label string, which is two literals and two
   *  chances to drift apart. That drift is exactly the bug `Field` exists to
   *  prevent, so: pass this as `aria-labelledby` and there is one string. */
  labelId: string
}

/** `null` outside a `Field`, so a control can tell "no field around me" from
 *  "a field that wired me with nothing". */
export const FieldWiringContext = createContext<FieldWiring | null>(null)

/**
 * What the `Field` above this control wired, if there is one.
 *
 * For the package's own controls, which apply it when the caller has not
 * named an `id` themselves. A consumer building its own control can use it
 * for the same reason: it is how a control gets a label without the caller
 * threading four attributes by hand.
 */
export function useFieldWiring(): FieldWiring | null {
  return useContext(FieldWiringContext)
}
