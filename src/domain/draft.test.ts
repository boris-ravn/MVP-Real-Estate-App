import { describe, expect, it } from 'vitest'
import { parseListing } from '../parser/parseListing'
import { SEED_MESSAGES } from '../seed/messages'
import { draftFromParsed, draftToListing, EMPTY_DRAFT, missingRequired, relevantFields } from './draft'

const agent = { name: 'Ana Pérez', whatsapp: '+59171234567', memberSince: '2026-10-15T12:00:00.000Z' }
const now = new Date(2026, 9, 15, 12)

describe('borrador de publicación', () => {
  it('un mensaje semilla produce una ficha publicable con "Confirmado hoy"', () => {
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

  it('exige operación, tipo, zona y precio', () => {
    expect(missingRequired(EMPTY_DRAFT)).toEqual(['operation', 'type', 'zone', 'price'])
    expect(() => draftToListing(EMPTY_DRAFT, agent, now)).toThrow()
  })

  it('los campos relevantes dependen del tipo y la operación', () => {
    const land = relevantFields({ type: 'terreno', operation: 'venta' })
    expect(land).not.toContain('bedrooms')
    expect(land).toContain('landM2')
    expect(relevantFields({ type: 'departamento', operation: 'alquiler' })).toContain('rentGuarantee')
    expect(relevantFields({ type: 'departamento', operation: 'alquiler' })).not.toContain('bankCredit')
  })

  it('descarta datos que no aplican al tipo final', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'terreno' as const, zone: 'Sacaba' as const, price: 50000, bedrooms: 3 }
    expect(draftToListing(draft, agent, now).bedrooms).toBeNull()
  })
})
