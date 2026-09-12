import type { ReactNode } from 'react'
import type { BlockNode, RichTextMark, RichTextValue } from '../rich-text/schema'

/**
 * Rich text, drawn.
 *
 * The reading half of the pair: `RichTextEditor` writes the value, this
 * draws it, and `richTextSchema` is what they both agree on. A server
 * component — no hooks, no handlers — so a page that only shows prose never
 * loads an editor.
 *
 * **No HTML string anywhere in this file**, which is the whole security
 * argument and the difference from `Markdown`. Nothing is parsed and nothing
 * is injected, so there is no sanitiser whose configuration could be wrong.
 * A value that has been through `richTextSchema` holds only the small closed
 * set below; one that has not is still safe here, because a node this has no
 * case for is skipped rather than trusted.
 *
 * **Every outward link gets `rel="noopener noreferrer"`.** The prose is
 * written by somebody, and where a reader came from is not the destination's
 * business.
 */
export default function RichText({
  value,
  className,
}: {
  value: RichTextValue
  className?: string
}) {
  return (
    <div className={className ? `rich-text ${className}` : 'rich-text'}>
      {(value.content ?? []).map((node, index) => renderBlock(node, index))}
    </div>
  )
}

function renderBlock(node: BlockNode, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderInline(node.content)}</p>
    case 'heading':
      return node.attrs.level === 2 ? (
        <h2 key={key}>{renderInline(node.content)}</h2>
      ) : (
        <h3 key={key}>{renderInline(node.content)}</h3>
      )
    case 'bulletList':
      return <ul key={key}>{(node.content ?? []).map((item, i) => renderItem(item, i))}</ul>
    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start}>
          {(node.content ?? []).map((item, i) => renderItem(item, i))}
        </ol>
      )
    default:
      return null
  }
}

function renderItem(item: { content: { content?: unknown }[] }, key: number): ReactNode {
  return (
    <li key={key}>
      {item.content.map((paragraph, i) => (
        // The index is the right key here and in `renderInline`: this draws a
        // finished value, the list is never reordered, inserted into or
        // filtered, and the text is not unique — two paragraphs both saying
        // "Yes" are two paragraphs.
        // biome-ignore lint/suspicious/noArrayIndexKey: a finished value, never reconciled
        <p key={i}>{renderInline((paragraph as { content?: InlineNode[] }).content)}</p>
      ))}
    </li>
  )
}

interface InlineNode {
  readonly type: 'text'
  readonly text: string
  readonly marks?: readonly RichTextMark[]
}

function renderInline(content: readonly InlineNode[] | undefined): ReactNode {
  if (!content || content.length === 0) return null
  return content.map((node, index) => {
    let element: ReactNode = node.text
    // Applied innermost first, so the order the marks arrive in cannot change
    // the nesting: the link is always outermost, which is what a reader
    // clicks and what a screen reader announces.
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') element = <strong>{element}</strong>
      if (mark.type === 'italic') element = <em>{element}</em>
    }
    const link = (node.marks ?? []).find((mark) => mark.type === 'link')
    if (link && link.type === 'link') {
      const external = /^https?:\/\//i.test(link.attrs.href)
      element = (
        <a href={link.attrs.href} {...(external ? { rel: 'noopener noreferrer' } : {})}>
          {element}
        </a>
      )
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: a finished value, never reconciled
    return <span key={index}>{element}</span>
  })
}
