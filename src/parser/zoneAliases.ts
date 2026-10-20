import type { Zone } from '../domain/listing'

/**
 * Known avenues and landmarks → suggested zone (C3 of PRD v2).
 *
 * Names are lowercase and accent-free (as `normalize` leaves them). For avenues,
 * the parser accepts the name with or without "Av.", "Avda." or "Avenida" in front.
 *
 * An avenue can cross several zones: that is why the zone is only *suggested* and the
 * agent reviews it. Only validated associations are included.
 *
 * TODO (Boris): assign a zone to Av. Pando, Av. América, Av. Santa Cruz, Av. Ayacucho,
 * Av. Villazón, Av. Blanco Galindo, Av. Melchor Pérez de Olguín, Av. Circunvalación,
 * El Prado, Laguna Alalay and Cristo de la Concordia.
 */
export const ZONE_ALIASES: { name: string; zone: Zone; avenue?: boolean }[] = [
  { name: 'plaza 14 de septiembre', zone: 'Centro' },
  { name: 'plaza colon', zone: 'Centro' },
  { name: 'heroinas', zone: 'Centro', avenue: true },
]
