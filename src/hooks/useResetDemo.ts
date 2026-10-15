import { EMPTY_FILTERS } from '../domain/filters'
import { resetDemo, useStore } from '../store/context'
import { logEvent } from '../store/events'
import { useFilters } from '../store/filtersContext'

/** "Reiniciar demo" entre participantes: semilla, perfil, eventos y filtros. Pide confirmación. */
export function useResetDemo() {
  const { dispatch } = useStore()
  const [, setFilters] = useFilters()
  return () => {
    if (!window.confirm('¿Reiniciar la demo? Se restauran las propiedades de ejemplo y se borran el perfil y los eventos.')) return false
    resetDemo(dispatch)
    setFilters(EMPTY_FILTERS)
    // Nueva sesión de prueba a partir de aquí.
    logEvent('session_start', { reset: true })
    return true
  }
}
