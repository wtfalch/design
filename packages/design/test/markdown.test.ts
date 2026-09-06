/**
 * Markdown renders on a server.
 *
 * DOMPurify sanitises through a DOM and a server has none; `sanitize` is not
 * a function there. The first app to server-render a comment through this
 * component crashed the whole subtree. So the server gets the words, escaped
 * by React, and the sanitised HTML arrives after mount. This test is the
 * server half: no crash, the text present, nothing rendered as HTML.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Markdown from '../src/components/Markdown'

describe('Markdown on the server', () => {
  it('renders the text escaped and never as HTML', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, { text: 'Hello **world** <script>alert(1)</script>' }),
    )
    expect(html).toContain('data-md="plain"')
    expect(html).toContain('Hello **world** &lt;script&gt;')
    expect(html).not.toContain('<strong>')
    expect(html).not.toContain('<script>')
  })

  it('renders nothing for an empty string', () => {
    expect(renderToStaticMarkup(createElement(Markdown, { text: '' }))).toBe('')
  })
})
