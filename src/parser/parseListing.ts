// Deterministic "WhatsApp message → listing" parser (regex + dictionaries).
// The UI only depends on parseListing's signature, so it can later be
// replaced by an LLM without touching the screens.

import type { Currency, Listing, Operation, PropertyType, Zone } from '../domain/listing'
import { currencyFor, ZONES } from '../domain/listing'
import { ZONE_ALIASES } from './zoneAliases'

export type ParsedListing = Partial<Listing> & {
  /** Fields the parser found in the text (the rest are left to fill in by hand). */
  detected: string[]
  /** Fields inferred with less certainty (today, the zone from an avenue): they get reviewed and do not count as detected. */
  suggested?: string[]
  /** Text the suggested zone came from, e.g. "Av. Heroinas". */
  zoneHint?: string
}

/** Lowercase, no accents and no emojis, to compare regardless of how it was written. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, ' ')
    .toLowerCase()
}

/** First pattern (by position in the text) that matches. */
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

// ---------- Price ----------

// "95k" and "4 mil" multiply by 1,000.
const NUM = String.raw`(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(?:(k|mil)(?![a-z]))?`
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

interface Span {
  start: number
  end: number
}

const overlaps = (a: Span, b?: Span) => !!b && a.start < b.end && b.start < a.end

/** `skip`: where the HOA fees are, so they are not mistaken for the price. */
function parsePrice(t: string, skip?: Span): { price: number; currency?: Currency } | undefined {
  const candidates: { index: number; price: number; currency: Currency }[] = []
  const add = (m: RegExpMatchArray, price: number, currency: Currency) => {
    if (!overlaps({ start: m.index!, end: m.index! + m[0].length }, skip)) candidates.push({ index: m.index!, price, currency })
  }
  for (const m of t.matchAll(new RegExp(`${CUR_BEFORE}\\s*${NUM}`, 'g'))) add(m, toNumber(m[2], m[3]), toCurrency(m[1]))
  for (const m of t.matchAll(new RegExp(`${NUM}\\s*${CUR_AFTER}`, 'g'))) add(m, toNumber(m[1], m[2]), toCurrency(m[3]))
  const valid = candidates.filter((c) => c.price > 0).sort((a, b) => a.index - b.index)
  if (valid.length) return valid[0]

  // No currency: "precio 3.200", or a number with "mil"/"k" ("4 mil"); the currency comes from the operation.
  for (const re of [new RegExp(`precio\\W{0,3}${NUM}`, 'g'), /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(k|mil)(?![a-z])/g]) {
    for (const m of t.matchAll(re)) {
      if (!overlaps({ start: m.index!, end: m.index! + m[0].length }, skip)) return { price: toNumber(m[1], m[2]) }
    }
  }
  return undefined
}

// ---------- Area ----------

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

// ---------- Booleans ----------

/** true if it appears, false if it appears negated ("sin garaje", "no se aceptan mascotas"). */
function flag(t: string, re: RegExp): boolean | undefined {
  const m = re.exec(t)
  if (!m) return undefined
  const before = t.slice(Math.max(0, m.index - 15), m.index)
  // "s/garaje" is the short form of "sin garaje", just as "c/garaje" is "con garaje".
  return !/\b(?:no|sin)\b|\bs\/\s*$/.test(before)
}

const FLAGS: [keyof Listing, RegExp][] = [
  ['garage', /garaje|parqueo|cochera|parking|estacionamiento/],
  ['pets', /mascota|pet ?friendly/],
  ['storage', /baulera/],
  ['bankCredit', /credito/],
  ['docsOk', /(?:papeles|documentacion|documentos|folio(?: real)?)[^.\n]{0,15}?(?:al dia|en orden|en regla|saneado)|(?:papeles|documentos) ok/],
  ['utilities', /servicios basicos|todos los servicios|servicios completos/],
]

// ---------- Zone ----------

// "Queru Queru", "Queru-Queru" and "Queruqueru" are equivalent.
const ZONE_PATTERNS: [Zone, RegExp][] = ZONES.map((z) => [z, new RegExp(`\\b${normalize(z).replace(/ /g, '[\\s-]?')}\\b`)])

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

const ALIAS_PATTERNS: [{ zone: Zone; hint: string }, RegExp][] = ZONE_ALIASES.map(({ name, zone, avenue }) => [
  { zone, hint: avenue ? `Av. ${titleCase(name)}` : titleCase(name) },
  new RegExp(`${avenue ? String.raw`(?:\b(?:av|avda|avenida)\.?\s*)?` : ''}\\b${name.replace(/ /g, '\\s+')}\\b`),
])

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
  if (!out.zone) {
    const alias = earliest(t, ALIAS_PATTERNS)
    if (alias) {
      out.zone = alias.zone
      out.suggested = ['zone']
      out.zoneHint = alias.hint
    }
  }

  // HOA fees first, so their amount is not taken as the price ("250 de expensas Bs 3.800").
  const expenses = parseExpenses(t)
  const price = parsePrice(t, expenses?.span)
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
  set('rentExpenses', expenses?.value)

  return out
}

const AMOUNT = String.raw`(\d{1,3}(?:[.,]\d{3})+|\d+)`
// The amount comes first only when it clearly belongs to the HOA fees: "+ 250 expensas", "250 de expensas".
const EXPENSES_BEFORE = new RegExp(String.raw`(?:\+\s*(?:bs\.?\s*)?${AMOUNT}\s*(?:bs\.?\s*)?(?:de\s+)?|(?<![\d.,])${AMOUNT}\s*(?:bs\.?\s*)?de\s+)expensas`)
const EXPENSES_AFTER = new RegExp(String.raw`expensas\W{0,3}(?:bs\.?\s*)?${AMOUNT}`)

/**
 * "expensas 250", "250 de expensas", "+ 250 bs expensas"; "expensas incluidas" = 0.
 * `span` marks where the amount is, so parsePrice does not take it as the price.
 */
function parseExpenses(t: string): { value: number; span?: Span } | undefined {
  if (/expensas\s+incluidas|incluye\s+(?:las\s+)?expensas/.test(t)) return { value: 0 }
  const m = EXPENSES_BEFORE.exec(t) ?? EXPENSES_AFTER.exec(t)
  if (!m) return undefined
  return { value: toNumber(m[1] ?? m[2]), span: { start: m.index, end: m.index + m[0].length } }
}

function num(m: RegExpExecArray | null): number | undefined {
  return m ? Number(m[1]) : undefined
}
