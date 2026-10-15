import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Filters } from '../domain/filters'

/** Los filtros viven fuera de la pantalla para conservarse al ir al detalle y volver. */
export const FiltersContext = createContext<[Filters, Dispatch<SetStateAction<Filters>>] | null>(null)

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters debe usarse dentro de <FiltersProvider>')
  return ctx
}
