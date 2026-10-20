import type { Zone } from '../domain/listing'

/**
 * Avenidas y lugares conocidos → zona sugerida (C3 del PRD v2).
 *
 * El nombre va en minúsculas y sin tildes (como lo deja `normalize`). Para avenidas,
 * el parser acepta el nombre con o sin "Av.", "Avda." o "Avenida" delante.
 *
 * Una avenida puede cruzar varias zonas: por eso la zona solo se *sugiere* y el
 * asesor la revisa. Solo se incluyen asociaciones validadas.
 *
 * PENDIENTE (Boris): asignar zona a Av. Pando, Av. América, Av. Santa Cruz, Av. Ayacucho,
 * Av. Villazón, Av. Blanco Galindo, Av. Melchor Pérez de Olguín, Av. Circunvalación,
 * El Prado, Laguna Alalay y Cristo de la Concordia.
 */
export const ZONE_ALIASES: { name: string; zone: Zone; avenue?: boolean }[] = [
  { name: 'plaza 14 de septiembre', zone: 'Centro' },
  { name: 'plaza colon', zone: 'Centro' },
  { name: 'heroinas', zone: 'Centro', avenue: true },
]
