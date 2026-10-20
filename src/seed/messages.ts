import type { Listing } from '../domain/listing'

export interface SeedMessage {
  text: string
  /** Lo que el parser debería extraer como mínimo (usado en los tests de la Fase 4). */
  expected: Partial<Listing>
}

/** Mensajes estilo WhatsApp para probar el parser "pegar mensaje → ficha". */
export const SEED_MESSAGES: SeedMessage[] = [
  {
    text: 'VENDO DPTO 🏢 Queru Queru\n3 dorm, 2 baños, 110 m2\nc/garaje y baulera\nPrecio: 95.000 $us\nAcepta crédito bancario ✅\nComparto 50%',
    expected: { operation: 'venta', type: 'departamento', zone: 'Queru Queru', price: 95000, currency: 'USD', bedrooms: 3, bathrooms: 2, builtM2: 110, garage: true, storage: true, bankCredit: true, commissionShare: 50 },
  },
  {
    text: 'Alquilo departamento en Cala Cala 🔑 2 dormitorios, 1 baño, con parqueo, aceptan mascotas 🐶. Bs 3.500 + expensas. Garantía 2 meses. Comisión compartida 50/50',
    expected: { operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', price: 3500, currency: 'BOB', bedrooms: 2, bathrooms: 1, garage: true, pets: true, commissionShare: 50 },
  },
  {
    text: '🏡 CASA EN VENTA - TIQUIPAYA\n4 habitaciones · 3 baños\nTerreno 450 mts, construcción 280 mts\nCochera para 2 autos\nPapeles al día\n$us 245k\nComparto 40%',
    expected: { operation: 'venta', type: 'casa', zone: 'Tiquipaya', price: 245000, currency: 'USD', bedrooms: 4, bathrooms: 3, garage: true, docsOk: true, commissionShare: 40 },
  },
  {
    text: 'Anticrético dpto Sarco 2 dorm 1 baño 75m² garaje 35.000 USD, acepta mascotas, comparto 50%',
    expected: { operation: 'anticretico', type: 'departamento', zone: 'Sarco', price: 35000, currency: 'USD', bedrooms: 2, bathrooms: 1, builtM2: 75, garage: true, pets: true, commissionShare: 50 },
  },
  {
    text: 'SE VENDE TERRENO en Colcapirhua 500 m2, documentación al día, servicios básicos, 65.000 dólares. Acepta crédito. Comparto comisión 50%',
    expected: { operation: 'venta', type: 'terreno', zone: 'Colcapirhua', price: 65000, currency: 'USD', docsOk: true, utilities: true, bankCredit: true, commissionShare: 50 },
  },
  {
    text: 'alquiler depto zona norte, 3 dorm 3 baños, 140mts, c/garaje, baulera, 5.800 bs. mascotas ok. comision compartida 30%',
    expected: { operation: 'alquiler', type: 'departamento', zone: 'Zona Norte', price: 5800, currency: 'BOB', bedrooms: 3, bathrooms: 3, builtM2: 140, garage: true, storage: true, pets: true, commissionShare: 30 },
  },
  {
    text: '🔥OPORTUNIDAD🔥 Vendo casa en Sacaba, 3 dormitorios, 2 baños, garaje, $98.000, papeles en orden, comparto el 50%',
    expected: { operation: 'venta', type: 'casa', zone: 'Sacaba', price: 98000, currency: 'USD', bedrooms: 3, bathrooms: 2, garage: true, docsOk: true, commissionShare: 50 },
  },
  {
    text: 'Local en alquiler Centro, 60 m2, 1 baño, Bs 4200 mensual, garantía 3 meses. Comparto 50%',
    expected: { operation: 'alquiler', type: 'local', zone: 'Centro', price: 4200, currency: 'BOB', bathrooms: 1, builtM2: 60, commissionShare: 50 },
  },
  // PRD v2 (C3): "mil", variantes de zonas, avenidas y expensas.
  {
    text: 'Alquilo dpto 2 dorm, 1 baño, por la Av. Heroínas 🔑 4 mil Bs + 300 de expensas, c/garaje, aceptan mascotas. Comparto 50%',
    expected: { operation: 'alquiler', type: 'departamento', price: 4000, currency: 'BOB', bedrooms: 2, bathrooms: 1, garage: true, pets: true, rentExpenses: 300, commissionShare: 50 },
  },
  {
    text: 'VENDO CASA en Queruqueru 🏡 4 dorm, 3 baños, $us 185 mil. Papeles al día. Comparto 50%',
    expected: { operation: 'venta', type: 'casa', zone: 'Queru Queru', price: 185000, currency: 'USD', bedrooms: 4, bathrooms: 3, docsOk: true, commissionShare: 50 },
  },
  {
    text: 'Alquiler departamento Cala-Cala 3 dorm 2 baños, Bs 3,5 mil, expensas incluidas, garantía 2 meses, comision compartida 40%',
    expected: { operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', price: 3500, currency: 'BOB', bedrooms: 3, bathrooms: 2, rentExpenses: 0, rentGuarantee: '2 meses', commissionShare: 40 },
  },
]
