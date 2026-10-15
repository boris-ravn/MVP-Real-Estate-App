// Acceso a localStorage tolerante a fallos (modo privado, cuota llena, etc.).

const PREFIX = 'rp.v1.'

export const KEYS = {
  listings: `${PREFIX}listings`,
  profile: `${PREFIX}profile`,
  events: `${PREFIX}events`,
} as const

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sin persistencia: el prototipo sigue funcionando en memoria.
  }
}

export function removeKeys(keys: string[]): void {
  try {
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignorar
  }
}
