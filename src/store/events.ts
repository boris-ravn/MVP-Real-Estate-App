import { KEYS, readJSON, writeJSON } from './storage'

export type EventName =
  | 'session_start'
  | 'filter_applied'
  | 'listing_viewed'
  | 'contact_click'
  | 'share_click'
  | 'publish_started'
  | 'publish_parsed'
  | 'publish_review_expanded'
  | 'publish_completed'
  | 'confirm_available'
  | 'mark_closed'

export interface TrackedEvent {
  name: EventName
  /** ISO datetime. */
  at: string
  sessionId: string
  data?: Record<string, unknown>
}

/** Una sesión = una carga de la app. */
const sessionId = Math.random().toString(36).slice(2, 10)

export function currentSessionId(): string {
  return sessionId
}

export function getEvents(): TrackedEvent[] {
  return readJSON<TrackedEvent[]>(KEYS.events) ?? []
}

export function logEvent(name: EventName, data?: Record<string, unknown>): TrackedEvent {
  const event: TrackedEvent = { name, at: new Date().toISOString(), sessionId, ...(data ? { data } : {}) }
  writeJSON(KEYS.events, [...getEvents(), event])
  return event
}

export function clearEvents(): void {
  writeJSON(KEYS.events, [])
}

/** Conteo por evento, en orden de primera aparición. Ej.: "session_start ×1 · filter_applied ×4". */
export function summarizeEvents(events: TrackedEvent[]): string {
  const counts = new Map<EventName, number>()
  for (const e of events) counts.set(e.name, (counts.get(e.name) ?? 0) + 1)
  return [...counts].map(([name, n]) => `${name} ×${n}`).join(' · ')
}
