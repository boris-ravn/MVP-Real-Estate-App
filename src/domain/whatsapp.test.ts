import { describe, expect, it } from 'vitest'
import { buildSeedListings } from '../seed/listings'
import { contactMessage, contactUrl, firstName, waNumber, waUrl } from './whatsapp'

const listings = buildSeedListings(new Date(2026, 9, 15, 12))
const calaCala = listings.find((l) => l.agent.name.startsWith('Carla') && l.operation === 'alquiler')!

describe('WhatsApp', () => {
  it('normaliza el número para wa.me', () => {
    expect(waNumber('+591 70000001')).toBe('59170000001')
    expect(firstName('  Carla Rojas Vargas ')).toBe('Carla')
  })

  it('arma el mensaje precargado del PRD', () => {
    expect(contactMessage(calaCala, 'RedProp')).toBe(
      'Hola Carla, vi tu departamento en Cala Cala (Bs 3.800 / mes) en RedProp. ¿Sigue disponible? Tengo un cliente interesado.',
    )
  })

  it('genera la URL wa.me con número y texto codificado', () => {
    const url = contactUrl(calaCala, 'RedProp')
    expect(url.startsWith('https://wa.me/59170000001?text=')).toBe(true)
    const text = new URL(url).searchParams.get('text')
    expect(text).toBe(contactMessage(calaCala, 'RedProp'))
  })

  it('sin número deja elegir el chat', () => {
    expect(waUrl('hola')).toBe('https://wa.me/?text=hola')
  })
})
