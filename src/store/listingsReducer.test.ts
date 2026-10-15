import { describe, expect, it } from 'vitest'
import { buildSeedListings } from '../seed/listings'
import { myListings, publicListings, reducer, type AppState } from './listingsReducer'

const now = new Date(2026, 9, 15, 12, 0)
const initial: AppState = { listings: buildSeedListings(now), profile: null }
const at = now.toISOString()

describe('reducer de propiedades', () => {
  it('ordena el listado público por confirmación más reciente', () => {
    const list = publicListings(initial.listings)
    for (let i = 1; i < list.length; i++) expect(list[i - 1].lastConfirmedAt >= list[i].lastConfirmedAt).toBe(true)
  })

  it('una publicación nueva aparece primero', () => {
    const fresh = { ...initial.listings[0], id: 'new-1', isMine: true, lastConfirmedAt: new Date(now.getTime() + 1000).toISOString() }
    const s = reducer(initial, { type: 'publish', listing: fresh })
    expect(publicListings(s.listings)[0].id).toBe('new-1')
    expect(myListings(s.listings).map((l) => l.id)).toContain('new-1')
  })

  it('"Sigue disponible" reinicia la frescura', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'confirmAvailable', id, at })
    expect(s.listings.find((l) => l.id === id)!.lastConfirmedAt).toBe(at)
  })

  it('cambiar precio actualiza precio y frescura', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'changePrice', id, price: 120000, at })
    expect(s.listings.find((l) => l.id === id)).toMatchObject({ price: 120000, lastConfirmedAt: at })
  })

  it('"Marcar vendida" la saca del listado público pero sigue en mis propiedades', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'markClosed', id })
    expect(publicListings(s.listings).some((l) => l.id === id)).toBe(false)
    expect(myListings(s.listings).find((l) => l.id === id)!.status).toBe('closed')
  })

  it('"Deshacer" vuelve a publicarla', () => {
    const id = myListings(initial.listings)[0].id
    const closed = reducer(initial, { type: 'markClosed', id })
    const reopened = reducer(closed, { type: 'reopen', id })
    expect(publicListings(reopened.listings).some((l) => l.id === id)).toBe(true)
  })

  it('al registrar el perfil, las propiedades propias lo muestran', () => {
    const profile = { name: 'Ana Pérez', whatsapp: '+59171234567', memberSince: at }
    const s = reducer(initial, { type: 'setProfile', profile })
    expect(s.profile).toEqual(profile)
    expect(myListings(s.listings).every((l) => l.agent.name === 'Ana Pérez')).toBe(true)
    expect(s.listings.filter((l) => !l.isMine).some((l) => l.agent.name === 'Ana Pérez')).toBe(false)
  })
})
