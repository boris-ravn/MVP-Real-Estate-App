// Parser determinista "mensaje de WhatsApp → ficha" (regex + diccionarios).
// La UI solo depende de la firma de parseListing, así que más adelante se puede
// reemplazar por un LLM sin tocar las pantallas.

import type { Currency, Listing, Operation, PropertyType, Zone } from '../domain/listing'
import { currencyFor, ZONES } from '../domain/listing'

export type ParsedListing = Partial<Listing> & {
  /** Campos que el parser encontró en el texto (los demás quedan para completar a mano). */
  detected: string[]
}

/** Minúsculas, sin tildes y sin emojis, para comparar sin importar cómo se escribió. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, ' ')
    .toLowerCase()
}

/** Primer patrón (por posición en el texto) que coincide. */
function earliest<T>(text: string, patterns: [T, RegExp][]): T | undefined {
  let best: { value: T; index: number } | undefined
  for (const [value, re] of patterns) {
    const m = re.exec(text)
    if (m && (!best || m.index < best.index)) best = { value, index: m.index }
  }
  return best?.value
}

const OPERATIONS: [Operation, RegExp][] = [
  ['anticretico', /anticretico|anticresis/],
  ['alquiler', /alquil\w*|\brenta\b|arriendo/],
  ['venta', /\bventa\b|\bvend[eo]\w*/],
]

const TYPES: [PropertyType, RegExp][] = [
  ['casa', /\bcasas?\b/],
  ['departamento', /\b(?:departamentos?|deptos?|dptos?|depas?)\b/],
  ['terreno', /\b(?:terrenos?|lotes?)\b/],
  ['local', /\b(?:local(?:es)?|oficinas?)\b/],
]

// ---------- Precio ----------

const NUM = String.raw`(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k)?`
const CUR_BEFORE = String.raw`(\$us|us\$|usd|\$|(?<![a-z])bs\.?|bolivianos)`
const CUR_AFTER = String.raw`(\$us|us\$|usd|dolares|\$|(?<![a-z])bs\b\.?|bolivianos)`

function toNumber(raw: string, k?: string): number {
  if (k) return Math.round(parseFloat(raw.replace(',', '.')) * 1000)
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''))
  return Math.round(parseFloat(raw.replace(',', '.')))
}

function toCurrency(token: string): Currency {
  return /bs|bolivianos/.test(token) ? 'BOB' : 'USD'
}

function parsePrice(t: string): { price: number; currency?: Currency } | undefined {
  const candidates: { index: number; price: number; currency: Currency }[] = []
  for (const m of t.matchAll(new RegExp(`${CUR_BEFORE}\\s*${NUM}`, 'g'))) {
    candidates.push({ index: m.index, price: toNumber(m[2], m[3]), currency: toCurrency(m[1]) })
  }
  for (const m of t.matchAll(new RegExp(`${NUM}\\s*${CUR_AFTER}`, 'g'))) {
    candidates.push({ index: m.index, price: toNumber(m[1], m[2]), currency: toCurrency(m[3]) })
  }
  // Las expensas no son el precio.
  const valid = candidates
    .filter((c) => !/expensas\W*$/.test(t.slice(Math.max(0, c.index - 12), c.index)) && c.price > 0)
    .sort((a, b) => a.index - b.index)
  if (valid.length) return valid[0]

  const m = new RegExp(`precio\\W{0,3}${NUM}`).exec(t)
  if (m) return { price: toNumber(m[1], m[2]) }
  return undefined
}

// ---------- Superficie ----------

function parseAreas(t: string, type?: PropertyType): { builtM2?: number; landM2?: number } {
  const out: { builtM2?: number; landM2?: number } = {}
  const re = /(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mts2?|mt2|metros?(?:\s*cuadrados)?)(?![a-z])/g
  for (const m of t.matchAll(re)) {
    const value = Math.round(parseFloat(m[1].replace(',', '.')))
    const before = t.slice(Math.max(0, m.index - 25), m.index)
    const land = Math.max(before.lastIndexOf('terreno'), before.lastIndexOf('lote'), before.lastIndexOf('superficie'))
    const built = Math.max(before.lastIndexOf('constru'), before.lastIndexOf('edifica'))
    const isLand = land > built || (land === built && type === 'terreno')
    if (isLand) out.landM2 ??= value
    else out.builtM2 ??= value
  }
  return out
}

// ---------- Booleanos ----------

/** true si aparece, false si aparece negado ("sin garaje", "no se aceptan mascotas"). */
function flag(t: string, re: RegExp): boolean | undefined {
  const m = re.exec(t)
  if (!m) return undefined
  const before = t.slice(Math.max(0, m.index - 15), m.index)
  return !/\b(?:no|sin)\b/.test(before)
}

const FLAGS: [keyof Listing, RegExp][] = [
  ['garage', /garaje|parqueo|cochera|parking|estacionamiento/],
  ['pets', /mascota|pet ?friendly/],
  ['storage', /baulera/],
  ['bankCredit', /credito/],
  ['docsOk', /(?:papeles|documentacion|documentos|folio(?: real)?)[^.\n]{0,15}?(?:al dia|en orden|en regla|saneado)|(?:papeles|documentos) ok/],
  ['utilities', /servicios basicos|todos los servicios|servicios completos/],
]

// ---------- Zona ----------

const ZONE_PATTERNS: [Zone, RegExp][] = ZONES.map((z) => [z, new RegExp(`\\b${normalize(z)}\\b`)])

// ---------- Parser ----------

export function parseListing(text: string): ParsedListing {
  const t = normalize(text)
  const out: ParsedListing = { detected: [] }
  const set = <K extends keyof Listing>(key: K, value: Listing[K] | undefined) => {
    if (value === undefined) return
    ;(out as Partial<Listing>)[key] = value
    out.detected.push(key)
  }

  set('operation', earliest(t, OPERATIONS))
  set('type', earliest(t, TYPES))
  set('zone', earliest(t, ZONE_PATTERNS))

  const price = parsePrice(t)
  if (price) {
    set('price', price.price)
    if (price.currency) set('currency', price.currency)
    else if (out.operation) out.currency = currencyFor(out.operation)
  }

  set('bedrooms', num(/(\d+)\s*(?:dorm\w*|habitacion\w*|hab\b|recamara\w*|cuartos?\b)/.exec(t)))
  set('bathrooms', num(/(\d+)\s*banos?\b/.exec(t)))

  const areas = parseAreas(t, out.type)
  set('builtM2', areas.builtM2)
  set('landM2', areas.landM2)

  for (const [key, re] of FLAGS) set(key, flag(t, re) as Listing[typeof key] | undefined)

  set('commissionShare', num(/(?:compart\w*|comision\w*)[^%\d\n]{0,25}(\d{1,2})\s*(?:%|\/\s*\d{1,2})/.exec(t)))

  const g = /garantia\W{0,3}(?:de\s*)?(\d+)\s*mes/.exec(t)
  if (g) set('rentGuarantee', `${g[1]} ${g[1] === '1' ? 'mes' : 'meses'}`)
  set('rentExpenses', num(/expensas\W{0,3}(?:bs\.?\s*)?(\d+)/.exec(t)))

  return out
}

function num(m: RegExpExecArray | null): number | undefined {
  return m ? Number(m[1]) : undefined
}
