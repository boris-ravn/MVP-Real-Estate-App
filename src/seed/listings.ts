import type { Agent, Listing, PhotoId } from '../domain/listing'
import { currencyFor } from '../domain/listing'
import { demoSelfAgent, seedAgents } from './agents'

const DAY_MS = 24 * 60 * 60 * 1000

type SeedRow = Omit<Listing, 'id' | 'currency' | 'lastConfirmedAt' | 'createdAt' | 'status' | 'isMine' | 'agent' | 'photos'> & {
  /** Días desde la última confirmación (relativo a "hoy" para que la mezcla de frescura no envejezca). */
  confirmedDaysAgo: number
  agent: Agent | 'me'
  photos?: PhotoId[]
}

/** Campos desconocidos por defecto: la semilla solo declara lo que cada propiedad sí tiene. */
const UNKNOWN = {
  bedrooms: null,
  bathrooms: null,
  builtM2: null,
  landM2: null,
  garage: null,
  pets: null,
  storage: null,
  bankCredit: null,
  docsOk: null,
  utilities: null,
  commissionShare: null,
} as const

const PHOTO_SETS: PhotoId[][] = [
  ['fachada', 'living', 'cocina', 'dormitorio'],
  ['living', 'dormitorio', 'bano'],
  ['fachada', 'patio', 'living', 'cocina', 'bano'],
  ['fachada'],
  ['living', 'cocina'],
]

export function buildSeedListings(now: Date = new Date()): Listing[] {
  const a = seedAgents(now)

  const rows: SeedRow[] = [
    // ---------- Venta (USD) ----------
    { ...UNKNOWN, operation: 'venta', type: 'departamento', zone: 'Queru Queru', price: 95000, bedrooms: 3, bathrooms: 2, builtM2: 110, garage: true, pets: true, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 1, agent: a.carla,
      description: 'Departamento en 5.º piso con vista a la cordillera, a una cuadra de la Av. Santa Cruz. Cocina americana, lavandería y portería 24 h.' },
    { ...UNKNOWN, operation: 'venta', type: 'departamento', zone: 'Cala Cala', price: 128000, bedrooms: 3, bathrooms: 2, builtM2: 125, garage: true, pets: false, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 40, ownerAuthorized: false, confirmedDaysAgo: 5, agent: a.jorge,
      description: 'Edificio nuevo con ascensor y área social. Dormitorio principal en suite y balcón.' },
    { ...UNKNOWN, operation: 'venta', type: 'departamento', zone: 'Sarco', price: 72000, bedrooms: 2, bathrooms: 1, builtM2: 78, garage: false, pets: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 0, agent: a.daniela,
      description: 'Ideal para pareja joven o inversión. Cerca de la Av. América y de colegios.' },
    { ...UNKNOWN, operation: 'venta', type: 'departamento', zone: 'Zona Norte', price: 180000, bedrooms: 4, bathrooms: 3, builtM2: 165, garage: true, pets: true, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 30, ownerAuthorized: true, confirmedDaysAgo: 12, agent: a.luis,
      description: 'Penthouse con terraza propia y dos parqueos. Acabados de primera.' },
    { ...UNKNOWN, operation: 'venta', type: 'departamento', zone: 'Centro', price: 58000, bedrooms: 1, bathrooms: 1, builtM2: 52, garage: false, pets: false, storage: false, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 20, agent: a.patricia,
      description: 'Monoambiente amplio a tres cuadras de la plaza 14 de Septiembre. Buena opción para renta.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Tiquipaya', price: 245000, bedrooms: 4, bathrooms: 3, builtM2: 280, landM2: 450, garage: true, pets: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 40, ownerAuthorized: true, confirmedDaysAgo: 2, agent: a.marco,
      description: 'Casa en condominio cerrado con jardín, churrasquera y garaje para dos autos.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Mayorazgo', price: 190000, bedrooms: 3, bathrooms: 2, builtM2: 210, landM2: 300, garage: true, pets: true, storage: false, bankCredit: true, utilities: true, commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 8, agent: a.gabriela,
      description: 'Casa de dos plantas con patio trasero. Requiere algunos arreglos menores.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Sacaba', price: 98000, bedrooms: 3, bathrooms: 2, builtM2: 160, landM2: 250, garage: true, pets: true, storage: false, bankCredit: false, docsOk: true, utilities: false, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 3, agent: a.rodrigo,
      description: 'Casa nueva cerca de la plaza principal de Sacaba. Falta conexión de gas domiciliario.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Recoleta', price: 340000, bedrooms: 5, bathrooms: 4, builtM2: 380, landM2: 600, garage: true, pets: true, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 30, ownerAuthorized: true, confirmedDaysAgo: 25, agent: a.ximena,
      description: 'Residencia con piscina, dependencias de servicio y amplio jardín.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Quillacollo', price: 115000, bedrooms: 3, landM2: 320, garage: true, ownerAuthorized: false, confirmedDaysAgo: 1, agent: a.jorge,
      description: 'Casa sobre avenida, apta para vivienda y negocio.' },
    { ...UNKNOWN, operation: 'venta', type: 'terreno', zone: 'Colcapirhua', price: 65000, landM2: 500, bankCredit: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 6, agent: a.luis,
      description: 'Terreno plano en urbanización consolidada, con todos los servicios en la puerta.' },
    { ...UNKNOWN, operation: 'venta', type: 'terreno', zone: 'Temporal', price: 140000, landM2: 800, bankCredit: false, docsOk: true, utilities: true, commissionShare: 40, ownerAuthorized: false, confirmedDaysAgo: 18, agent: a.patricia,
      description: 'Lote esquina, ideal para proyecto de edificio. Folio real al día.' },
    { ...UNKNOWN, operation: 'venta', type: 'local', zone: 'Centro', price: 155000, bathrooms: 1, builtM2: 90, garage: false, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 1, agent: a.marco,
      description: 'Local comercial en planta baja sobre calle Ayacucho, con depósito.' },
    { ...UNKNOWN, operation: 'venta', type: 'casa', zone: 'Tiquipaya', price: 128000, bedrooms: 3, bathrooms: 2, builtM2: 220, landM2: 350, garage: true, pets: true, storage: true, bankCredit: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 16, agent: 'me',
      description: 'Casa con jardín y vista al cerro, a 10 minutos de la plaza de Tiquipaya.' },

    // ---------- Alquiler (Bs) ----------
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', price: 3800, bedrooms: 2, bathrooms: 2, builtM2: 85, garage: true, pets: true, storage: false, docsOk: true, utilities: true, rentGuarantee: '2 meses', rentExpenses: 250, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 1, agent: a.carla,
      description: 'Departamento en 4.º piso con balcón, a dos cuadras de la Av. América. Cocina equipada y portería 24 h.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', price: 2900, bedrooms: 2, bathrooms: 1, builtM2: 70, garage: true, pets: true, docsOk: true, utilities: true, rentGuarantee: '1 mes', rentExpenses: 200, commissionShare: 40, ownerAuthorized: false, confirmedDaysAgo: 6, agent: a.daniela,
      description: 'Departamento luminoso, cerca del mercado de Cala Cala.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Cala Cala', price: 4500, bedrooms: 3, garage: true, pets: true, commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 19, agent: a.rodrigo,
      description: 'Amplio, con dependencia de servicio.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Queru Queru', price: 3500, bedrooms: 2, bathrooms: 2, builtM2: 90, garage: true, pets: false, storage: true, docsOk: true, utilities: true, rentGuarantee: '2 meses', rentExpenses: 300, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 0, agent: a.gabriela,
      description: 'Amoblado opcional. Edificio con gimnasio y seguridad.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Tupuraya', price: 2500, bedrooms: 2, bathrooms: 1, builtM2: 65, garage: true, pets: true, storage: false, docsOk: true, utilities: true, rentGuarantee: '1 mes', rentExpenses: 150, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 3, agent: a.ximena,
      description: 'Zona tranquila, cerca de la universidad. Aceptan mascotas pequeñas.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Zona Norte', price: 5800, bedrooms: 3, bathrooms: 3, builtM2: 140, garage: true, pets: true, storage: true, docsOk: true, utilities: true, rentGuarantee: '2 meses', rentExpenses: 400, commissionShare: 30, ownerAuthorized: true, confirmedDaysAgo: 9, agent: a.luis,
      description: 'Departamento de lujo con dos parqueos y baulera.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Muyurina', price: 2000, bedrooms: 1, bathrooms: 1, builtM2: 45, garage: false, pets: true, storage: false, utilities: true, rentGuarantee: '1 mes', commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 4, agent: a.patricia,
      description: 'Ideal para estudiante o persona sola. Servicios incluidos excepto luz.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'casa', zone: 'Sarco', price: 5500, bedrooms: 3, bathrooms: 2, builtM2: 180, landM2: 250, garage: true, pets: true, docsOk: true, utilities: true, rentGuarantee: '2 meses', commissionShare: 40, ownerAuthorized: true, confirmedDaysAgo: 14, agent: a.marco,
      description: 'Casa con patio y lavandería, sobre calle tranquila.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'local', zone: 'Centro', price: 4200, bathrooms: 1, builtM2: 60, garage: false, docsOk: true, utilities: true, rentGuarantee: '3 meses', rentExpenses: 0, commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 30, agent: a.jorge,
      description: 'Local a media cuadra de la calle Heroínas, con vitrina a la calle.' },
    { ...UNKNOWN, operation: 'alquiler', type: 'departamento', zone: 'Queru Queru', price: 3200, bedrooms: 2, bathrooms: 1, builtM2: 75, garage: true, pets: false, storage: true, docsOk: true, utilities: true, rentGuarantee: '2 meses', rentExpenses: 220, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 2, agent: 'me',
      description: 'Departamento en 3.er piso, cerca del parque Lincoln.' },

    // ---------- Anticrético (USD) ----------
    { ...UNKNOWN, operation: 'anticretico', type: 'departamento', zone: 'Recoleta', price: 45000, bedrooms: 3, bathrooms: 2, builtM2: 105, garage: true, pets: false, storage: true, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 2, agent: a.carla,
      description: 'Anticrético por 2 años renovables. Edificio con ascensor.' },
    { ...UNKNOWN, operation: 'anticretico', type: 'casa', zone: 'Sacaba', price: 30000, bedrooms: 3, bathrooms: 1, builtM2: 140, landM2: 200, garage: true, pets: true, commissionShare: 40, ownerAuthorized: false, confirmedDaysAgo: 11, agent: a.gabriela,
      description: 'Casa de una planta con patio grande.' },
    { ...UNKNOWN, operation: 'anticretico', type: 'departamento', zone: 'Zona Sur', price: 22000, bedrooms: 2, bathrooms: 1, builtM2: 68, garage: false, pets: true, commissionShare: 50, ownerAuthorized: false, confirmedDaysAgo: 22, agent: a.rodrigo,
      description: 'Departamento en planta baja con pequeño jardín.' },
    { ...UNKNOWN, operation: 'anticretico', type: 'departamento', zone: 'Sarco', price: 35000, bedrooms: 2, bathrooms: 1, builtM2: 75, garage: true, pets: true, storage: false, docsOk: true, utilities: true, commissionShare: 50, ownerAuthorized: true, confirmedDaysAgo: 9, agent: 'me',
      description: 'Anticrético por 2 años. Edificio pequeño y tranquilo.' },
  ]

  const self = demoSelfAgent(now)
  return rows.map(({ confirmedDaysAgo, agent, photos, ...row }, i) => {
    const confirmed = new Date(now.getTime() - confirmedDaysAgo * DAY_MS)
    const created = new Date(confirmed.getTime() - ((i * 7) % 40) * DAY_MS)
    return {
      ...row,
      id: `seed-${String(i + 1).padStart(2, '0')}`,
      currency: currencyFor(row.operation),
      photos: photos ?? PHOTO_SETS[i % PHOTO_SETS.length],
      agent: agent === 'me' ? self : agent,
      isMine: agent === 'me',
      status: 'active',
      lastConfirmedAt: confirmed.toISOString(),
      createdAt: created.toISOString(),
    }
  })
}
