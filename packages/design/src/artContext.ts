import { createContext, useContext } from 'react'
import type { ArtPack } from './art'

/**
 * The installed art pack, or null for tf's. Its own module rather than part
 * of `art.tsx`, because the three components read it and `art.tsx` imports
 * the three components: a cycle at run time is a `useContext` of `undefined`.
 */
export const ArtContext = createContext<ArtPack | null>(null)

export function useArt(): ArtPack | null {
  return useContext(ArtContext)
}
