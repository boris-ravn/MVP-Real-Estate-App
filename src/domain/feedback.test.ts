import { describe, expect, it } from 'vitest'
import type { TrackedEvent } from '../store/events'
import { feedbackMessage } from './feedback'

const now = new Date('2026-10-15T12:15:00Z')
const ev = (name: TrackedEvent['name'], at: string, data?: Record<string, unknown>): TrackedEvent => ({ name, at, sessionId: 's1', data })

describe('mensaje de feedback', () => {
  it('incluye respuestas, duración, conteo de eventos y resultado del parser', () => {
    const events = [
      ev('session_start', '2026-10-15T12:00:00Z'),
      ev('filter_applied', '2026-10-15T12:01:00Z'),
      ev('filter_applied', '2026-10-15T12:02:00Z'),
      ev('publish_parsed', '2026-10-15T12:05:00Z', { manual: false, detectedCount: 9, relevantCount: 14 }),
      ev('publish_completed', '2026-10-15T12:07:00Z'),
    ]
    const msg = feedbackMessage({ usefulness: 4, missing: 'Fotos reales', wouldUse: 'Tal vez' }, events, 'RedProp', now)
    expect(msg).toBe(
      [
        'Feedback RedProp',
        '¿Qué tan útil? 4/5',
        '¿Lo usaría para su próximo cliente? Tal vez',
        '¿Qué le falta o cambiaría? Fotos reales',
        '---',
        'Sesión (15 min): session_start ×1 · filter_applied ×2 · publish_parsed ×1 · publish_completed ×1',
        'Parser: 9 de 14 campos detectados',
        'Publicación completada: sí',
      ].join('\n'),
    )
  })

  it('tolera respuestas vacías y sesión sin eventos', () => {
    const msg = feedbackMessage({ usefulness: null, missing: '  ', wouldUse: null }, [], 'X', now)
    expect(msg).toContain('¿Qué tan útil? —/5')
    expect(msg).toContain('¿Qué le falta o cambiaría? —')
    expect(msg).toContain('Sesión: sin eventos')
  })
})
