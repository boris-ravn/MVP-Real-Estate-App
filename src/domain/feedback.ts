import type { TrackedEvent } from '../store/events'
import { summarizeEvents } from '../store/events'

export type WouldUse = 'Sí' | 'Tal vez' | 'No'

export interface FeedbackAnswers {
  /** 1 a 5. */
  usefulness: number | null
  missing: string
  wouldUse: WouldUse | null
}

function minutesBetween(a: string, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - new Date(a).getTime()) / 60000))
}

/** Respuestas + resumen de lo que hizo el participante en esta sesión (F7). */
export function feedbackMessage(a: FeedbackAnswers, events: TrackedEvent[], productName: string, now: Date = new Date()): string {
  const lines = [
    `Feedback ${productName}`,
    `¿Qué tan útil? ${a.usefulness ?? '—'}/5`,
    `¿Lo usaría para su próximo cliente? ${a.wouldUse ?? '—'}`,
    `¿Qué le falta o cambiaría? ${a.missing.trim() || '—'}`,
    '---',
  ]

  if (events.length === 0) {
    lines.push('Sesión: sin eventos')
    return lines.join('\n')
  }

  lines.push(`Sesión (${minutesBetween(events[0].at, now)} min): ${summarizeEvents(events)}`)

  // Para el criterio "el parser detecta ≥ 5 campos con su mensaje real".
  for (const e of events.filter((x) => x.name === 'publish_parsed')) {
    const d = e.data ?? {}
    lines.push(d.manual ? 'Publicar: llenado manual' : `Parser: ${d.detectedCount} de ${d.relevantCount} campos detectados`)
  }
  if (events.some((e) => e.name === 'publish_completed')) lines.push('Publicación completada: sí')

  return lines.join('\n')
}
