import { describe, expect, it } from 'vitest'
import { formatPrice, groupThousands, listingPrice, listingTitle } from './format'

describe('format', () => {
  it('groups thousands with a dot', () => {
    expect(groupThousands(95000)).toBe('95.000')
    expect(groupThousands(3800)).toBe('3.800')
    expect(groupThousands(950)).toBe('950')
    expect(groupThousands(1250000)).toBe('1.250.000')
  })

  it('uses $us for USD and Bs for bolivianos', () => {
    expect(formatPrice(95000, 'USD')).toBe('$us 95.000')
    expect(formatPrice(3800, 'BOB')).toBe('Bs 3.800')
  })

  it('adds "/ mes" only on rentals', () => {
    expect(listingPrice({ price: 3800, currency: 'BOB', operation: 'alquiler' })).toBe('Bs 3.800 / mes')
    expect(listingPrice({ price: 35000, currency: 'USD', operation: 'anticretico' })).toBe('$us 35.000')
  })

  it('builds the title', () => {
    expect(listingTitle({ type: 'departamento', operation: 'anticretico' })).toBe('Departamento en anticrético')
  })
})
