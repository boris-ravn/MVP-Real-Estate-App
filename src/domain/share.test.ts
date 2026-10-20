import { describe, expect, it } from 'vitest'
import { buildSeedListings } from '../seed/listings'
import { listingLink, shareText } from './share'

const now = new Date(2026, 9, 15, 12)
const listings = buildSeedListings(now)
const byId = (id: string) => listings.find((l) => l.id === id)!

describe('texto para compartir', () => {
  it('sigue el formato de F6 (ejemplo del PRD)', () => {
    const l = { ...byId('seed-01'), storage: false, bankCredit: false, ownerAuthorized: false, lastConfirmedAt: now.toISOString() }
    expect(shareText(l, 'https://x.app/#/p/seed-01', now)).toBe(
      [
        '🏠 Departamento en venta – Queru Queru',
        '💵 $us 95.000 · 3 dorm · 2 baños · 110 m²',
        '🚗 Garaje · 🐾 Acepta mascotas',
        '🤝 Comparte comisión 50%',
        '✅ Confirmado hoy',
        'Ver ficha: https://x.app/#/p/seed-01',
      ].join('\n'),
    )
  })

  it('alquiler en Bs por mes, autorización y frescura no reciente', () => {
    const text = shareText(byId('seed-16'), 'L', now)
    expect(text).toContain('💵 Bs 2.900 / mes + Bs 200 de expensas · 2 dorm · 1 baño · 70 m²')
    expect(text).toContain('🕒 Confirmado hace 6 días')
  })

  it('omite líneas sin datos (terreno sin características)', () => {
    const text = shareText(byId('seed-12'), 'L', now)
    expect(text).toContain('💵 $us 140.000 · 800 m²')
    expect(text).not.toContain('🚗')
    expect(text.split('\n')).toHaveLength(5)
  })

  it('arma el link a la ficha con hash', () => {
    expect(listingLink('seed-01', 'https://x.app/')).toBe('https://x.app/#/p/seed-01')
  })
})
