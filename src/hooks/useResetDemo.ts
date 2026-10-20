import { EMPTY_FILTERS } from '../domain/filters'
import { resetDemo, useStore } from '../store/context'
import { logEvent } from '../store/events'
import { useFilters } from '../store/filtersContext'

/** "Reiniciar demo" (Reset demo) between participants: seed, profile, events and filters. Asks for confirmation. */
export function useResetDemo() {
  const { dispatch } = useStore()
  const [, setFilters] = useFilters()
  return () => {
    if (!window.confirm('¿Reiniciar la demo? Se restauran las propiedades de ejemplo y se borran el perfil y los eventos.')) return false
    resetDemo(dispatch)
    setFilters(EMPTY_FILTERS)
    // New test session from here on.
    logEvent('session_start', { reset: true })
    return true
  }
}
