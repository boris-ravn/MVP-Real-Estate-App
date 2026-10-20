import { describe, expect, it } from 'vitest'
import { SEED_MESSAGES } from '../seed/messages'
import { parseListing } from './parseListing'

describe('parseListing · seed messages', () => {
  it.each(SEED_MESSAGES.map((m, i) => [i + 1, m] as const))('message %i extracts the expected fields', (_, m) => {
    const r = parseListing(m.text)
    expect(r).toMatchObject(m.expected)
    for (const key of Object.keys(m.expected)) expect(r.detected).toContain(key)
  })

  it('acceptance criterion: detects operation, type, price, bedrooms (if applicable) and zone (or suggests it) in all of them', () => {
    for (const m of SEED_MESSAGES) {
      const r = parseListing(m.text)
      const required = ['operation', 'type', 'price']
      if (r.type !== 'terreno' && r.type !== 'local') required.push('bedrooms')
      for (const key of required) expect(r.detected, `${key} in: ${m.text}`).toContain(key)
      expect([...r.detected, ...(r.suggested ?? [])], `zone in: ${m.text}`).toContain('zone')
    }
  })
})

describe('parseListing · edge cases', () => {
  it('empty text detects nothing', () => {
    expect(parseListing('   ').detected).toEqual([])
  })

  it('operation: synonyms', () => {
    expect(parseListing('Se alquila casa').operation).toBe('alquiler')
    expect(parseListing('Vendo lote').operation).toBe('venta')
    expect(parseListing('ANTICRETICO depa').operation).toBe('anticretico')
  })

  it('type: the first one to appear wins (casa with "terreno de 300 m2")', () => {
    expect(parseListing('Casa en venta, terreno de 300 m2').type).toBe('casa')
    expect(parseListing('Lote en venta').type).toBe('terreno')
    expect(parseListing('Oficina en alquiler').type).toBe('local')
    expect(parseListing('dpto 2 dorm').type).toBe('departamento')
  })

  it('price: formats with separators, k, and currency before or after', () => {
    expect(parseListing('$us 95.000')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('95,000 USD')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('precio 120k $')).toMatchObject({ price: 120000, currency: 'USD' })
    expect(parseListing('Bs. 2.500 mensual')).toMatchObject({ price: 2500, currency: 'BOB' })
    expect(parseListing('2500 bolivianos')).toMatchObject({ price: 2500, currency: 'BOB' })
    expect(parseListing('a solo 87.5k dólares')).toMatchObject({ price: 87500, currency: 'USD' })
  })

  it('price without currency: uses the operation currency', () => {
    expect(parseListing('Alquilo depto. Precio: 3.200')).toMatchObject({ price: 3200, currency: 'BOB' })
    expect(parseListing('Vendo casa, precio 150.000')).toMatchObject({ price: 150000, currency: 'USD' })
  })

  it('does not mistake m², percentages or HOA fees for the price', () => {
    const r = parseListing('Alquilo depto 80 m2, comparto 50%, Bs 3.000 + expensas Bs 200')
    expect(r).toMatchObject({ price: 3000, currency: 'BOB', builtM2: 80, commissionShare: 50 })
  })

  it('area: built vs land', () => {
    expect(parseListing('Casa, construcción 180 m², terreno 300 m²')).toMatchObject({ builtM2: 180, landM2: 300 })
    expect(parseListing('Terreno de 450 mts en Sacaba')).toMatchObject({ landM2: 450 })
    expect(parseListing('Terreno de 450 mts').builtM2).toBeUndefined()
  })

  it('booleans with negation', () => {
    expect(parseListing('No se aceptan mascotas').pets).toBe(false)
    expect(parseListing('sin garaje').garage).toBe(false)
    expect(parseListing('con cochera').garage).toBe(true)
    expect(parseListing('casa s/garaje').garage).toBe(false)
    expect(parseListing('dpto S/ mascotas, c/garaje')).toMatchObject({ pets: false, garage: true })
    expect(parseListing('c/garaje y baulera').garage).toBe(true)
    expect(parseListing('Papeles en regla').docsOk).toBe(true)
    expect(parseListing('Todos los servicios básicos').utilities).toBe(true)
    expect(parseListing('Pet friendly').pets).toBe(true)
  })

  it('zone: case- and accent-insensitive', () => {
    expect(parseListing('dpto en QUERU QUERU').zone).toBe('Queru Queru')
    expect(parseListing('casa en zona sur').zone).toBe('Zona Sur')
  })

  it('commission: several forms', () => {
    expect(parseListing('comparto 40%').commissionShare).toBe(40)
    expect(parseListing('comisión compartida 50/50').commissionShare).toBe(50)
    expect(parseListing('Comisión compartida: 30 %').commissionShare).toBe(30)
  })

  it('price with "mil" (C3)', () => {
    expect(parseListing('4 mil Bs')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('4mil bs')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('Bs 4 mil')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('Bs 3,5 mil')).toMatchObject({ price: 3500, currency: 'BOB' })
    expect(parseListing('3.5 mil bolivianos')).toMatchObject({ price: 3500, currency: 'BOB' })
    expect(parseListing('95 mil $us')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('$us 95 mil')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('Alquilo depto, precio 4 mil')).toMatchObject({ price: 4000, currency: 'BOB' })
  })

  it('zone: hyphenated or joined (C3)', () => {
    expect(parseListing('dpto en Queru-Queru').zone).toBe('Queru Queru')
    expect(parseListing('dpto en queruqueru').zone).toBe('Queru Queru')
    expect(parseListing('casa Cala-Cala').zone).toBe('Cala Cala')
    expect(parseListing('casa calacala').zone).toBe('Cala Cala')
  })

  it('zone suggested from an avenue or landmark, not counted as detected (C3)', () => {
    for (const text of ['depto por Av. Heroínas', 'depto avenida heroinas', 'depto Avda Heroínas', 'depto sobre la Heroínas']) {
      const r = parseListing(text)
      expect(r, text).toMatchObject({ zone: 'Centro', suggested: ['zone'], zoneHint: 'Av. Heroinas' })
      expect(r.detected).not.toContain('zone')
    }
    expect(parseListing('a 2 cuadras de la Plaza Colón')).toMatchObject({ zone: 'Centro', zoneHint: 'Plaza Colon' })
    expect(parseListing('frente a la plaza 14 de septiembre').zone).toBe('Centro')
  })

  it('a zone from the list wins over one suggested from an avenue', () => {
    const r = parseListing('depto en Sarco, cerca de la Av. Heroínas')
    expect(r.zone).toBe('Sarco')
    expect(r.detected).toContain('zone')
    expect(r.suggested).toBeUndefined()
  })

  it('HOA fees (expensas): several formats (C3)', () => {
    expect(parseListing('expensas 250').rentExpenses).toBe(250)
    expect(parseListing('expensas: Bs 250').rentExpenses).toBe(250)
    expect(parseListing('Bs 3.000 + 250 de expensas').rentExpenses).toBe(250)
    expect(parseListing('Bs 3.000 + 250 bs expensas')).toMatchObject({ price: 3000, rentExpenses: 250 })
    expect(parseListing('expensas incluidas').rentExpenses).toBe(0)
    expect(parseListing('el precio incluye expensas').rentExpenses).toBe(0)
    expect(parseListing('Bs 3.500 + expensas').rentExpenses).toBeUndefined()
  })

  it('HOA fees written before the price do not swallow the price', () => {
    expect(parseListing('Alquilo depto 250 de expensas Bs 3.800')).toMatchObject({ price: 3800, currency: 'BOB', rentExpenses: 250 })
    expect(parseListing('+ 250 expensas, Bs 3.800')).toMatchObject({ price: 3800, rentExpenses: 250 })
    expect(parseListing('expensas Bs 1.200, alquiler Bs 6.500')).toMatchObject({ price: 6500, rentExpenses: 1200 })
    expect(parseListing('Bs 3.800 expensas 250')).toMatchObject({ price: 3800, rentExpenses: 250 })
  })

  it('price with "mil" or "k" without currency: uses the operation currency', () => {
    expect(parseListing('Alquilo depto 4 mil')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('alquilo dpto 3,5 mil mensual')).toMatchObject({ price: 3500, currency: 'BOB' })
    expect(parseListing('Vendo casa 95k')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('Alquilo depto 4mil + 300 de expensas')).toMatchObject({ price: 4000, rentExpenses: 300 })
  })

  it('rent guarantee', () => {
    expect(parseListing('Alquilo depa, garantía de 2 meses').rentGuarantee).toBe('2 meses')
    expect(parseListing('garantia 1 mes').rentGuarantee).toBe('1 mes')
  })
})
