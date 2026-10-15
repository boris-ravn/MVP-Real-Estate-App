import type { Currency, Listing } from './listing'
import { OPERATION_PHRASE, TYPE_LABELS } from './listing'

/** Agrupa miles con punto, como se escribe en Bolivia: 95000 → "95.000". */
export function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatPrice(price: number, currency: Currency): string {
  return `${currency === 'USD' ? '$us' : 'Bs'} ${groupThousands(price)}`
}

export function listingPrice(l: Pick<Listing, 'price' | 'currency' | 'operation'>): string {
  const base = formatPrice(l.price, l.currency)
  return l.operation === 'alquiler' ? `${base} / mes` : base
}

/** "Departamento en venta" */
export function listingTitle(l: Pick<Listing, 'type' | 'operation'>): string {
  return `${TYPE_LABELS[l.type]} ${OPERATION_PHRASE[l.operation]}`
}

/** "hace 8 meses", "hace 2 años", "hace 3 semanas" */
export function timeInNetwork(memberSinceIso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(memberSinceIso).getTime()) / 86_400_000))
  if (days < 14) return 'hace poco'
  if (days < 60) return `hace ${Math.floor(days / 7)} semanas`
  const months = Math.floor(days / 30.4)
  if (months < 24) return `hace ${months} meses`
  return `hace ${Math.floor(months / 12)} años`
}
