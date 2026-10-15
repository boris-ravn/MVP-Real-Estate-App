import { House, Plus, SearchX, UserRound } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import { ListingCard } from '../components/ListingCard'
import { PRODUCT_NAME } from '../config'
import {
  activeFilterKeys,
  describeFilters,
  EMPTY_FILTERS,
  filterListings,
  mostRestrictiveFilter,
  removeFilter,
} from '../domain/filters'
import { useLongPress } from '../hooks/useLongPress'
import { useResetDemo } from '../hooks/useResetDemo'
import { useStore } from '../store/context'
import { logEvent } from '../store/events'
import { useFilters } from '../store/filtersContext'
import { publicListings } from '../store/listingsReducer'
import { FilterBar } from './home/FilterBar'

/** Posición del listado, para volver al mismo lugar después de ver una ficha. */
let savedScrollY = 0

export function Home() {
  const { state } = useStore()
  const [filters, setFilters] = useFilters()

  const all = useMemo(() => publicListings(state.listings), [state.listings])
  const results = useMemo(() => filterListings(all, filters), [all, filters])
  const hasFilters = activeFilterKeys(filters).length > 0
  const suggestion = results.length === 0 ? mostRestrictiveFilter(all, filters) : null

  useLayoutEffect(() => {
    window.scrollTo(0, savedScrollY)
    return () => {
      savedScrollY = window.scrollY
    }
  }, [])

  // filter_applied: solo cuando los filtros cambian (no al montar ni al volver del detalle).
  const lastLogged = useRef(JSON.stringify(filters))
  useEffect(() => {
    const json = JSON.stringify(filters)
    if (json === lastLogged.current) return
    lastLogged.current = json
    logEvent('filter_applied', { filters: describeFilters(filters), results: results.length })
  }, [filters, results.length])

  // Oculto para el moderador: toque largo en el logo = Reiniciar demo (entre participantes).
  const resetDemo = useResetDemo()
  const longPress = useLongPress(() => {
    resetDemo()
  })

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <header className="flex items-center justify-between px-4 pt-2">
          <div {...longPress} className="flex min-h-11 items-center gap-2 text-lg font-bold select-none" aria-label={PRODUCT_NAME}>
            <House size={22} className="text-brand-600" aria-hidden />
            {PRODUCT_NAME}
          </div>
          <Link to="/mis-propiedades" className="-mr-2 flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Mis propiedades">
            <UserRound size={24} />
          </Link>
        </header>
        <FilterBar filters={filters} setFilters={setFilters} resultCount={results.length} />
        <div className="flex min-h-10 items-center justify-between border-t border-slate-100 px-4">
          <p className="text-sm" aria-live="polite">
            <span className="font-semibold">
              {results.length} {results.length === 1 ? 'propiedad' : 'propiedades'}
            </span>
            <span className="text-slate-500"> · recientes primero</span>
          </p>
          {hasFilters && (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="-mr-2 min-h-10 shrink-0 px-2 text-sm font-medium whitespace-nowrap text-brand-700 underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <main className="space-y-4 p-4 pb-28">
        {results.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}

        {results.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
            <SearchX size={40} className="text-slate-400" aria-hidden />
            <p className="text-base font-semibold">No hay resultados.</p>
            {suggestion ? (
              <>
                <p className="text-sm text-slate-600">
                  Prueba quitando <span className="font-semibold text-slate-900">{suggestion.label}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(removeFilter(filters, suggestion.key))}
                  className="min-h-11 rounded-xl bg-brand-600 px-4 font-semibold text-white active:bg-brand-700"
                >
                  Quitar {suggestion.label} ({suggestion.count})
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="min-h-11 rounded-xl px-4 font-medium text-brand-700 underline">
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-end p-4">
        <Link
          to="/publicar"
          className="pointer-events-auto inline-flex min-h-14 items-center gap-2 rounded-full bg-brand-600 px-5 text-base font-semibold text-white shadow-lg active:bg-brand-700"
        >
          <Plus size={22} aria-hidden /> Publicar
        </Link>
      </div>
    </div>
  )
}
