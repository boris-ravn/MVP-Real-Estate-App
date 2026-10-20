import { describe, expect, it } from 'vitest'
import { SEED_MESSAGES } from '../seed/messages'
import { parseListing } from './parseListing'

describe('parseListing · mensajes semilla', () => {
  it.each(SEED_MESSAGES.map((m, i) => [i + 1, m] as const))('mensaje %i extrae lo esperado', (_, m) => {
    const r = parseListing(m.text)
    expect(r).toMatchObject(m.expected)
    for (const key of Object.keys(m.expected)) expect(r.detected).toContain(key)
  })

  it('criterio de aceptación: detecta operación, tipo, precio, dormitorios (si aplica) y zona (o la sugiere) en todos', () => {
    for (const m of SEED_MESSAGES) {
      const r = parseListing(m.text)
      const required = ['operation', 'type', 'price']
      if (r.type !== 'terreno' && r.type !== 'local') required.push('bedrooms')
      for (const key of required) expect(r.detected, `${key} en: ${m.text}`).toContain(key)
      expect([...r.detected, ...(r.suggested ?? [])], `zona en: ${m.text}`).toContain('zone')
    }
  })
})

describe('parseListing · casos borde', () => {
  it('texto vacío no detecta nada', () => {
    expect(parseListing('   ').detected).toEqual([])
  })

  it('operación: sinónimos', () => {
    expect(parseListing('Se alquila casa').operation).toBe('alquiler')
    expect(parseListing('Vendo lote').operation).toBe('venta')
    expect(parseListing('ANTICRETICO depa').operation).toBe('anticretico')
  })

  it('tipo: el primero que aparece gana (casa con "terreno de 300 m2")', () => {
    expect(parseListing('Casa en venta, terreno de 300 m2').type).toBe('casa')
    expect(parseListing('Lote en venta').type).toBe('terreno')
    expect(parseListing('Oficina en alquiler').type).toBe('local')
    expect(parseListing('dpto 2 dorm').type).toBe('departamento')
  })

  it('precio: formatos con separadores, k y moneda antes o después', () => {
    expect(parseListing('$us 95.000')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('95,000 USD')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('precio 120k $')).toMatchObject({ price: 120000, currency: 'USD' })
    expect(parseListing('Bs. 2.500 mensual')).toMatchObject({ price: 2500, currency: 'BOB' })
    expect(parseListing('2500 bolivianos')).toMatchObject({ price: 2500, currency: 'BOB' })
    expect(parseListing('a solo 87.5k dólares')).toMatchObject({ price: 87500, currency: 'USD' })
  })

  it('precio sin moneda: usa la de la operación', () => {
    expect(parseListing('Alquilo depto. Precio: 3.200')).toMatchObject({ price: 3200, currency: 'BOB' })
    expect(parseListing('Vendo casa, precio 150.000')).toMatchObject({ price: 150000, currency: 'USD' })
  })

  it('no confunde m², porcentaje ni expensas con el precio', () => {
    const r = parseListing('Alquilo depto 80 m2, comparto 50%, Bs 3.000 + expensas Bs 200')
    expect(r).toMatchObject({ price: 3000, currency: 'BOB', builtM2: 80, commissionShare: 50 })
  })

  it('superficie: construida vs terreno', () => {
    expect(parseListing('Casa, construcción 180 m², terreno 300 m²')).toMatchObject({ builtM2: 180, landM2: 300 })
    expect(parseListing('Terreno de 450 mts en Sacaba')).toMatchObject({ landM2: 450 })
    expect(parseListing('Terreno de 450 mts').builtM2).toBeUndefined()
  })

  it('booleanos con negación', () => {
    expect(parseListing('No se aceptan mascotas').pets).toBe(false)
    expect(parseListing('sin garaje').garage).toBe(false)
    expect(parseListing('con cochera').garage).toBe(true)
    expect(parseListing('Papeles en regla').docsOk).toBe(true)
    expect(parseListing('Todos los servicios básicos').utilities).toBe(true)
    expect(parseListing('Pet friendly').pets).toBe(true)
  })

  it('zona: sin distinguir mayúsculas ni tildes', () => {
    expect(parseListing('dpto en QUERU QUERU').zone).toBe('Queru Queru')
    expect(parseListing('casa en zona sur').zone).toBe('Zona Sur')
  })

  it('comisión: varias formas', () => {
    expect(parseListing('comparto 40%').commissionShare).toBe(40)
    expect(parseListing('comisión compartida 50/50').commissionShare).toBe(50)
    expect(parseListing('Comisión compartida: 30 %').commissionShare).toBe(30)
  })

  it('precio con "mil" (C3)', () => {
    expect(parseListing('4 mil Bs')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('4mil bs')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('Bs 4 mil')).toMatchObject({ price: 4000, currency: 'BOB' })
    expect(parseListing('Bs 3,5 mil')).toMatchObject({ price: 3500, currency: 'BOB' })
    expect(parseListing('3.5 mil bolivianos')).toMatchObject({ price: 3500, currency: 'BOB' })
    expect(parseListing('95 mil $us')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('$us 95 mil')).toMatchObject({ price: 95000, currency: 'USD' })
    expect(parseListing('Alquilo depto, precio 4 mil')).toMatchObject({ price: 4000, currency: 'BOB' })
  })

  it('zona: con guion o pegada (C3)', () => {
    expect(parseListing('dpto en Queru-Queru').zone).toBe('Queru Queru')
    expect(parseListing('dpto en queruqueru').zone).toBe('Queru Queru')
    expect(parseListing('casa Cala-Cala').zone).toBe('Cala Cala')
    expect(parseListing('casa calacala').zone).toBe('Cala Cala')
  })

  it('zona sugerida por avenida o lugar, sin contarla como detectada (C3)', () => {
    for (const text of ['depto por Av. Heroínas', 'depto avenida heroinas', 'depto Avda Heroínas', 'depto sobre la Heroínas']) {
      const r = parseListing(text)
      expect(r, text).toMatchObject({ zone: 'Centro', suggested: ['zone'], zoneHint: 'Av. Heroinas' })
      expect(r.detected).not.toContain('zone')
    }
    expect(parseListing('a 2 cuadras de la Plaza Colón')).toMatchObject({ zone: 'Centro', zoneHint: 'Plaza Colon' })
    expect(parseListing('frente a la plaza 14 de septiembre').zone).toBe('Centro')
  })

  it('una zona de la lista gana sobre la sugerida por avenida', () => {
    const r = parseListing('depto en Sarco, cerca de la Av. Heroínas')
    expect(r.zone).toBe('Sarco')
    expect(r.detected).toContain('zone')
    expect(r.suggested).toBeUndefined()
  })

  it('expensas: varios formatos (C3)', () => {
    expect(parseListing('expensas 250').rentExpenses).toBe(250)
    expect(parseListing('expensas: Bs 250').rentExpenses).toBe(250)
    expect(parseListing('Bs 3.000 + 250 de expensas').rentExpenses).toBe(250)
    expect(parseListing('Bs 3.000 + 250 bs expensas')).toMatchObject({ price: 3000, rentExpenses: 250 })
    expect(parseListing('expensas incluidas').rentExpenses).toBe(0)
    expect(parseListing('el precio incluye expensas').rentExpenses).toBe(0)
    expect(parseListing('Bs 3.500 + expensas').rentExpenses).toBeUndefined()
  })

  it('garantía de alquiler', () => {
    expect(parseListing('Alquilo depa, garantía de 2 meses').rentGuarantee).toBe('2 meses')
    expect(parseListing('garantia 1 mes').rentGuarantee).toBe('1 mes')
  })
})
