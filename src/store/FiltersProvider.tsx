import { useState, type ReactNode } from 'react'
import { EMPTY_FILTERS, type Filters } from '../domain/filters'
import { FiltersContext } from './filtersContext'

export function FiltersProvider({ children }: { children: ReactNode }) {
  const value = useState<Filters>(EMPTY_FILTERS)
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
