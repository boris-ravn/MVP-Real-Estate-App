import type { Agent, Listing } from '../domain/listing'
import { needsConfirmation } from '../domain/freshness'

export interface AppState {
  listings: Listing[]
  /** Participant's name and WhatsApp; requested the first time they publish. */
  profile: Agent | null
}

export type Action =
  | { type: 'publish'; listing: Listing }
  | { type: 'confirmAvailable'; id: string; at: string }
  /** "Confirmar todas" (Confirm all) (C4). */
  | { type: 'confirmMany'; ids: string[]; at: string }
  /** Undo "Confirmar todas": restores each one to its previous date. */
  | { type: 'restoreConfirmed'; previous: { id: string; lastConfirmedAt: string }[] }
  | { type: 'changePrice'; id: string; price: number; at: string }
  | { type: 'markClosed'; id: string }
  | { type: 'reopen'; id: string }
  | { type: 'setProfile'; profile: Agent }
  | { type: 'reset'; state: AppState }

function update(listings: Listing[], id: string, patch: Partial<Listing>): Listing[] {
  return listings.map((l) => (l.id === id ? { ...l, ...patch } : l))
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'publish':
      return { ...state, listings: [action.listing, ...state.listings] }
    case 'confirmAvailable':
      return { ...state, listings: update(state.listings, action.id, { lastConfirmedAt: action.at }) }
    case 'confirmMany':
      return { ...state, listings: state.listings.map((l) => (action.ids.includes(l.id) ? { ...l, lastConfirmedAt: action.at } : l)) }
    case 'restoreConfirmed': {
      const prev = new Map(action.previous.map((p) => [p.id, p.lastConfirmedAt]))
      return { ...state, listings: state.listings.map((l) => (prev.has(l.id) ? { ...l, lastConfirmedAt: prev.get(l.id)! } : l)) }
    }
    case 'changePrice':
      // Changing the price also confirms the information is up to date.
      return { ...state, listings: update(state.listings, action.id, { price: action.price, lastConfirmedAt: action.at }) }
    case 'markClosed':
      return { ...state, listings: update(state.listings, action.id, { status: 'closed' }) }
    case 'reopen':
      return { ...state, listings: update(state.listings, action.id, { status: 'active' }) }
    case 'setProfile':
      // The participant's own listings now show their real profile.
      return {
        profile: action.profile,
        listings: state.listings.map((l) => (l.isMine ? { ...l, agent: action.profile } : l)),
      }
    case 'reset':
      return action.state
  }
}

/** Public listing: active ones, sorted by most recent confirmation. */
export function publicListings(listings: Listing[]): Listing[] {
  return listings
    .filter((l) => l.status === 'active')
    .sort((a, b) => b.lastConfirmedAt.localeCompare(a.lastConfirmedAt))
}

export function myListings(listings: Listing[]): Listing[] {
  return listings.filter((l) => l.isMine)
}

/**
 * Order for Mis propiedades · Activas (My listings · Active) (C4): first those needing confirmation
 * (most days unconfirmed on top), then the rest, newest first. The screen computes it on entry.
 */
export function pendingFirstOrder(listings: Listing[], now: Date = new Date()): string[] {
  const active = myListings(listings).filter((l) => l.status === 'active')
  const pending = active.filter((l) => needsConfirmation(l.lastConfirmedAt, now)).sort((a, b) => a.lastConfirmedAt.localeCompare(b.lastConfirmedAt))
  const rest = active.filter((l) => !pending.includes(l)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return [...pending, ...rest].map((l) => l.id)
}
