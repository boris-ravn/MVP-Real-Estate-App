import type { Agent, Listing } from '../domain/listing'

export interface AppState {
  listings: Listing[]
  /** Nombre y WhatsApp del participante; se pide la primera vez que publica. */
  profile: Agent | null
}

export type Action =
  | { type: 'publish'; listing: Listing }
  | { type: 'confirmAvailable'; id: string; at: string }
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
    case 'changePrice':
      // Cambiar el precio también confirma que la información está al día.
      return { ...state, listings: update(state.listings, action.id, { price: action.price, lastConfirmedAt: action.at }) }
    case 'markClosed':
      return { ...state, listings: update(state.listings, action.id, { status: 'closed' }) }
    case 'reopen':
      return { ...state, listings: update(state.listings, action.id, { status: 'active' }) }
    case 'setProfile':
      // Las propiedades propias pasan a mostrar el perfil real del participante.
      return {
        profile: action.profile,
        listings: state.listings.map((l) => (l.isMine ? { ...l, agent: action.profile } : l)),
      }
    case 'reset':
      return action.state
  }
}

/** Listado público: activas, ordenadas por confirmación más reciente. */
export function publicListings(listings: Listing[]): Listing[] {
  return listings
    .filter((l) => l.status === 'active')
    .sort((a, b) => b.lastConfirmedAt.localeCompare(a.lastConfirmedAt))
}

export function myListings(listings: Listing[]): Listing[] {
  return listings.filter((l) => l.isMine)
}
