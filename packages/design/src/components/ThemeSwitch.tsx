'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. */

/**
 * The control that changes the theme.
 *
 * All three apps have one and the first forty lines are the same in each: the
 * guarded `localStorage` read, the guarded write, the assignment to
 * `document.documentElement.dataset.theme`. What differed was the wrapper and
 * the label -- one says "Appearance", one says "Theme" -- which is drift, not
 * design.
 *
 * **The choice lives in the browser, not the account.** It is a preference
 * about this screen rather than a fact about the person: the same account on
 * a laptop in a bright room and a phone at night wants two answers. That is
 * also why it needs no server round trip and no session.
 *
 * **The default is not stored.** A browser that never chose follows whatever
 * the default becomes, so changing a product's default reaches everyone who
 * never expressed an opinion, rather than only new visitors.
 *
 * **It writes `data-theme` and does not call `applyTheme`.** The palettes are
 * already on the page as CSS from `productCss`; the attribute is the switch.
 * `applyTheme` writes custom properties one by one and is for the case with
 * no stylesheet to lean on.
 *
 * **`aria-labelledby`, or an `aria-label`, but never both and never neither.**
 * The apps passed `aria-label="Appearance"` beside a visible "Appearance"
 * span, which is the same string written twice -- exactly the drift `Field`
 * exists to stop. Given `label`, this renders it and points the control at
 * it; given `labelHidden`, the string becomes the accessible name and is not
 * drawn.
 */

import { useEffect, useId, useState } from 'react'

import type { Product } from '../products'
import { THEME_STORAGE_KEY, storedTheme, themeChoices } from '../themes/choice'
import Select from './Select'
import type { BrandName } from './brandMarks'

export default function ThemeSwitch({
  product,
  only,
  label = 'Appearance',
  labelHidden = false,
  size = 'sm',
  storageKey = THEME_STORAGE_KEY,
  onChange,
  className,
}: {
  /** Whose themes to offer. A registered name, or a `Product` from
   *  `defineProduct` for an app with its own palette. */
  product: BrandName | Product
  /** A subset of the product's themes, in the order to show them. */
  only?: readonly string[]
  label?: string
  /** The label becomes the accessible name and is not drawn, for a header
   *  where the control's meaning is obvious from its contents. */
  labelHidden?: boolean
  size?: 'sm' | 'md' | 'lg'
  storageKey?: string
  /** For an app that has something else to update. The theme is already
   *  applied by the time this runs. */
  onChange?: (theme: string) => void
  className?: string
}) {
  const choices = themeChoices(product, only)
  const labelId = useId()

  /* The server cannot know what this browser stored, so the first render has
     to match what the server sent -- the attribute the blocking script wrote
     is on `<html>` already, and reading `localStorage` during render would
     be a hydration mismatch. The effect catches the control up. */
  const [choice, setChoice] = useState(() => choices[0]?.id ?? '')
  useEffect(() => {
    setChoice(storedTheme(product, { only, storageKey }))
    // The product object is rebuilt per render when passed inline; its
    // identity is not the dependency, what it resolves to is.
  }, [product, only, storageKey])

  const choose = (next: string) => {
    if (!choices.some((c) => c.id === next)) return
    setChoice(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      /* A browser blocking site data still gets the theme, just not the
         memory of it. Failing the change over the storage would be worse. */
    }
    document.documentElement.dataset.theme = next
    onChange?.(next)
  }

  return (
    <div className={['theme-switch', className].filter(Boolean).join(' ')}>
      <span className="theme-switch-label" id={labelId} hidden={labelHidden}>
        {label}
      </span>
      <Select
        aria-labelledby={labelHidden ? undefined : labelId}
        aria-label={labelHidden ? label : undefined}
        size={size}
        value={choice}
        onChange={(e) => choose(e.target.value)}
      >
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
