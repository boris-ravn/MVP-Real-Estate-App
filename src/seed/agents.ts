import type { Agent } from '../domain/listing'

const MONTH_MS = 30.4 * 24 * 60 * 60 * 1000

function monthsAgo(now: Date, months: number): string {
  return new Date(now.getTime() - months * MONTH_MS).toISOString()
}

/** Asesores ficticios con números claramente falsos. */
export function seedAgents(now: Date) {
  return {
    carla: { name: 'Carla Rojas Vargas', whatsapp: '+59170000001', memberSince: monthsAgo(now, 8) },
    jorge: { name: 'Jorge Mamani Flores', whatsapp: '+59170000002', memberSince: monthsAgo(now, 14) },
    daniela: { name: 'Daniela Gutiérrez Soria', whatsapp: '+59170000003', memberSince: monthsAgo(now, 3) },
    luis: { name: 'Luis Fernando Claure', whatsapp: '+59170000004', memberSince: monthsAgo(now, 26) },
    patricia: { name: 'Patricia Vargas Rocha', whatsapp: '+59170000005', memberSince: monthsAgo(now, 6) },
    marco: { name: 'Marco Antonio Zurita', whatsapp: '+59170000006', memberSince: monthsAgo(now, 11) },
    gabriela: { name: 'Gabriela Camacho Ríos', whatsapp: '+59170000007', memberSince: monthsAgo(now, 2) },
    rodrigo: { name: 'Rodrigo Siles Paz', whatsapp: '+59170000008', memberSince: monthsAgo(now, 18) },
    ximena: { name: 'Ximena Orellana Torrico', whatsapp: '+59170000009', memberSince: monthsAgo(now, 5) },
  } satisfies Record<string, Agent>
}

/**
 * Perfil con el que aparecen las propiedades "mías" de la semilla hasta que el
 * participante registre su nombre y WhatsApp al publicar por primera vez.
 */
export function demoSelfAgent(now: Date): Agent {
  return { name: 'Asesor demo', whatsapp: '+59170000099', memberSince: monthsAgo(now, 1) }
}
