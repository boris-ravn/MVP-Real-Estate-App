import { describe, expect, it } from 'vitest'
import { DETAIL_FIELDS, fieldLevel, notApplicableOf, type FieldLevel } from './fields'
import type { Operation, PropertyType } from './listing'

const LETTER: Record<FieldLevel, string> = { recommended: 'R', optional: 'O', notApplicable: 'N' }

/** Level of every field for one column of the matrix, as letters in listing order (R / O / N / -). */
function column(type: PropertyType, operation: Operation): string {
  return DETAIL_FIELDS.map((f) => {
    const level = fieldLevel(f, { type, operation })
    return level ? LETTER[level] : '-'
  }).join('')
}

// Letter order: bedrooms, bathrooms, builtM2, landM2, garage, pets, storage, bankCredit, docsOk, utilities, rentGuarantee, rentExpenses, commissionShare.
describe('field matrix (PRD v3 D1)', () => {
  it('house for sale', () => expect(column('casa', 'venta')).toBe('RRRRRNNRRO--R'))
  it('house for rent', () => expect(column('casa', 'alquiler')).toBe('RRRORRN-OOROR'))
  it('house in anticrético', () => expect(column('casa', 'anticretico')).toBe('RRRORRNORO-OR'))
  it('apartment for sale', () => expect(column('departamento', 'venta')).toBe('RRR-ROORRO--R'))
  it('apartment for rent', () => expect(column('departamento', 'alquiler')).toBe('RRR-RRO-OORRR'))
  it('apartment in anticrético', () => expect(column('departamento', 'anticretico')).toBe('RRR-RROORO-OR'))
  it('plot of land', () => expect(column('terreno', 'venta')).toBe('--NR---RRR--R'))
  it('commercial space, for sale and for rent', () => {
    expect(column('local', 'venta')).toBe('-RRNO-NROO--R')
    expect(column('local', 'alquiler')).toBe('-RRNO-N-OOROR')
  })

  it('listings saved before PRD v3 count their empty "not applicable by default" fields as "No aplica"', () => {
    const house = { ...NO_DETAILS, type: 'casa', operation: 'venta', storage: true } as const
    expect(notApplicableOf(house)).toEqual(['pets'])
    expect(notApplicableOf({ ...house, notApplicable: [] })).toEqual([])
  })
})

const NO_DETAILS = {
  bedrooms: null,
  bathrooms: null,
  builtM2: null,
  landM2: null,
  garage: null,
  pets: null,
  storage: null,
  bankCredit: null,
  docsOk: null,
  utilities: null,
  rentGuarantee: null,
  rentExpenses: null,
  commissionShare: null,
}
