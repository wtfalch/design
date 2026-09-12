/**
 * `<Field>{(f) => <Input {...f} />}</Field>` must not put `labelId` on the
 * input.
 *
 * `FieldWiring` carries four things and three of them are DOM attributes.
 * `labelId` is the fourth: it exists for `Select`, which is a `<button>` and
 * takes its accessible name from its contents, so a `<label for>` does not
 * name it. An `<input>` has no use for it -- `Field`'s label already names it
 * through `htmlFor`.
 *
 * The spread does not know that. React passes through any prop it does not
 * recognise, so `labelId` reached the DOM as `labelid="…"`, and every field
 * in valet and tf logged a React warning about it. Nothing failed, which is
 * why it survived four releases: the attribute is inert and the warning only
 * appears in a console nobody was reading.
 *
 * Server-rendered, like `formControls.test.ts`: the question is which
 * attributes come out.
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Field, { type FieldWiring } from '../src/components/Field'
import Input from '../src/components/Input'
import Textarea from '../src/components/Textarea'

/* Typed as the render prop really is, so the test spreads what a caller
   spreads rather than an `any` that would prove nothing. */
const CONTROLS = [
  ['Input', (f: FieldWiring) => createElement(Input, f)],
  ['Textarea', (f: FieldWiring) => createElement(Textarea, f)],
] as const

describe('a control spread with the whole of its field wiring', () => {
  for (const [name, render] of CONTROLS) {
    it(`${name} keeps labelId off the DOM node`, () => {
      const html = renderToStaticMarkup(
        createElement(Field, {
          label: 'Server URL',
          // biome-ignore lint/correctness/noChildrenProp: `createElement`'s typing wants `children` in the props object; the positional form fails the overload.
          children: render,
        }),
      )
      expect(html).not.toContain('labelid')
      expect(html).not.toContain('labelId')
    })

    it(`${name} still takes the three that are attributes`, () => {
      // the guard has to be narrow: dropping the whole spread would also pass
      // the assertion above, and that would unwire the control entirely.
      const html = renderToStaticMarkup(
        createElement(Field, {
          label: 'Server URL',
          hint: 'An SSE endpoint.',
          error: 'Required.',
          // biome-ignore lint/correctness/noChildrenProp: `createElement`'s typing wants `children` in the props object; the positional form fails the overload.
          children: render,
        }),
      )
      expect(html).toMatch(/id="[^"]+"/)
      expect(html).toContain('aria-describedby=')
      expect(html).toContain('aria-invalid="true"')
    })
  }
})
