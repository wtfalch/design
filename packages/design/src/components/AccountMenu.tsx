'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * Who is signed in, at the end of the title block.
 *
 * `Menu` already draws a caller-supplied trigger and a caller-supplied list;
 * what it deliberately cannot do is style that trigger, because the trigger
 * is the caller's own markup. That is exactly where the identity chip broke:
 * wrapped in a ghost button, the pill `Identity`'s `chip` kind already draws
 * -- its own border, its own pill radius, its own background -- sat inside a
 * second, squarer box: the button's own padded rectangle. Hovering filled
 * that outer rectangle, which is wider and less round than the chip inside
 * it, so the control read as two shapes stacked rather than one. This exists
 * to own the trigger instead of receiving it: the interactive element *is*
 * the chip, so a hover or a focus ring can only ever trace the one shape
 * that is actually drawn.
 *
 * **A composition, not a prop on `Menu`, for the same reason `ThemeSwitch` is
 * its own component rather than a `Select` variant.** `Menu`'s trigger is
 * caller-supplied by design -- a mailbox's actions, a message's actions, each
 * with their own control. This trigger is fixed: it is always the signed-in
 * person's `Identity`, always a chip, always this shape. Baking a fixed
 * trigger into a generic `Menu` would be a special case living inside a
 * general-purpose component; kept beside it instead, `Menu` stays exactly as
 * generic as it was.
 *
 * **`info` is the email-and-role box the brief asks for, generalised.** This
 * package does not know what an organisation, a tenant or a role is -- `info`
 * takes whatever `React.ReactNode` the app hands it and passes it straight to
 * `Menu`'s own `info` slot, unread. One app fills it with an address and a
 * person's main role; another could fill it with a plan name and a renewal
 * date. Either way it is not a menu item: see `Menu`'s docblock for why that
 * box is a sibling of the action list rather than a disabled entry inside it.
 */

import { Button as AriaButton, type Placement } from 'react-aria-components'

import Identity from './Identity'
import Menu, { type Item, type Section } from './Menu'

export interface Props {
  /** The signed-in person the trigger draws -- `Identity`'s own two fields. */
  name?: string | null
  address: string
  /** Static context above the actions: the address, a role, anything the app
   *  wants read before the verbs. Forwarded to `Menu`'s `info` slot as-is. */
  info: React.ReactNode
  items: (Item | Section)[]
  /** Names the menu for a screen reader, and doubles as the start of the
   *  trigger's own accessible name: `"${label}, ${address}"` -- the same
   *  pair a bare chip's visible text alone would leave ambiguous. */
  label: string
  placement?: Placement
  className?: string
}

export default function AccountMenu({
  name,
  address,
  info,
  items,
  label,
  placement = 'bottom end',
  className,
}: Props) {
  return (
    <Menu
      label={label}
      placement={placement}
      className={className}
      info={info}
      items={items}
      trigger={
        <AriaButton className="account-trigger" aria-label={`${label}, ${address}`}>
          <Identity name={name} address={address} kind="chip" size="sm" />
        </AriaButton>
      }
    />
  )
}
