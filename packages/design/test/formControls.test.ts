/**
 * The two form-control gaps 0.6.0 closed, pinned.
 *
 * Both shipped with no test of their own. They are additive props, so the
 * gallery's visual baselines could not have caught a regression in either:
 * nothing they change is visible, and every existing caller renders exactly
 * the markup it did before. What they change is whether a control can be used
 * in a plain `<form action={…}>` at all, which is a question about attributes
 * — so these assert on the rendered attributes.
 *
 * Server-rendered, like `markdown.test.ts`, because the interesting output is
 * the markup and not the interaction. React Aria owns the behaviour; what is
 * worth pinning is that this package hands it the props.
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Checkbox from '../src/components/Checkbox'
import Field, { type FieldWiring } from '../src/components/Field'

describe('Checkbox posts itself', () => {
  /**
   * The defect: `checked` and `onChange` were required and there was no
   * `name`, so a caller wanting one boolean in a Server Action had nothing to
   * submit under and rendered a native tick box in its own `<label>` — the
   * control this component exists to replace. manage's break-glass form and
   * the template's carried one.
   */
  it('renders a named input, so a form has something to submit', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { label: 'Read only', name: 'readOnly' }),
    )
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('name="readOnly"')
  })

  it('takes a value, because the browser default `on` is rarely the word wanted', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { label: 'Audit', name: 'available', value: 'audit:read' }),
    )
    expect(html).toContain('name="available"')
    expect(html).toContain('value="audit:read"')
  })

  /**
   * The subtle half. `isSelected` has to stay `undefined` for React Aria to
   * leave the box uncontrolled; passing `false` instead would pin every
   * uncontrolled box to off and silently discard `defaultChecked`.
   */
  it('starts checked from defaultChecked, with no controlled props at all', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { label: 'On', name: 'x', defaultChecked: true }),
    )
    expect(html).toContain('checked=""')
  })

  it('starts unchecked when neither is given, and is still submittable', () => {
    const html = renderToStaticMarkup(createElement(Checkbox, { label: 'Off', name: 'x' }))
    expect(html).toContain('name="x"')
    expect(html).not.toContain('checked=""')
  })

  it('is still controlled when checked is given', () => {
    const on = renderToStaticMarkup(
      createElement(Checkbox, { label: 'On', checked: true, onChange: () => {} }),
    )
    const off = renderToStaticMarkup(
      createElement(Checkbox, { label: 'Off', checked: false, onChange: () => {} }),
    )
    expect(on).toContain('checked=""')
    expect(off).not.toContain('checked=""')
  })

  /**
   * `checked` wins over `defaultChecked` — React's own rule, and worth
   * pinning because passing both is how a caller migrating from controlled to
   * uncontrolled leaves it half-done.
   */
  it('prefers checked over defaultChecked when a caller passes both', () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, {
        label: 'x',
        checked: false,
        defaultChecked: true,
        onChange: () => {},
      }),
    )
    expect(html).not.toContain('checked=""')
  })
})

describe('Field names a control a label cannot', () => {
  /**
   * `htmlFor` names an `<input>` and nothing else. A `Select` is a `<button>`
   * and a button takes its accessible name from its contents, so a caller who
   * wrapped one in a `Field` got a label on screen and a control announcing
   * only its current value. The workaround was an `aria-label` repeating the
   * label string, which is two literals and two chances to drift -- the exact
   * bug this component exists to prevent.
   *
   * The render callbacks are named consts rather than inline arrows so they
   * carry their own annotation: `createElement`'s three-argument form does not
   * infer the parameter from `Field`'s type.
   */
  /**
   * `createElement`'s three-argument form does not reconcile with `Field`'s
   * required `children`, so the render function goes in the props object.
   */
  const field = (
    props: Omit<Parameters<typeof Field>[0], 'children'>,
    children: (f: FieldWiring) => ReturnType<typeof createElement>,
  ) => createElement(Field, { ...props, children })

  const labelled = (f: FieldWiring) =>
    createElement('button', { type: 'button', id: f.id, 'aria-labelledby': f.labelId }, 'Choose')

  it('gives the label an id, and hands it to the child as labelId', () => {
    const html = renderToStaticMarkup(field({ label: 'Parent team' }, labelled))
    const labelId = /<label id="([^"]+)"/.exec(html)?.[1]
    expect(labelId).toBeTruthy()
    expect(html).toContain(`aria-labelledby="${labelId}"`)
  })

  it('labelId is distinct from the control id, so the two never collide', () => {
    let seen: { id: string; labelId: string } | undefined
    const capture = (f: FieldWiring) => {
      seen = { id: f.id, labelId: f.labelId }
      return createElement('button', { type: 'button', id: f.id }, 'Choose')
    }
    renderToStaticMarkup(field({ label: 'Team' }, capture))
    expect(seen?.id).toBeTruthy()
    expect(seen?.labelId).toBeTruthy()
    expect(seen?.labelId).not.toBe(seen?.id)
  })

  /** The label still points at the control, which is what an `<input>` needs. */
  it('keeps htmlFor pointing at the control id', () => {
    const input = (f: FieldWiring) => createElement('input', { id: f.id })
    const html = renderToStaticMarkup(field({ label: 'Name' }, input))
    const controlId = /<input id="([^"]+)"/.exec(html)?.[1]
    expect(controlId).toBeTruthy()
    expect(html).toContain(`for="${controlId}"`)
  })

  /** A hidden label is still an element with an id, so `labelId` still works. */
  it('still provides labelId when the label is visually hidden', () => {
    const html = renderToStaticMarkup(field({ label: 'Search', labelHidden: true }, labelled))
    const labelId = /<label id="([^"]+)"[^>]*class="sr-only"/.exec(html)?.[1]
    expect(labelId).toBeTruthy()
    expect(html).toContain(`aria-labelledby="${labelId}"`)
  })
})
