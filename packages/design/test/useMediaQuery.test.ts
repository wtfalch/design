// @vitest-environment jsdom
/**
 * `useMediaQuery`, mounted.
 *
 * jsdom's own `matchMedia` never matches anything -- it does no layout -- so
 * every case here hands the hook a fake `MediaQueryList` and flips it by
 * hand, the same substitution a real browser needs no help with. Mounted
 * with `createRoot` rather than rendered to a string, like
 * `HtmlBody.test.tsx` in `@wtfalch/email`: what is under test is the effect
 * that subscribes and reacts to a `change` event, and a static render never
 * runs one. The windowless case is `layout.test.ts`, under the default node
 * environment, where jsdom has not defined a `window` to begin with.
 */
import { act, createElement } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useMediaQuery } from '../src/layout'

class FakeMediaQueryList {
  matches: boolean
  private listeners = new Set<() => void>()

  constructor(matches: boolean) {
    this.matches = matches
  }

  get subscriberCount() {
    return this.listeners.size
  }

  addEventListener(_type: 'change', listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'change', listener: () => void) {
    this.listeners.delete(listener)
  }

  /** Flips the query, the way a real one does when the window crosses it. */
  set(matches: boolean) {
    this.matches = matches
    for (const listener of this.listeners) listener()
  }
}

type Stubbable = { matchMedia?: (query: string) => MediaQueryList }

function stubMatchMedia(mql: FakeMediaQueryList | undefined) {
  ;(window as unknown as Stubbable).matchMedia = mql
    ? () => mql as unknown as MediaQueryList
    : undefined
}

let container: HTMLDivElement
let root: Root
let values: boolean[]

function Probe({ query }: { query: string }) {
  values.push(useMediaQuery(query))
  return null
}

beforeEach(() => {
  container = document.body.appendChild(document.createElement('div'))
  root = createRoot(container)
  values = []
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  stubMatchMedia(undefined)
})

describe('useMediaQuery, matchMedia present', () => {
  it('reads the current match on mount', () => {
    stubMatchMedia(new FakeMediaQueryList(true))
    act(() => root.render(createElement(Probe, { query: '(min-width: 860px)' })))
    expect(values.at(-1)).toBe(true)
  })

  it('updates when the query flips', () => {
    const mql = new FakeMediaQueryList(false)
    stubMatchMedia(mql)
    act(() => root.render(createElement(Probe, { query: '(min-width: 860px)' })))
    expect(values.at(-1)).toBe(false)

    act(() => mql.set(true))
    expect(values.at(-1)).toBe(true)

    act(() => mql.set(false))
    expect(values.at(-1)).toBe(false)
  })

  it('unsubscribes on unmount, so a later change touches nothing torn down', () => {
    const mql = new FakeMediaQueryList(false)
    stubMatchMedia(mql)
    act(() => root.render(createElement(Probe, { query: '(min-width: 860px)' })))
    expect(mql.subscriberCount).toBe(1)

    act(() => root.unmount())
    expect(mql.subscriberCount).toBe(0)
  })
})

describe('useMediaQuery, matchMedia absent', () => {
  it('reads false and subscribes to nothing', () => {
    stubMatchMedia(undefined)
    act(() => root.render(createElement(Probe, { query: '(min-width: 860px)' })))
    expect(values.at(-1)).toBe(false)
  })
})
