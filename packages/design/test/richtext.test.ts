/**
 * The three statements of one decision, held equal.
 *
 * What formatting this system has is written down in three places: the
 * editor's extension list, `richTextSchema`, and `RichText`'s switch. A mark
 * switched back on in one of them and not the others is either a document a
 * page cannot draw or a toolbar button that saves nothing, and neither
 * failure is visible until somebody uses it. This file is what makes it
 * visible immediately.
 *
 * The editor itself is not rendered here — it needs a DOM and a live
 * ProseMirror — so it is read as text. The gallery's visual and axe suites
 * are what exercise it in a browser.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import RichText from '../src/components/RichText'
import { richTextSchema } from '../src/rich-text/schema'
import { emptyRichText, isEmptyRichText, richTextToPlain } from '../src/rich-text/value'

const here = dirname(fileURLToPath(import.meta.url))
const source = (path: string) => readFileSync(resolve(here, '../src', path), 'utf8')

const doc = (...content: unknown[]) => ({ type: 'doc', content })
const text = (value: string, marks?: unknown[]) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
})
const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content })

describe('richTextSchema', () => {
  it('accepts everything the toolbar can produce', () => {
    const value = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('A heading')] },
      paragraph(text('Words, '), text('bold', [{ type: 'bold' }])),
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('one'))] }] },
      { type: 'orderedList', attrs: { start: 1 }, content: [] },
    )
    expect(richTextSchema.safeParse(value).success).toBe(true)
  })

  it('refuses a node the palette does not have, however well-formed', () => {
    for (const node of [
      { type: 'table', content: [] },
      { type: 'codeBlock', content: [text('x')] },
      { type: 'horizontalRule' },
      { type: 'image', attrs: { src: 'x' } },
    ]) {
      expect(richTextSchema.safeParse(doc(node)).success, JSON.stringify(node)).toBe(false)
    }
  })

  it('refuses a heading level nothing has a style for', () => {
    for (const level of [1, 4, 6]) {
      expect(
        richTextSchema.safeParse(doc({ type: 'heading', attrs: { level }, content: [] })).success,
        String(level),
      ).toBe(false)
    }
  })

  it('refuses a mark nobody declared', () => {
    for (const mark of [{ type: 'strike' }, { type: 'textStyle', attrs: { color: 'red' } }]) {
      expect(richTextSchema.safeParse(doc(paragraph(text('x', [mark])))).success).toBe(false)
    }
  })

  it('refuses the link schemes that are script, and allows the ones that are not', () => {
    for (const href of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<x>']) {
      const value = doc(paragraph(text('x', [{ type: 'link', attrs: { href } }])))
      expect(richTextSchema.safeParse(value).success, href).toBe(false)
    }
    for (const href of ['https://example.com', 'http://example.com', 'mailto:a@b.c', '/about']) {
      const value = doc(paragraph(text('x', [{ type: 'link', attrs: { href } }])))
      expect(richTextSchema.safeParse(value).success, href).toBe(true)
    }
  })
})

describe('the editor and the schema agree', () => {
  const editor = source('components/RichTextEditor.tsx')

  it.each(['codeBlock', 'blockquote', 'horizontalRule', 'strike', 'code'])(
    'keeps %s switched off, so nothing can produce one',
    (extension) => {
      expect(editor).toMatch(new RegExp(`${extension}:\\s*false`))
    },
  )

  it('offers only the two heading levels the schema admits', () => {
    expect(editor).toContain('levels: [2, 3]')
  })

  it('allows only the three link schemes the schema allows', () => {
    expect(editor).toContain("protocols: ['http', 'https', 'mailto']")
  })
})

describe('RichText on the server', () => {
  it('draws every node type the schema admits', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        value: doc(
          { type: 'heading', attrs: { level: 2 }, content: [text('Two')] },
          { type: 'heading', attrs: { level: 3 }, content: [text('Three')] },
          paragraph(
            text('Plain '),
            text('bold', [{ type: 'bold' }]),
            text('it', [{ type: 'italic' }]),
          ),
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [paragraph(text('one'))] }],
          },
          {
            type: 'orderedList',
            attrs: { start: 3 },
            content: [{ type: 'listItem', content: [paragraph(text('three'))] }],
          },
        ) as never,
      }),
    )
    expect(html).toContain('<h2>')
    expect(html).toContain('<h3>')
    expect(html).toContain('<strong>')
    expect(html).toContain('<em>')
    expect(html).toContain('<ul>')
    expect(html).toContain('start="3"')
    expect(html).toContain('class="rich-text"')
  })

  it('never produces HTML from the text, whatever the text says', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        value: doc(paragraph(text('<script>alert(1)</script>'))) as never,
      }),
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('marks an outward link and leaves a path alone', () => {
    const link = (href: string) =>
      renderToStaticMarkup(
        createElement(RichText, {
          value: doc(paragraph(text('go', [{ type: 'link', attrs: { href } }]))) as never,
        }),
      )
    expect(link('https://example.com')).toContain('rel="noopener noreferrer"')
    expect(link('/about')).not.toContain('rel=')
  })

  it('skips a node it has no case for rather than throwing', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        value: doc({ type: 'table', content: [] }, paragraph(text('after'))) as never,
      }),
    )
    expect(html).toContain('after')
  })

  it('renders an empty value as one empty paragraph, which is what an empty document is', () => {
    expect(renderToStaticMarkup(createElement(RichText, { value: emptyRichText }))).toBe(
      '<div class="rich-text"><p></p></div>',
    )
    // A caller that does not want the blank line asks first; that is what
    // `isEmptyRichText` is for, and the CMS's block view uses it.
    expect(isEmptyRichText(emptyRichText)).toBe(true)
    expect(
      renderToStaticMarkup(createElement(RichText, { value: { type: 'doc', content: [] } })),
    ).toBe('<div class="rich-text"></div>')
  })
})

describe('the helpers that need no validator', () => {
  it('knows an empty value from one with words in it', () => {
    expect(isEmptyRichText(emptyRichText)).toBe(true)
    expect(isEmptyRichText({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true)
    expect(isEmptyRichText(doc(paragraph(text('x'))) as never)).toBe(false)
  })

  it('pulls the plain words out, in order and without the markup', () => {
    const value = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Title')] },
      paragraph(text('One '), text('two', [{ type: 'bold' }])),
    )
    expect(richTextToPlain(value as never)).toBe('Title One two')
  })

  it('reaches no validator, so the front door never needs zod', () => {
    // zod is an OPTIONAL peer: a consumer that renders prose without
    // validating it must still be able to load the package. The only way to
    // break that is for the front door to reach the schema at runtime, so
    // every line in `index.ts` that names it has to be type-only.
    for (const line of source('index.ts').split('\n')) {
      if (!line.includes('./rich-text/schema')) continue
      expect(line, line).toMatch(/^export type \{/)
    }
    expect(source('rich-text/value.ts')).not.toMatch(/from 'zod'/)
  })
})
