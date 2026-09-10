/**
 * The other bare control `Field` wraps.
 *
 * Not resizable by hand. The chat composer grows with what you type, and the
 * browser's drag handle fought it — you would size it, type a line, and it
 * would snap back. `resize: none` lives in the stylesheet on the element, so
 * this component keeps it by rendering the element.
 *
 * Same contract as `Input`: a plain `<textarea>` so every element rule in the
 * stylesheet keeps working, and its `id`, `aria-describedby` and
 * `aria-invalid` come from the `Field` above it -- handed in by a render
 * prop, or read from context when the caller passed plain children. On its
 * own it needs an `aria-label`, for the same reason `Input` does.
 */
import { forwardRef } from 'react'

import { useFieldWiring } from './fieldWiring'

export interface Props
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  size?: 'sm' | 'md' | 'lg'
  /** Monospace — a system prompt, an environment block, anything where the
   *  characters are the content. */
  mono?: boolean
  className?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { size = 'md', mono, className, ...rest },
  ref,
) {
  const classes = [size === 'md' ? '' : `size-${size}`, mono ? 'mono' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  /* Explicit props win; this is the fallback. After `rest` in the spread,
     because a key present with an undefined value still overwrites. */
  const field = useFieldWiring()
  const wired = {
    id: rest.id ?? field?.id,
    'aria-describedby': rest['aria-describedby'] ?? field?.['aria-describedby'],
    'aria-invalid': rest['aria-invalid'] ?? field?.['aria-invalid'],
  }

  return <textarea ref={ref} className={classes || undefined} {...rest} {...wired} />
})

export default Textarea
