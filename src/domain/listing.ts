export type Operation = 'venta' | 'alquiler' | 'anticretico'
export type PropertyType = 'casa' | 'departamento' | 'terreno' | 'local'
/** USD para venta y anticrético; BOB (Bs) para alquiler. */
export type Currency = 'USD' | 'BOB'
export type ListingStatus = 'active' | 'closed'

export const ZONES = [
  'Queru Queru',
  'Cala Cala',
  'Sarco',
  'Zona Norte',
  'Centro',
  'Recoleta',
  'Mayorazgo',
  'Tupuraya',
  'Zona Sur',
  'Tiquipaya',
  'Sacaba',
  'Colcapirhua',
  'Quillacollo',
  'Temporal',
  'Muyurina',
] as const
export type Zone = (typeof ZONES)[number]

/** Las 6 fotos placeholder disponibles (gradiente + ícono). */
export const PHOTO_IDS = ['fachada', 'living', 'cocina', 'dormitorio', 'bano', 'patio'] as const
export type PhotoId = (typeof PHOTO_IDS)[number]

export interface Agent {
  name: string
  /** Formato internacional sin espacios, ej. "+59170000001". */
  whatsapp: string
  /** ISO date. */
  memberSince: string
}

/**
 * Ficha estándar de una propiedad. `null` significa "sin dato": la ficha lo muestra
 * explícitamente para que se note qué falta.
 */
export interface Listing {
  id: string
  operation: Operation
  type: PropertyType
  zone: Zone
  price: number
  currency: Currency
  bedrooms: number | null
  bathrooms: number | null
  builtM2: number | null
  landM2: number | null
  garage: boolean | null
  pets: boolean | null
  storage: boolean | null
  bankCredit: boolean | null
  docsOk: boolean | null
  utilities: boolean | null
  /** Solo alquiler, ej. "2 meses". */
  rentGuarantee?: string | null
  /** Solo alquiler, expensas mensuales en Bs. */
  rentExpenses?: number | null
  /** % de la comisión que se comparte, ej. 50. */
  commissionShare: number | null
  ownerAuthorized: boolean
  photos: PhotoId[]
  description: string
  agent: Agent
  /** ISO datetime. */
  lastConfirmedAt: string
  status: ListingStatus
  /** ISO datetime. */
  createdAt: string
  isMine: boolean
}

export const OPERATION_LABELS: Record<Operation, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  anticretico: 'Anticrético',
}

/** Para frases como "Departamento en venta". */
export const OPERATION_PHRASE: Record<Operation, string> = {
  venta: 'en venta',
  alquiler: 'en alquiler',
  anticretico: 'en anticrético',
}

export const TYPE_LABELS: Record<PropertyType, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  terreno: 'Terreno',
  local: 'Local u oficina',
}

export function currencyFor(operation: Operation): Currency {
  return operation === 'alquiler' ? 'BOB' : 'USD'
}
