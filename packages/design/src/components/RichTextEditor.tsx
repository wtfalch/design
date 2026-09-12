'use client'

/* Client, because this module calls hooks and attaches handlers. It is also
   the only component in the package that loads an editor, which is why it
   ships from its own entry (`@wtfalch/design/editor`) rather than the front
   door: a site that renders prose should not download one to do it. */

import Link from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback } from 'react'
import type { RichTextValue } from '../rich-text/schema'
import Button from './Button'

/**
 * Writing prose, with a toolbar that offers six things.
 *
 * **The restriction is the component.** TipTap is ProseMirror, which will
 * model tables, colours, fonts, code blocks and arbitrary nesting given the
 * chance. Every one of those is switched off below. What is left — two
 * heading levels, bold, italic, a link and two kinds of list — is exactly
 * what `richTextSchema` admits and exactly what `RichText` can draw, so the
 * three cannot disagree about what a document may contain. A consumer that
 * wants a seventh thing adds it in all three places, on purpose, rather than
 * discovering that a paste brought one in.
 *
 * **`immediatelyRender: false`** because this will be rendered on a server
 * first: without it TipTap builds a document during SSR and React finds a
 * different one on hydration.
 *
 * **The value is TipTap's JSON**, handed back on every change. The component
 * holds no copy of it: the consumer owns the document, which is what lets an
 * editor sit inside a larger form that saves everything at once.
 *
 * TipTap is an optional peer dependency. Import this entry and you need it;
 * import the package's front door and you do not.
 */
export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: RichTextValue
  onChange: (value: RichTextValue) => void
  /** What this field is, for a screen reader and for the toolbar's own name. */
  label: string
  placeholder?: string
  className?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Left on: paragraph, text, bold, italic, the two lists, listItem,
        // history, and the two cursors that make dragging sane.
        heading: { levels: [2, 3] },
        // Off, each one a decision rather than an oversight. A code block and
        // a quote are shapes a block-based consumer expresses as their own
        // blocks; a horizontal rule is a spacer, and spacing belongs to the
        // theme; strike and inline code are marks nobody asked for, and every
        // one of them is another thing two documents can disagree about.
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
        // Configured separately below, so its defaults — which allow any
        // scheme — never apply.
        link: false,
      }),
      // What an empty editor says. TipTap's own extension rather than a CSS
      // rule of ours: `attr()` reads the attribute of the element the
      // pseudo-element belongs to, so a rule on the paragraph cannot reach a
      // `data-placeholder` on the box, and ProseMirror's empty paragraph
      // holds a trailing `<br>` so `:empty` never matches it either. Both of
      // those were tried, and the picture of the second is why this is here.
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        // The same three `richTextSchema` admits. This is the first of two
        // gates and the schema is the one that counts.
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // `rich-text` styles the elements ProseMirror builds; the rest is
        // this surface's own box, which is ours to draw. Two of the largest
        // spacing step is about six lines — enough to write a paragraph in
        // without the box growing under the cursor on the first one.
        class: 'rich-text p-3 min-h-[calc(var(--space-15)*2)] outline-none',
        // A contenteditable div is a `generic` to an accessibility tree, and
        // `aria-label` is prohibited on a generic — axe said so on the first
        // run, which is what the suite is for. `textbox` with
        // `aria-multiline` is what a rich text area is, and it is what makes
        // the label legal and announced.
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON() as RichTextValue),
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const current = editor.getAttributes('link').href as string | undefined
    // A prompt rather than a dialog: it is one field, it is modal either way,
    // and a dialog here would be the first piece of state this component has
    // to own. Worth replacing the day a link needs a second field.
    const href = window.prompt('Link to', current ?? 'https://')
    if (href === null) return
    if (href.trim() === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }, [editor])

  /* The box.

     `rounded-(--radius)`, not `rounded`: Tailwind v4 emits a literal
     `0.25rem` for the bare utility and never reads `--radius-DEFAULT`, so
     `rounded` is an unthemeable 4px corner where the vocabulary says 6. The
     screenshots caught it as four moved corners and nothing else. Nothing
     else in the package uses the bare form.

     `shadow`, not `outline`: `--focus-ring` is a box-shadow value
     (`0 0 0 2px var(--accent)`), so `outline: var(--focus-ring)` is invalid
     and drops the whole declaration silently — which this had, and which no
     screenshot would ever have shown because a baseline is never focused.
     `pagination.css` records the same bug. The ring belongs to the box
     rather than to the contenteditable, so it does not draw a second,
     thinner rectangle inside the border. */
  const box =
    'grid overflow-hidden rounded-(--radius) border border-border-strong surface-control focus-within:shadow-(--focus-ring)'

  if (!editor) {
    return <div className={className ? `${box} ${className}` : box} aria-busy="true" />
  }

  const controls: { label: string; active: boolean; run: () => void }[] = [
    {
      label: 'Heading',
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Subheading',
      active: editor.isActive('heading', { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Bold',
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    { label: 'Link', active: editor.isActive('link'), run: setLink },
    {
      label: 'Bullets',
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbers',
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ]

  return (
    <div className={className ? `${box} ${className}` : box}>
      <div
        className="flex flex-wrap gap-1 border-b border-border p-1 surface-panel"
        role="toolbar"
        aria-label={`${label} formatting`}
      >
        {controls.map((control) => (
          <Button
            key={control.label}
            type="button"
            size="sm"
            kind={control.active ? 'primary' : 'ghost'}
            aria-pressed={control.active}
            onPress={control.run}
          >
            {control.label}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
