'use client'

/* Client, because this module's own JSX attaches handlers or calls hooks. A
   server component may still import it -- that is the point -- it simply
   renders on the client. The ones without this line (Brand, Empty, Icon,
   Illustration, Pill, Progress, Skeleton, Stat, Textarea, Table) render on
   the server, which is why the directive is per component rather than one
   line at the package's front door. */

/**
 * The left column beside the content: a grouped list of the places an app
 * organises itself around, for the app that has more of them than `Shell`'s
 * one-row `nav` was built for -- Manage's Home, Accounts, Teams, Roles,
 * Activity, Settings, and a "Tools" and "Platform" group under those.
 *
 * `SideList.Group` names a run of `SideList.Item`s, and a group at the top of
 * the list may skip the name -- the same "groups are headings, not tabs"
 * shape `Tabs`' vertical rail already has, one level up: there the group is
 * decoration over a strip that is still one control; here every item is its
 * own link and the group is nothing but the heading.
 *
 * **Every item is a real anchor, not a button that calls a router.** `asChild`
 * puts this component's styling on the caller's own element -- a Next.js
 * `<Link>`, usually -- the same seam `Button` uses for the same reason:
 * middle-click, cmd-click, "copy link address" and a screen reader's list of
 * links all come from the element, and a place you navigate to has to be one.
 * `SideList.Item` never renders its own `<button>` or `<a>` the way `Button`
 * does when `asChild` is left off, because a place with nothing to link to is
 * not a place -- there is no sensible link-less mode to fall back to.
 *
 * **The current place is marked, not only coloured.** `current` sets
 * `aria-current="page"` on the slotted anchor, merged the way `Button` merges
 * `aria-disabled` onto a disabled link -- a colour alone tells a mouse where
 * it is and tells a screen reader nothing.
 *
 * **The phone sheet is always controlled, and that is a real constraint, not
 * a style choice.** `Popover` hands you an uncontrolled default because its
 * trigger renders right where the surface opens. This list's trigger cannot:
 * the requirement is a menu button in `Shell`'s header, and the header and
 * this column are siblings under `Shell`, not ancestor and descendant -- there
 * is no DOM position inside both. So opening the sheet is always the caller's
 * call: an ordinary `<Button iconOnly>` in `who`, wired to `onOpenChange`.
 * `open`/`onOpenChange` are required rather than optional for the same
 * reason `Popover`'s are not: without them the sheet has no way to open at
 * all, and a prop that can never do anything is worse than one that must be
 * passed.
 *
 * **The rail and the sheet render the same children twice, not once
 * repositioned.** A `<nav>` docked beside `main` and a `<nav>` inside a
 * portalled `Modal` are different DOM positions a single React subtree cannot
 * occupy at once, so each copy is its own instance -- hidden by CSS rather
 * than unmounted, the ordinary way a responsive nav works. Closing the sheet
 * when a place is chosen only has an effect in the copy that is open; calling
 * it from the docked copy is a harmless no-op.
 *
 * **The breakpoint is Tailwind's own `md` (768px), and that is a decision
 * worth stating because nothing else in this package is responsive yet.**
 * `gallery-e2e`'s visual suite shoots every specimen at a fixed 1000px --
 * above `md` and below Tailwind's `lg` (1024px) -- so the rail is the state
 * the standard baseline photographs, and the collapsed state still needs its
 * own narrow-viewport screenshot the way any portalled surface does.
 */

import { Slot } from '@radix-ui/react-slot'
import { createContext, useContext } from 'react'

import Modal from './Modal'
import ScrollArea from './ScrollArea'

interface Ctx {
  /** No-op in the docked rail, where nothing is open to close. Real in the
   *  sheet, where choosing a place should not leave it standing open over
   *  the page it just navigated to. */
  close: () => void
}

const SideListContext = createContext<Ctx | null>(null)

export interface SideListProps {
  /** Above the groups -- Manage's organisation switcher. Optional because a
   *  single-organisation app has nothing to switch. */
  switcher?: React.ReactNode
  /** `SideList.Group`s, or a bare `SideList.Item` for a place that belongs to
   *  none of them. */
  children: React.ReactNode
  /** Names the `<nav>` landmark, and doubles as the phone sheet's title --
   *  the sheet is a dialog and a dialog owes an accessible name, so reusing
   *  this rather than asking for a second string is the one that cannot go
   *  missing. */
  label: string
  /** Whether the phone sheet is open. See the docblock above for why this
   *  has no uncontrolled default. */
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

function SideListNav({
  switcher,
  children,
  label,
  close,
}: {
  switcher?: React.ReactNode
  children: React.ReactNode
  label: string
  close: () => void
}) {
  return (
    <SideListContext.Provider value={{ close }}>
      <nav className="side-list flex flex-col h-full min-h-0" aria-label={label}>
        {switcher && <div className="side-list-switcher flex-none">{switcher}</div>}
        {/* `ScrollArea`, not a bare overflow box: fifteen-plus places is the
            case this exists for, and a rail that runs off the bottom with no
            mark at its edge is the exact "list that ended" misreading
            `ScrollArea`'s own docblock names. */}
        <ScrollArea className="side-list-groups flex-1 min-h-0">
          <div className="side-list-groups-inner">{children}</div>
        </ScrollArea>
      </nav>
    </SideListContext.Provider>
  )
}

function SideList({ switcher, children, label, open, onOpenChange, className }: SideListProps) {
  const close = () => onOpenChange(false)
  return (
    <>
      {/* Docked, on a wide screen. Always mounted -- `hidden md:flex` takes it
          out of layout and out of the accessibility tree below `md`, which is
          what keeps a narrow viewport from exposing two landmarks with the
          same name at once. */}
      <div
        className={`side-list-rail hidden md:flex md:flex-col md:h-full md:min-h-0${
          className ? ` ${className}` : ''
        }`}
      >
        <SideListNav switcher={switcher} label={label} close={close}>
          {children}
        </SideListNav>
      </div>
      {/* The sheet. Mounted only while open, the way every other overlay in
          this package is -- `Modal` renders a live `ModalOverlay` the instant
          it exists, so "closed" has to mean "not there" rather than "there
          and hidden". */}
      {open && (
        <Modal edge="left" title={label} onClose={close} bodyClass="p-0 flex flex-col min-h-0">
          <SideListNav switcher={switcher} label={label} close={close}>
            {children}
          </SideListNav>
        </Modal>
      )}
    </>
  )
}

export interface SideListGroupProps {
  /** The small heading above this group's places. Omit it for the group at
   *  the top of the list that needs no name -- Home, Accounts, Teams... --
   *  and give the run after it "Tools" or "Platform". */
  heading?: string
  children: React.ReactNode
  className?: string
}

function SideListGroup({ heading, children, className }: SideListGroupProps) {
  return (
    <div className={`side-list-group${className ? ` ${className}` : ''}`}>
      {heading && <div className="side-list-heading">{heading}</div>}
      {children}
    </div>
  )
}

export interface SideListItemProps {
  /** The place: a single element that is or renders an anchor, usually a
   *  Next.js `<Link>`. Its own icon and label are its own content -- the same
   *  contract `Button`'s `asChild` uses, for the same reason: this component
   *  merges attributes onto whatever element it is given and cannot also
   *  inject content into it. */
  children: React.ReactElement
  /** This is the page the visitor is on. */
  current?: boolean
  className?: string
}

function SideListItem({ children, current, className }: SideListItemProps) {
  const ctx = useContext(SideListContext)
  return (
    <Slot
      className={`side-list-item${className ? ` ${className}` : ''}`}
      aria-current={current ? 'page' : undefined}
      onClick={() => ctx?.close()}
    >
      {children}
    </Slot>
  )
}

SideList.Group = SideListGroup
SideList.Item = SideListItem

export default SideList
