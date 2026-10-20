import { describe, expect, it } from 'vitest'
import { parseListing } from '../parser/parseListing'
import { SEED_MESSAGES } from '../seed/messages'
import { draftFromParsed, draftSummary, draftToListing, EMPTY_DRAFT, growPending, missingRequired, pendingAtStart, relevantFields } from './draft'

const agent = { name: 'Ana Pérez', whatsapp: '+59171234567', memberSince: '2026-10-15T12:00:00.000Z' }
const now = new Date(2026, 9, 15, 12)

describe('publish draft', () => {
  it('a seed message produces a publishable listing with "Confirmado hoy"', () => {
    const text = SEED_MESSAGES[1].text
    const draft = draftFromParsed(parseListing(text), text)
    expect(missingRequired(draft)).toEqual([])
    const l = draftToListing(draft, agent, now)
    expect(l).toMatchObject({
      operation: 'alquiler',
      type: 'departamento',
      zone: 'Cala Cala',
      price: 3500,
      currency: 'BOB',
      isMine: true,
      status: 'active',
      lastConfirmedAt: now.toISOString(),
      agent,
      description: text,
    })
  })

  it('keeps detected HOA fees on rentals (C5)', () => {
    const text = 'Alquilo depto en Cala Cala, 2 dorm, Bs 3.800, expensas Bs 250'
    const draft = draftFromParsed(parseListing(text), text)
    expect(draft.rentExpenses).toBe(250)
    expect(relevantFields(draft)).toContain('rentExpenses')
    expect(draftToListing(draft, agent, now).rentExpenses).toBe(250)
  })

  it('HOA fees do not apply outside rentals', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'departamento' as const, zone: 'Sarco' as const, price: 90000, rentExpenses: 300 }
    expect(relevantFields(draft)).not.toContain('rentExpenses')
    expect(draftToListing(draft, agent, now).rentExpenses).toBeNull()
  })

  it('"Te falta" on arrival: fields without data plus suggested ones (C2)', () => {
    const text = 'Alquilo dpto 2 dorm por Av. Heroínas, 4 mil Bs, c/garaje. Comparto 50%'
    const parsed = parseListing(text)
    const draft = draftFromParsed(parsed, text)
    const pending = pendingAtStart(draft, parsed.suggested)
    expect(pending).toContain('zone')
    expect(pending).toContain('bathrooms')
    expect(pending).toContain('rentExpenses')
    expect(pending).not.toContain('price')
    expect(pending).not.toContain('garage')
  })

  it('fields that become relevant later stay in "Te falta" once filled in', () => {
    // Manual flow: no operation yet, so Garantía and Expensas are not relevant on arrival.
    let pending = pendingAtStart(EMPTY_DRAFT)
    expect(pending).not.toContain('rentGuarantee')
    const rent = { ...EMPTY_DRAFT, operation: 'alquiler' as const }
    pending = growPending(pending, rent)
    expect(pending).toContain('rentGuarantee')
    expect(pending).toContain('rentExpenses')
    // Filling them in does not take them out.
    const filled = { ...rent, rentGuarantee: '2 meses', rentExpenses: 250 }
    expect(growPending(pending, filled)).toBe(pending)
  })

  it('summarizes what was detected in one line, in listing order (C2)', () => {
    const text = SEED_MESSAGES[1].text
    const draft = draftFromParsed(parseListing(text), text)
    expect(draftSummary(draft, ['operation', 'type', 'price', 'bedrooms', 'garage', 'pets', 'commissionShare'])).toBe(
      'Departamento · Alquiler · Bs 3.500 · 2 dorm · Garaje · Mascotas · Comparte 50%',
    )
  })

  it('requires operation, type, zone and price', () => {
    expect(missingRequired(EMPTY_DRAFT)).toEqual(['operation', 'type', 'zone', 'price'])
    expect(() => draftToListing(EMPTY_DRAFT, agent, now)).toThrow()
  })

  it('relevant fields depend on type and operation', () => {
    const land = relevantFields({ type: 'terreno', operation: 'venta' })
    expect(land).not.toContain('bedrooms')
    expect(land).toContain('landM2')
    expect(relevantFields({ type: 'departamento', operation: 'alquiler' })).toContain('rentGuarantee')
    expect(relevantFields({ type: 'departamento', operation: 'alquiler' })).not.toContain('bankCredit')
  })

  it('drops data that does not apply to the final type', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'terreno' as const, zone: 'Sacaba' as const, price: 50000, bedrooms: 3 }
    expect(draftToListing(draft, agent, now).bedrooms).toBeNull()
  })
})
