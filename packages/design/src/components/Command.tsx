import { useState } from 'react'
import {
  Modal as AriaModal,
  Autocomplete,
  Dialog,
  Header,
  Input,
  Keyboard,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  ModalOverlay,
  SearchField,
  Text,
  useFilter,
} from 'react-aria-components'

import Icon from './Icon'
import type { IconName } from './iconNames'

/**
 * Type what you want to do.
 *
 * The keyboard's front door: one field over the application, a list that
 * narrows as you type, Enter to run the highlighted thing. It exists because
 * the alternative to a palette is a menu bar, and a menu bar makes every
 * action cost a guess about which of six menus somebody filed it under.
 *
 * **It is a search field over a listbox, not a text input with a div under
 * it.** That distinction is the whole accessibility story here. React Aria's
 * `Autocomplete` keeps focus in the field while the arrows move the *selection*
 * in the list, sets `aria-activedescendant` so a screen reader reads the
 * highlighted row without focus leaving the input, and wires `aria-controls`
 * between the two. Hand-rolled palettes move real focus into the list, which
 * means typing another letter goes nowhere and the whole thing dead-ends for
 * anybody not using a mouse.
 *
 * **Filtering is substring, and deliberately not fuzzy.** A fuzzy match on a
 * short list is a list that reorders itself under your hands: you type one
 * more letter, the thing you were about to press moves, and you run the wrong
 * command. `contains` with the locale's collation -- so `resume` finds
 * `Résumé` -- keeps the order stable and the surprises out.
 *
 * **The empty state says the query.** "No commands match 'archve'" is a typo
 * somebody can see; "No results" is a dead end that looks like a broken build.
 */

export interface Command {
  id: string
  label: string
  /** What running it does, when the name does not say. */
  description?: string
  icon?: IconName
  /** Shown, never bound. The app owns the binding. */
  shortcut?: string
  /** Words that should find it but are not in its name -- "trash" for Delete,
   *  "folder" for Mailbox. Searched, never displayed. */
  keywords?: string[]
  disabled?: boolean
  onRun?: () => void
}

export interface Group {
  title: string
  commands: Command[]
}

export interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Grouped, because a flat list of forty commands is a list nobody reads
   *  the bottom of. */
  groups: Group[]
  /** The field's placeholder and its accessible name. */
  placeholder?: string
  label?: string
  className?: string
}

export default function Command({
  open,
  onOpenChange,
  groups,
  placeholder = 'Search commands…',
  label = 'Command palette',
  className,
}: Props) {
  const [query, setQuery] = useState('')
  /* The locale's collation, not `toLowerCase().includes()`: that answers no
     for `Résumé` when you type `resume`, and for every language whose casing
     is not English's. */
  const { contains } = useFilter({ sensitivity: 'base' })

  const matches = (command: Command) =>
    query === '' ||
    contains(command.label, query) ||
    (command.description !== undefined && contains(command.description, query)) ||
    (command.keywords ?? []).some((word) => contains(word, query))

  const shown = groups
    .map((group) => ({ ...group, commands: group.commands.filter(matches) }))
    .filter((group) => group.commands.length > 0)

  const empty = shown.length === 0

  return (
    <ModalOverlay
      className="cmd-scrim"
      isOpen={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        /* Cleared on close, not on open: a palette that reopens with the last
           query still in it shows a filtered list somebody has to notice and
           delete before they can search for anything else. */
        if (!next) setQuery('')
      }}
      isDismissable
    >
      <AriaModal className={`cmd${className ? ` ${className}` : ''}`}>
        <Dialog className="cmd-body" aria-label={label}>
          {({ close }) => (
            <Autocomplete inputValue={query} onInputChange={setQuery} filter={() => true}>
              <SearchField className="cmd-field" aria-label={label} autoFocus>
                <Icon name="chat" className="cmd-mark" />
                <Input className="cmd-input" placeholder={placeholder} />
              </SearchField>

              {empty ? (
                /* The query, quoted. A palette that says "No results" to a
                   typo looks like a palette that is broken. */
                <p className="cmd-empty">
                  Nothing matches <strong>{query}</strong>.
                </p>
              ) : (
                <ListBox className="cmd-list" aria-label={label} selectionMode="none">
                  {shown.map((group) => (
                    <ListBoxSection key={group.title} className="cmd-group">
                      <Header className="cmd-group-title">{group.title}</Header>
                      {group.commands.map((command) => (
                        <ListBoxItem
                          key={command.id}
                          id={command.id}
                          className="cmd-item"
                          textValue={command.label}
                          isDisabled={command.disabled}
                          onAction={() => {
                            command.onRun?.()
                            /* Closing is this component's job, not every
                               caller's. Forty `onRun`s that each remember to
                               close is thirty-nine chances to forget. */
                            close()
                          }}
                        >
                          {command.icon && <Icon name={command.icon} className="cmd-icon" />}
                          <span className="cmd-text">
                            <Text slot="label" className="cmd-label">
                              {command.label}
                            </Text>
                            {command.description && (
                              <Text slot="description" className="cmd-desc">
                                {command.description}
                              </Text>
                            )}
                          </span>
                          {command.shortcut && (
                            <Keyboard className="cmd-key">{command.shortcut}</Keyboard>
                          )}
                        </ListBoxItem>
                      ))}
                    </ListBoxSection>
                  ))}
                </ListBox>
              )}
            </Autocomplete>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )
}
