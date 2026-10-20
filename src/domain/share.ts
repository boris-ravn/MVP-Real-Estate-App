import { freshness } from './freshness'
import { listingTitle, priceWithExpenses } from './format'
import type { Agent, Listing } from './listing'

/** Link to the listing. Without a backend, it only opens the listing on the same device (prototype limitation). */
export function listingLink(id: string, base: string = `${location.origin}${location.pathname}`): string {
  return `${base}#/p/${id}`
}

/**
 * Standard text to paste into WhatsApp groups (F6):
 *
 *   🏠 Departamento en venta – Queru Queru
 *   💵 $us 95.000 · 3 dorm · 2 baños · 110 m²
 *   🚗 Garaje · 🐾 Acepta mascotas
 *   🤝 Comparte comisión 50%
 *   ✅ Confirmado hoy
 *   Ver ficha: <link>
 */
export function shareText(l: Listing, link: string, now: Date = new Date()): string {
  const collab = [l.commissionShare != null && `Comparte comisión ${l.commissionShare}%`, l.ownerAuthorized && 'Autorizado por el propietario'].filter(Boolean)
  const f = freshness(l.lastConfirmedAt, now)

  return [
    ...listingLines(l),
    collab.length > 0 && `🤝 ${collab.join(' · ')}`,
    `${f.level === 'fresh' ? '✅' : '🕒'} ${f.label}`,
    `Ver ficha: ${link}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** "Para asesores" (For agents, groups) or "Para mi cliente" (For my client) (C1 of PRD v2). */
export type ShareMode = 'agents' | 'client'

/** Default: own listings are shared in groups; other agents' listings, with the client. */
export function defaultShareMode(l: Pick<Listing, 'isMine'>): ShareMode {
  return l.isMine ? 'agents' : 'client'
}

/**
 * Text to forward to the end client (C1): no commission, authorization, publishing agent or link
 * to the listing. The contact is the person sharing. Availability only appears if recent.
 *
 *   🏠 Departamento en alquiler – Cala Cala
 *   💵 Bs 3.800 / mes + Bs 250 de expensas · 2 dorm · 2 baños · 85 m²
 *   🚗 Garaje · 🐾 Acepta mascotas
 *   ✅ Disponible (confirmado hoy)
 *   📲 Más información: Valeria Rojas · wa.me/59170000009
 */
export function clientShareText(l: Listing, sender: Pick<Agent, 'name' | 'whatsapp'>, now: Date = new Date()): string {
  const f = freshness(l.lastConfirmedAt, now)
  return [
    ...listingLines(l),
    f.level === 'fresh' && `✅ Disponible (${f.label.charAt(0).toLowerCase()}${f.label.slice(1)})`,
    `📲 Más información: ${sender.name} · wa.me/${sender.whatsapp.replace(/\D/g, '')}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Title, key facts and features: what both modes share. */
function listingLines(l: Listing): (string | false)[] {
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

  return [`🏠 ${listingTitle(l)} – ${l.zone}`, `💵 ${facts.join(' · ')}`, features.length > 0 && features.join(' · ')]
}
