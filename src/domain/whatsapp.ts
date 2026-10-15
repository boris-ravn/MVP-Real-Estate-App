import { PRODUCT_NAME } from '../config'
import { listingPrice } from './format'
import type { Listing, PropertyType } from './listing'

const TYPE_NOUN: Record<PropertyType, string> = {
  casa: 'casa',
  departamento: 'departamento',
  terreno: 'terreno',
  local: 'local',
}

/** wa.me exige el número solo con dígitos, en formato internacional y sin "+". */
export function waNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

/** "Hola Carla, vi tu departamento en Cala Cala (Bs 3.800 / mes) en X. ¿Sigue disponible? Tengo un cliente interesado." */
export function contactMessage(l: Listing, productName: string = PRODUCT_NAME): string {
  return (
    `Hola ${firstName(l.agent.name)}, vi tu ${TYPE_NOUN[l.type]} en ${l.zone} (${listingPrice(l)}) en ${productName}. ` +
    '¿Sigue disponible? Tengo un cliente interesado.'
  )
}

/** Sin número abre WhatsApp para elegir el chat (útil para compartir). */
export function waUrl(text: string, phone?: string): string {
  const base = phone ? `https://wa.me/${waNumber(phone)}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}

export function contactUrl(l: Listing, productName: string = PRODUCT_NAME): string {
  return waUrl(contactMessage(l, productName), l.agent.whatsapp)
}
