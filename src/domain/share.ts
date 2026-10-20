import { freshness } from './freshness'
import { listingTitle, priceWithExpenses } from './format'
import type { Listing } from './listing'

/** Link a la ficha. Sin backend, solo abre la ficha en el mismo dispositivo (limitación del prototipo). */
export function listingLink(id: string, base: string = `${location.origin}${location.pathname}`): string {
  return `${base}#/p/${id}`
}

/**
 * Texto estándar para pegar en grupos de WhatsApp (F6):
 *
 *   🏠 Departamento en venta – Queru Queru
 *   💵 $us 95.000 · 3 dorm · 2 baños · 110 m²
 *   🚗 Garaje · 🐾 Acepta mascotas
 *   🤝 Comparte comisión 50%
 *   ✅ Confirmado hoy
 *   Ver ficha: <link>
 */
export function shareText(l: Listing, link: string, now: Date = new Date()): string {
  const area = l.type === 'terreno' ? l.landM2 : l.builtM2
  const facts = [
    priceWithExpenses(l),
    l.bedrooms != null && `${l.bedrooms} dorm`,
    l.bathrooms != null && `${l.bathrooms} ${l.bathrooms === 1 ? 'baño' : 'baños'}`,
    area != null && `${area} m²`,
  ].filter(Boolean)

  const features = [
    l.garage && '🚗 Garaje',
    l.pets && '🐾 Acepta mascotas',
    l.storage && '📦 Baulera',
    l.bankCredit && '🏦 Acepta crédito bancario',
  ].filter(Boolean)

  const collab = [l.commissionShare != null && `Comparte comisión ${l.commissionShare}%`, l.ownerAuthorized && 'Autorizado por el propietario'].filter(Boolean)

  const f = freshness(l.lastConfirmedAt, now)

  return [
    `🏠 ${listingTitle(l)} – ${l.zone}`,
    `💵 ${facts.join(' · ')}`,
    features.length > 0 && features.join(' · '),
    collab.length > 0 && `🤝 ${collab.join(' · ')}`,
    `${f.level === 'fresh' ? '✅' : '🕒'} ${f.label}`,
    `Ver ficha: ${link}`,
  ]
    .filter(Boolean)
    .join('\n')
}
