import { createContext, useContext, type Dispatch } from 'react'
import { buildSeedListings } from '../seed/listings'
import { clearEvents } from './events'
import type { Action, AppState } from './listingsReducer'
import { KEYS, removeKeys } from './storage'

export const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)

export function seedState(): AppState {
  return { listings: buildSeedListings(), profile: null }
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** "Reiniciar demo" (Reset demo): goes back to the seed, clears profile and events. For use between participants. */
export function resetDemo(dispatch: Dispatch<Action>): void {
  removeKeys([KEYS.listings, KEYS.profile])
  clearEvents()
  dispatch({ type: 'reset', state: seedState() })
}
