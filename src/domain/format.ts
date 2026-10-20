import type { Currency, Listing } from './listing'
import { OPERATION_PHRASE, TYPE_LABELS } from './listing'

/** Groups thousands with a dot, as written in Bolivia: 95000 → "95.000". */
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

/** Short, for the card: "+ 250 exp." or "(exp. incluidas)". `null` with no data or if not a rental. */
export function expensesShort(l: Pick<Listing, 'operation' | 'rentExpenses'>): string | null {
  if (l.operation !== 'alquiler' || l.rentExpenses == null) return null
  return l.rentExpenses === 0 ? '(exp. incluidas)' : `+ ${groupThousands(l.rentExpenses)} exp.`
}

/** For texts and the listing: "Bs 3.800 / mes + Bs 250 de expensas" or "Bs 3.800 / mes (expensas incluidas)". */
export function priceWithExpenses(l: Pick<Listing, 'price' | 'currency' | 'operation' | 'rentExpenses'>): string {
  const base = listingPrice(l)
  if (l.operation !== 'alquiler' || l.rentExpenses == null) return base
  return l.rentExpenses === 0 ? `${base} (expensas incluidas)` : `${base} + Bs ${groupThousands(l.rentExpenses)} de expensas`
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
  if (months < 24) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  return `hace ${Math.floor(months / 12)} años`
}
