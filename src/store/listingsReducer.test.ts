import { describe, expect, it } from 'vitest'
import { needsConfirmation } from '../domain/freshness'
import { buildSeedListings } from '../seed/listings'
import { myListings, pendingFirstOrder, publicListings, reducer, type AppState } from './listingsReducer'

const now = new Date(2026, 9, 15, 12, 0)
const initial: AppState = { listings: buildSeedListings(now), profile: null }
const at = now.toISOString()

describe('listings reducer', () => {
  it('sorts the public list by most recent confirmation', () => {
    const list = publicListings(initial.listings)
    for (let i = 1; i < list.length; i++) expect(list[i - 1].lastConfirmedAt >= list[i].lastConfirmedAt).toBe(true)
  })

  it('a new listing appears first', () => {
    const fresh = { ...initial.listings[0], id: 'new-1', isMine: true, lastConfirmedAt: new Date(now.getTime() + 1000).toISOString() }
    const s = reducer(initial, { type: 'publish', listing: fresh })
    expect(publicListings(s.listings)[0].id).toBe('new-1')
    expect(myListings(s.listings).map((l) => l.id)).toContain('new-1')
  })

  it('"Confirmar todas" resets freshness for several and "Deshacer" restores them (C4)', () => {
    const mine = myListings(initial.listings)
    const ids = mine.slice(0, 2).map((l) => l.id)
    const previous = mine.slice(0, 2).map((l) => ({ id: l.id, lastConfirmedAt: l.lastConfirmedAt }))
    const confirmed = reducer(initial, { type: 'confirmMany', ids, at })
    for (const id of ids) expect(confirmed.listings.find((l) => l.id === id)!.lastConfirmedAt).toBe(at)
    const untouched = initial.listings.find((l) => !ids.includes(l.id))!
    expect(confirmed.listings.find((l) => l.id === untouched.id)).toEqual(untouched)

    const undone = reducer(confirmed, { type: 'restoreConfirmed', previous })
    expect(undone.listings).toEqual(initial.listings)
  })

  it('Mis propiedades: pending ones first, most days unconfirmed on top (C4)', () => {
    const order = pendingFirstOrder(initial.listings, now)
    const mine = order.map((id) => initial.listings.find((l) => l.id === id)!)
    const pendingCount = mine.filter((l) => needsConfirmation(l.lastConfirmedAt, now)).length
    expect(pendingCount).toBeGreaterThan(0)
    mine.forEach((l, i) => expect(needsConfirmation(l.lastConfirmedAt, now), l.id).toBe(i < pendingCount))
    for (let i = 1; i < pendingCount; i++) expect(mine[i - 1].lastConfirmedAt <= mine[i].lastConfirmedAt).toBe(true)
  })

  it('"Sigue disponible" resets freshness', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'confirmAvailable', id, at })
    expect(s.listings.find((l) => l.id === id)!.lastConfirmedAt).toBe(at)
  })

  it('changing the price updates price and freshness', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'changePrice', id, price: 120000, at })
    expect(s.listings.find((l) => l.id === id)).toMatchObject({ price: 120000, lastConfirmedAt: at })
  })

  it('"Marcar vendida" removes it from the public list but keeps it in my listings', () => {
    const id = myListings(initial.listings)[0].id
    const s = reducer(initial, { type: 'markClosed', id, at })
    expect(publicListings(s.listings).some((l) => l.id === id)).toBe(false)
    expect(myListings(s.listings).find((l) => l.id === id)!.status).toBe('closed')
  })

  it('"Deshacer" publishes it again', () => {
    const id = myListings(initial.listings)[0].id
    const closed = reducer(initial, { type: 'markClosed', id, at })
    const reopened = reducer(closed, { type: 'reopen', id })
    expect(publicListings(reopened.listings).some((l) => l.id === id)).toBe(true)
  })

  it('"Volver a publicar" makes it active again, confirmed today and first in the public list (D2)', () => {
    const id = myListings(initial.listings)[0].id
    const closed = reducer(initial, { type: 'markClosed', id, at: '2026-01-01T12:00:00.000Z' })
    expect(closed.listings.find((l) => l.id === id)!.closedAt).toBe('2026-01-01T12:00:00.000Z')
    const later = '2099-01-01T12:00:00.000Z'
    const s = reducer(closed, { type: 'republish', id, at: later })
    expect(s.listings.find((l) => l.id === id)).toMatchObject({ status: 'active', lastConfirmedAt: later, closedAt: undefined })
    expect(publicListings(s.listings)[0].id).toBe(id)
  })

  it('"Deshacer" after "Volver a publicar" closes it again with its previous dates (D2)', () => {
    const id = myListings(initial.listings)[0].id
    const closed = reducer(initial, { type: 'markClosed', id, at })
    const before = closed.listings.find((l) => l.id === id)!
    const republished = reducer(closed, { type: 'republish', id, at: '2099-01-01T12:00:00.000Z' })
    const undone = reducer(republished, { type: 'restoreClosed', id, lastConfirmedAt: before.lastConfirmedAt, closedAt: before.closedAt })
    expect(undone.listings.find((l) => l.id === id)).toEqual(before)
  })

  it('after registering the profile, own listings show it', () => {
    const profile = { name: 'Ana Pérez', whatsapp: '+59171234567', memberSince: at }
    const s = reducer(initial, { type: 'setProfile', profile })
    expect(s.profile).toEqual(profile)
    expect(myListings(s.listings).every((l) => l.agent.name === 'Ana Pérez')).toBe(true)
    expect(s.listings.filter((l) => !l.isMine).some((l) => l.agent.name === 'Ana Pérez')).toBe(false)
  })
})
