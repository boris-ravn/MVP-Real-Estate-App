import { describe, expect, it } from 'vitest'
import { parseListing } from '../parser/parseListing'
import { SEED_MESSAGES } from '../seed/messages'
import { draftFromParsed, draftSummary, draftToListing, EMPTY_DRAFT, missingRequired, pendingAtStart, relevantFields } from './draft'

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

  it('conserva las expensas detectadas en alquiler (C5)', () => {
    const text = 'Alquilo depto en Cala Cala, 2 dorm, Bs 3.800, expensas Bs 250'
    const draft = draftFromParsed(parseListing(text), text)
    expect(draft.rentExpenses).toBe(250)
    expect(relevantFields(draft)).toContain('rentExpenses')
    expect(draftToListing(draft, agent, now).rentExpenses).toBe(250)
  })

  it('las expensas no aplican fuera de alquiler', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'departamento' as const, zone: 'Sarco' as const, price: 90000, rentExpenses: 300 }
    expect(relevantFields(draft)).not.toContain('rentExpenses')
    expect(draftToListing(draft, agent, now).rentExpenses).toBeNull()
  })

  it('"Te falta" al llegar: los campos sin dato más los sugeridos (C2)', () => {
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

  it('resume lo detectado en una línea, en el orden de la ficha (C2)', () => {
    const text = SEED_MESSAGES[1].text
    const draft = draftFromParsed(parseListing(text), text)
    expect(draftSummary(draft, ['operation', 'type', 'price', 'bedrooms', 'garage', 'pets', 'commissionShare'])).toBe(
      'Departamento · Alquiler · Bs 3.500 · 2 dorm · Garaje · Mascotas · Comparte 50%',
    )
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
