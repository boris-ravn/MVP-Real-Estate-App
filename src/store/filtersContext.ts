import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Filters } from '../domain/filters'

/** Filters live outside the screen so they persist when going to the detail view and back. */
export const FiltersContext = createContext<[Filters, Dispatch<SetStateAction<Filters>>] | null>(null)

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters must be used inside <FiltersProvider>')
  return ctx
}
