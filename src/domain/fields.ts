import type { DetailField, Listing, Operation, PropertyType } from './listing'

/**
 * How much a field matters for a type and operation (PRD v3 D1):
 * recommended = asked in "Te falta"; optional = under "Más datos"; notApplicable = under "No aplica" by default, but it can be added back.
 * A field without a level never applies (bedrooms on a plot of land) and is not shown anywhere.
 */
export type FieldLevel = 'recommended' | 'optional' | 'notApplicable'

// One letter per operation, in this order: venta, alquiler, anticrético.
// R = recommended · O = optional · N = not applicable by default · - = never applies.
const MATRIX: Record<DetailField, Record<PropertyType, string>> = {
  bedrooms: { casa: 'RRR', departamento: 'RRR', terreno: '---', local: '---' },
  bathrooms: { casa: 'RRR', departamento: 'RRR', terreno: '---', local: 'RRR' },
  builtM2: { casa: 'RRR', departamento: 'RRR', terreno: 'NNN', local: 'RRR' },
  landM2: { casa: 'ROO', departamento: '---', terreno: 'RRR', local: 'NNN' },
  garage: { casa: 'RRR', departamento: 'RRR', terreno: '---', local: 'OOO' },
  pets: { casa: 'NRR', departamento: 'ORR', terreno: '---', local: '---' },
  storage: { casa: 'NNN', departamento: 'OOO', terreno: '---', local: 'NNN' },
  bankCredit: { casa: 'R-O', departamento: 'R-O', terreno: 'R-O', local: 'R-O' },
  docsOk: { casa: 'ROR', departamento: 'ROR', terreno: 'RRR', local: 'OOO' },
  utilities: { casa: 'OOO', departamento: 'OOO', terreno: 'RRR', local: 'OOO' },
  rentGuarantee: { casa: '-R-', departamento: '-R-', terreno: '---', local: '-R-' },
  rentExpenses: { casa: '-OO', departamento: '-RO', terreno: '---', local: '-OO' },
  commissionShare: { casa: 'RRR', departamento: 'RRR', terreno: 'RRR', local: 'RRR' },
}

const OPERATION_INDEX: Record<Operation, number> = { venta: 0, alquiler: 1, anticretico: 2 }
const LEVELS: Record<string, FieldLevel | null> = { R: 'recommended', O: 'optional', N: 'notApplicable', '-': null }

/** In listing order. */
export const DETAIL_FIELDS = Object.keys(MATRIX) as DetailField[]

/** Until the agent picks them, the type counts as an apartment and the operation as a sale. */
export function fieldLevel(f: DetailField, l: { type: PropertyType | null; operation: Operation | null }): FieldLevel | null {
  return LEVELS[MATRIX[f][l.type ?? 'departamento'][OPERATION_INDEX[l.operation ?? 'venta']]]
}

/** "No aplica" fields of a listing. Listings saved before PRD v3 don't have the list: their empty "not applicable by default" fields count. */
export function notApplicableOf(l: Pick<Listing, 'type' | 'operation' | 'notApplicable' | DetailField>): DetailField[] {
  return l.notApplicable ?? DETAIL_FIELDS.filter((f) => fieldLevel(f, l) === 'notApplicable' && l[f] == null)
}
