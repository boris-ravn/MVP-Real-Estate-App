import { describe, expect, it } from 'vitest'
import { parseListing } from '../parser/parseListing'
import { SEED_MESSAGES } from '../seed/messages'
import { addBack, askedFields, draftCurrency, draftFromParsed, draftSummary, draftToListing, EMPTY_DRAFT, fieldsIn, growPending, keepFilledFields, markNotApplicable, missingRequired, pendingAtStart, type Draft } from './draft'

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
    expect(askedFields(draft)).toContain('rentExpenses')
    expect(draftToListing(draft, agent, now).rentExpenses).toBe(250)
  })

  it('HOA fees do not apply outside rentals', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'departamento' as const, zone: 'Sarco' as const, price: 90000, rentExpenses: 300 }
    expect(fieldsIn(draft, 'asked')).not.toContain('rentExpenses')
    expect(fieldsIn(draft, 'optional')).not.toContain('rentExpenses')
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
    pending = growPending(pending, EMPTY_DRAFT, rent)
    expect(pending).toContain('rentGuarantee')
    expect(pending).toContain('rentExpenses')
    // Filling them in does not take them out.
    const filled = { ...rent, rentGuarantee: '2 meses', rentExpenses: 250 }
    expect(growPending(pending, rent, filled)).toBe(pending)
  })

  it('clearing a detected field to correct it does not move it to "Te falta"', () => {
    const text = SEED_MESSAGES[1].text
    const draft = draftFromParsed(parseListing(text), text)
    const pending = pendingAtStart(draft)
    expect(pending).not.toContain('price')
    const cleared = { ...draft, price: null }
    expect(growPending(pending, draft, cleared)).not.toContain('price')
  })

  it('summarizes what was detected in one line, in listing order (C2)', () => {
    const text = SEED_MESSAGES[1].text
    const draft = draftFromParsed(parseListing(text), text)
    expect(draftSummary(draft, ['operation', 'type', 'price', 'bedrooms', 'garage', 'pets', 'commissionShare'])).toBe(
      'Departamento · Alquiler · Bs 3.500 · 2 dorm · Garaje · Mascotas · Comparte 50%',
    )
  })

  it('keeps the currency written in the message, even if it is not the usual one for the operation', () => {
    const sale = 'Venta dpto en Sarco 3 dorm Bs 650.000'
    expect(draftToListing(draftFromParsed(parseListing(sale), sale), agent, now)).toMatchObject({ price: 650000, currency: 'BOB' })
    const rent = 'Alquilo depto en Sarco 2 dorm $us 500'
    expect(draftToListing(draftFromParsed(parseListing(rent), rent), agent, now)).toMatchObject({ price: 500, currency: 'USD' })
  })

  it('without a currency in the message, it follows the operation (also after changing it)', () => {
    const text = 'Alquilo depto en Sarco 2 dorm, precio 3.500'
    const draft = draftFromParsed(parseListing(text), text)
    expect(draft.currency).toBeNull()
    expect(draftCurrency(draft)).toBe('BOB')
    expect(draftCurrency({ ...draft, operation: 'venta' })).toBe('USD')
    expect(draftCurrency({ ...draft, currency: 'USD' })).toBe('USD')
  })

  it('requires operation, type, zone and price', () => {
    expect(missingRequired(EMPTY_DRAFT)).toEqual(['operation', 'type', 'zone', 'price'])
    expect(() => draftToListing(EMPTY_DRAFT, agent, now)).toThrow()
  })

  it('asked fields depend on type and operation', () => {
    const land = askedFields({ ...EMPTY_DRAFT, type: 'terreno', operation: 'venta' })
    expect(land).not.toContain('bedrooms')
    expect(land).toContain('landM2')
    expect(askedFields({ ...EMPTY_DRAFT, type: 'departamento', operation: 'alquiler' })).toContain('rentGuarantee')
    expect(askedFields({ ...EMPTY_DRAFT, type: 'departamento', operation: 'alquiler' })).not.toContain('bankCredit')
  })

  it('drops data that does not apply to the final type', () => {
    const draft = { ...EMPTY_DRAFT, operation: 'venta' as const, type: 'terreno' as const, zone: 'Sacaba' as const, price: 50000, bedrooms: 3 }
    expect(draftToListing(draft, agent, now).bedrooms).toBeNull()
  })

  describe('sections in Revisar (PRD v3 D1)', () => {
    const houseSale: Draft = { ...EMPTY_DRAFT, operation: 'venta', type: 'casa', zone: 'Tiquipaya', price: 128000 }

    it('a house for sale does not ask for pets or storage: both are under "No aplica"', () => {
      expect(askedFields(houseSale)).not.toContain('pets')
      expect(fieldsIn(houseSale, 'notApplicable')).toEqual(['pets', 'storage'])
      expect(fieldsIn(houseSale, 'optional')).toEqual(['utilities'])
    })

    it('an apartment for sale has pets under "Más datos"; an apartment for rent asks for pets, guarantee and HOA fees', () => {
      expect(fieldsIn({ ...houseSale, type: 'departamento' }, 'optional')).toContain('pets')
      const rent = askedFields({ ...houseSale, type: 'departamento', operation: 'alquiler' })
      expect(rent).toEqual(expect.arrayContaining(['pets', 'rentGuarantee', 'rentExpenses']))
    })

    it('a detected value is never hidden: "con baulera" on a house for sale goes to "Más datos"', () => {
      const text = 'Vendo casa en Tiquipaya, 3 dorm, con baulera, $us 128.000'
      const d = draftFromParsed(parseListing(text), text)
      expect(d.storage).toBe(true)
      expect(fieldsIn(d, 'optional')).toContain('storage')
      expect(fieldsIn(d, 'notApplicable')).toEqual(['pets'])
      const l = draftToListing(d, agent, now)
      expect(l.storage).toBe(true)
      expect(l.notApplicable).toEqual(['pets'])
    })

    it('"No aplica" moves a field to the last section and "Agregar" brings it back to its default section, keeping the value', () => {
      const filled = { ...houseSale, docsOk: true }
      const marked = markNotApplicable(filled, 'docsOk')
      expect(askedFields(marked)).not.toContain('docsOk')
      expect(fieldsIn(marked, 'notApplicable')).toContain('docsOk')
      expect(draftToListing(marked, agent, now)).toMatchObject({ docsOk: null })
      const back = addBack(marked, 'docsOk')
      expect(askedFields(back)).toContain('docsOk')
      expect(back.docsOk).toBe(true)
      // A field that doesn't apply by default goes to "Más datos".
      const pets = addBack(houseSale, 'pets')
      expect(fieldsIn(pets, 'optional')).toContain('pets')
      expect(fieldsIn(pets, 'notApplicable')).toEqual(['storage'])
    })

    it('"Agregar" on a recommended field puts it in "Te falta" (growPending)', () => {
      const marked = markNotApplicable(houseSale, 'docsOk')
      const pending = pendingAtStart(marked)
      expect(pending).not.toContain('docsOk')
      expect(growPending(pending, marked, addBack(marked, 'docsOk'))).toContain('docsOk')
    })

    it('switching from sale to rent moves pets to "Te falta", and it stays there once filled in', () => {
      const pending = pendingAtStart(houseSale)
      const rent = keepFilledFields({ ...houseSale, operation: 'alquiler' })
      const grown = growPending(pending, houseSale, rent)
      expect(grown).toContain('pets')
      expect(growPending(grown, rent, { ...rent, pets: true })).toBe(grown)
    })

    it('a field the agent marked "No aplica" stays there when the operation changes', () => {
      const marked = markNotApplicable({ ...houseSale, operation: 'alquiler' }, 'pets')
      expect(fieldsIn({ ...marked, operation: 'anticretico' }, 'notApplicable')).toContain('pets')
    })

    it('a value that stops applying after a change moves to "Más datos", not to "No aplica"', () => {
      const rent = { ...houseSale, operation: 'alquiler' as const, pets: true }
      expect(fieldsIn(keepFilledFields({ ...rent, operation: 'venta' }), 'optional')).toContain('pets')
    })

    it('"X de Y" counts only required and recommended fields', () => {
      expect(askedFields(houseSale)).toEqual(['operation', 'type', 'zone', 'price', 'bedrooms', 'bathrooms', 'builtM2', 'landM2', 'garage', 'bankCredit', 'docsOk', 'commissionShare'])
    })
  })
})
