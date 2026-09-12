import type { RichTextValue } from './schema'

/**
 * The parts of a rich-text value that need no validator.
 *
 * Split from `./schema` so the package's front door stays free of zod. The
 * schema is a runtime object and zod is an optional peer dependency, so a
 * consumer that renders prose and never validates it — a site, a preview —
 * would otherwise fail to load the package at all for want of a dependency
 * it has no use for. The type import above is erased at build, so nothing
 * here reaches zod.
 */

/**
 * A document with nothing in it — and one empty paragraph, not an empty
 * array. ProseMirror's schema says a document is `block+`, so a `doc` with
 * no children is not a document it can put a cursor in: the editor rendered
 * an empty box with no paragraph, which meant no node to mark as empty and
 * so no placeholder. The picture of that is why this reads the way it does.
 * `isEmptyRichText` treats both forms as empty, and the schema accepts both,
 * because a value that arrives from somewhere else may be either.
 */
export const emptyRichText: RichTextValue = { type: 'doc', content: [{ type: 'paragraph' }] }

/** Whether there is anything to draw, so a caller can skip an empty value rather than leave a gap. */
export function isEmptyRichText(value: RichTextValue): boolean {
  return (value.content ?? []).every(
    (node) => !('content' in node) || (node.content ?? []).length === 0,
  )
}

/** The plain words, for a summary, a search index or a document's own `<title>`. */
export function richTextToPlain(value: RichTextValue): string {
  const parts: string[] = []
  const walk = (nodes: readonly unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const record = node as { text?: string; content?: unknown[] }
      if (typeof record.text === 'string') parts.push(record.text)
      if (Array.isArray(record.content)) walk(record.content)
    }
  }
  walk(value.content ?? [])
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
