import { z } from 'zod'

/**
 * What a rich-text value is, and the only shape `RichTextEditor` produces or
 * `RichText` draws.
 *
 * **A restricted document, on purpose.** The editor is TipTap, which is
 * ProseMirror, which will model tables, colours, fonts and arbitrary nesting
 * given the chance. A system where every writer can reach all of that is one
 * where two pages share nothing but a logo. What is left here is
 * paragraphs, two heading levels, two kinds of list, bold, italic and links
 * — the set a piece of prose actually needs.
 *
 * **The schema is the contract between three things**: what the toolbar can
 * produce, what a consumer should store, and what the view can draw. A
 * consumer validates with this on the way into its database, so a crafted
 * request can no more insert a table than the editor can, and a node the
 * view has no case for cannot arrive.
 *
 * Zod is an OPTIONAL peer dependency, and this file is the only one that
 * reaches it — which is why it ships from `@wtfalch/design/rich-text` rather
 * than the front door. A consumer that renders prose without validating it
 * should not have to install a validator to load the package. The types and
 * the pure helpers live in `./value`, which imports from here with `import
 * type` and so compiles to nothing.
 */

/** The marks a run of text may carry. `link` is the only one with a value, and its href is checked. */
export const richTextMarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      /**
       * http(s), mailto, or a path. `javascript:` and `data:` are the two
       * that turn a link into script, and they are refused here rather than
       * only in the editor: the editor is a convenience, this is the gate.
       */
      href: z
        .string()
        .trim()
        .min(1)
        .max(2048)
        .refine(
          (href) => /^(https?:\/\/|mailto:|\/)/i.test(href),
          'A link must be http(s), mailto: or a path beginning with /',
        ),
      target: z.string().nullish(),
    }),
  }),
])

/** Named `RichTextMark` rather than `Mark`, which this package already uses for a product's brand mark. */
export type RichTextMark = z.infer<typeof richTextMarkSchema>

const textNode = z.object({
  type: z.literal('text'),
  text: z.string().max(10_000),
  marks: z.array(richTextMarkSchema).max(8).optional(),
})

const inline = z.array(textNode).max(500).optional()

const paragraph = z.object({ type: z.literal('paragraph'), content: inline })
const heading = z.object({
  type: z.literal('heading'),
  /**
   * Two levels, and not level 1: the page's own `<h1>` is its title, and a
   * second one in the body is the most common way a document stops being
   * navigable to somebody reading it with a screen reader.
   */
  attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
  content: inline,
})
const listItem = z.object({
  type: z.literal('listItem'),
  content: z.array(paragraph).max(20),
})
const bulletList = z.object({
  type: z.literal('bulletList'),
  content: z.array(listItem).max(200).optional(),
})
const orderedList = z.object({
  type: z.literal('orderedList'),
  attrs: z.object({ start: z.number().int().min(1).max(999) }).optional(),
  content: z.array(listItem).max(200).optional(),
})

export const blockNodeSchema = z.discriminatedUnion('type', [
  paragraph,
  heading,
  bulletList,
  orderedList,
])

export type BlockNode = z.infer<typeof blockNodeSchema>

/** A whole value: what TipTap calls the document. */
export const richTextSchema = z.object({
  type: z.literal('doc'),
  content: z.array(blockNodeSchema).max(400).optional(),
})

export type RichTextValue = z.infer<typeof richTextSchema>
