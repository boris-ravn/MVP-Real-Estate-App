import { useEffect, useReducer, type ReactNode } from 'react'
import type { Agent, Listing } from '../domain/listing'
import { seedState, StoreContext } from './context'
import { reducer, type AppState } from './listingsReducer'
import { KEYS, readJSON, writeJSON } from './storage'

/** First use: loads the seed. Afterwards: whatever is saved in localStorage. */
function loadState(): AppState {
  const listings = readJSON<Listing[]>(KEYS.listings)
  if (!listings) return seedState()
  return { listings, profile: readJSON<Agent>(KEYS.profile) }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    writeJSON(KEYS.listings, state.listings)
    if (state.profile) writeJSON(KEYS.profile, state.profile)
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}
