/**
 * The identity disc's two letters and its hue.
 *
 * Pure, and worth testing on their own: the initials are read by nobody --
 * the disc is `aria-hidden` -- so a wrong one is invisible to every automated
 * check and to anybody using a screen reader, and only shows up as a `?` in a
 * list somebody eventually mentions.
 */
import { describe, expect, it } from 'vitest'

import { hueOf, initialsOf } from '../src/components/initials'

describe('initialsOf', () => {
  it('takes the first and last word of a name', () => {
    expect(initialsOf('Ada Lovelace', 'ada@example.com')).toBe('AL')
    expect(initialsOf('Ada Byron King Lovelace', 'ada@example.com')).toBe('AL')
  })

  it('takes one letter from a single name', () => {
    expect(initialsOf('Ada', 'ada@example.com')).toBe('A')
  })

  it('does not split on punctuation', () => {
    // "OB" and "SJ" are worse than the single letter they replace.
    expect(initialsOf("Grace O'Brien", 'grace@example.net')).toBe('GO')
    expect(initialsOf('Ada Smith-Jones', 'ada@example.com')).toBe('AS')
  })

  it('falls back to the address when there is no name', () => {
    // Most machine senders have no display name.
    expect(initialsOf(null, 'noreply@notifications.example.org')).toBe('N')
    expect(initialsOf(undefined, 'billing@example.com')).toBe('B')
    expect(initialsOf('   ', 'billing@example.com')).toBe('B')
  })

  it('never returns an empty disc', () => {
    expect(initialsOf(null, '')).toBe('?')
  })

  it('handles a name outside the Latin alphabet', () => {
    expect(initialsOf('Åse Øien', 'ase@example.no')).toBe('ÅØ')
  })
})

describe('hueOf', () => {
  it('is the same for the same address', () => {
    expect(hueOf('ada@example.com')).toBe(hueOf('ada@example.com'))
  })

  it('ignores case and surrounding space', () => {
    // One person written two ways must not be two colours.
    expect(hueOf('  Ada@Example.COM ')).toBe(hueOf('ada@example.com'))
  })

  it('is a legal hue', () => {
    for (const address of ['a@b.c', 'ada@example.com', '', 'x'.repeat(200)]) {
      const hue = hueOf(address)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
      expect(Number.isInteger(hue)).toBe(true)
    }
  })

  it('spreads neighbouring addresses apart', () => {
    // The colour is a cue that two rows share a sender. Addresses one letter
    // apart landing on one hue would make it a cue that lies.
    const hues = ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com'].map(hueOf)
    expect(new Set(hues).size).toBe(4)
  })
})
