import { Car, ChevronDown, FileCheck, Landmark, MapPin, Package, PawPrint, SlidersHorizontal, Zap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { Chip } from '../../components/Chip'
import { SwitchRow } from '../../components/Switch'
import {
  BOOLEAN_FILTER_LABELS,
  BOOLEAN_FILTERS,
  filterLabel,
  PRICE_PRESETS,
  setOperation,
  type BedroomsFilter,
  type BooleanFilter,
  type Filters,
} from '../../domain/filters'
import { formatPrice } from '../../domain/format'
import { currencyFor, OPERATION_LABELS, TYPE_LABELS, ZONES, type Operation, type PropertyType } from '../../domain/listing'

type Sheet = 'operation' | 'type' | 'zones' | 'price' | 'bedrooms' | 'more' | null

const BOOLEAN_ICONS: Record<BooleanFilter, ReactNode> = {
  garage: <Car size={22} aria-hidden />,
  pets: <PawPrint size={22} aria-hidden />,
  storage: <Package size={22} aria-hidden />,
  bankCredit: <Landmark size={22} aria-hidden />,
  docsOk: <FileCheck size={22} aria-hidden />,
  utilities: <Zap size={22} aria-hidden />,
}

interface Props {
  filters: Filters
  setFilters: (f: Filters) => void
  /** Cuántos resultados daría el estado actual (para los botones "Ver N"). */
  resultCount: number
}

export function FilterBar({ filters: f, setFilters, resultCount }: Props) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const close = () => setSheet(null)
  const moreCount = BOOLEAN_FILTERS.filter((k) => f.required[k]).length
  const seeResults = (
    <button type="button" onClick={close} className="min-h-12 w-full rounded-xl bg-brand-600 text-base font-semibold text-white active:bg-brand-700">
      Ver {resultCount} {resultCount === 1 ? 'propiedad' : 'propiedades'}
    </button>
  )

  const pick = <T,>(current: T | null, value: T, apply: (v: T | null) => Filters) => {
    setFilters(apply(current === value ? null : value))
    close()
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        <BarChip active={!!f.operation} onClick={() => setSheet('operation')}>
          {filterLabel(f, 'operation')}
        </BarChip>
        <BarChip active={!!f.type} onClick={() => setSheet('type')}>
          {filterLabel(f, 'type')}
        </BarChip>
        <BarChip active={f.zones.length > 0} onClick={() => setSheet('zones')} icon={<MapPin size={16} aria-hidden />}>
          {filterLabel(f, 'zones')}
        </BarChip>
        <BarChip active={f.priceMin != null || f.priceMax != null} onClick={() => setSheet('price')}>
          {filterLabel(f, 'price')}
        </BarChip>
        <BarChip active={f.bedrooms != null} onClick={() => setSheet('bedrooms')}>
          {filterLabel(f, 'bedrooms')}
        </BarChip>
        <Chip active={moreCount > 0} onClick={() => setSheet('more')} aria-label={moreCount > 0 ? `Más filtros (${moreCount} activos)` : 'Más filtros'}>
          <SlidersHorizontal size={16} aria-hidden />
          Más filtros
          {moreCount > 0 && <span className="rounded-full bg-white px-1.5 text-xs text-slate-900">{moreCount}</span>}
        </Chip>
      </div>

      <BottomSheet open={sheet === 'operation'} onClose={close} title="Operación">
        <OptionList
          options={Object.entries(OPERATION_LABELS) as [Operation, string][]}
          selected={f.operation}
          onPick={(v) => pick(f.operation, v, (op) => setOperation(f, op))}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'type'} onClose={close} title="Tipo de propiedad">
        <OptionList
          options={Object.entries(TYPE_LABELS) as [PropertyType, string][]}
          selected={f.type}
          onPick={(v) => pick(f.type, v, (type) => ({ ...f, type }))}
        />
      </BottomSheet>

      <BottomSheet
        open={sheet === 'zones'}
        onClose={close}
        title="Zona"
        footer={
          <div className="flex gap-2">
            {f.zones.length > 0 && (
              <button type="button" onClick={() => setFilters({ ...f, zones: [] })} className="min-h-12 rounded-xl px-4 font-medium text-slate-700 ring-1 ring-slate-300">
                Quitar
              </button>
            )}
            {seeResults}
          </div>
        }
      >
        <p className="mb-3 text-sm text-slate-600">Puedes elegir varias.</p>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => {
            const on = f.zones.includes(z)
            return (
              <Chip key={z} active={on} onClick={() => setFilters({ ...f, zones: on ? f.zones.filter((x) => x !== z) : [...f.zones, z] })}>
                {z}
              </Chip>
            )
          })}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'price'} onClose={close} title="Precio">
        <PriceSheet filters={f} setFilters={setFilters} onDone={close} />
      </BottomSheet>

      <BottomSheet open={sheet === 'bedrooms'} onClose={close} title="Dormitorios">
        <div className="flex gap-2 pt-2">
          {([1, 2, 3, 4] as BedroomsFilter[]).map((n) => (
            <Chip key={n} active={f.bedrooms === n} className="flex-1 justify-center text-base" onClick={() => pick(f.bedrooms, n, (bedrooms) => ({ ...f, bedrooms }))}>
              {n === 4 ? '4+' : n}
            </Chip>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === 'more'}
        onClose={close}
        title="Más filtros"
        footer={
          <div className="flex gap-2">
            {moreCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({ ...f, required: { ...f.required, ...Object.fromEntries(BOOLEAN_FILTERS.map((k) => [k, false])) } })}
                className="min-h-12 rounded-xl px-4 font-medium text-slate-700 ring-1 ring-slate-300"
              >
                Limpiar
              </button>
            )}
            {seeResults}
          </div>
        }
      >
        <div className="divide-y divide-slate-100">
          {BOOLEAN_FILTERS.map((k) => (
            <SwitchRow
              key={k}
              checked={f.required[k]}
              onChange={(v) => setFilters({ ...f, required: { ...f.required, [k]: v } })}
              icon={<span className="text-slate-500">{BOOLEAN_ICONS[k]}</span>}
              label={BOOLEAN_FILTER_LABELS[k]}
            />
          ))}
        </div>
      </BottomSheet>
    </>
  )
}

function BarChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: ReactNode; children: ReactNode }) {
  return (
    <Chip active={active} onClick={onClick}>
      {icon}
      {children}
      <ChevronDown size={16} aria-hidden className="-mr-1 opacity-70" />
    </Chip>
  )
}

function OptionList<T extends string>({ options, selected, onPick }: { options: [T, string][]; selected: T | null; onPick: (v: T) => void }) {
  return (
    <ul className="divide-y divide-slate-100">
      {options.map(([value, label]) => (
        <li key={value}>
          <button
            type="button"
            onClick={() => onPick(value)}
            aria-pressed={selected === value}
            className={`flex min-h-12 w-full items-center justify-between text-left text-base ${selected === value ? 'font-semibold text-brand-700' : 'text-slate-800'}`}
          >
            {label}
            {selected === value && <span className="text-sm font-normal text-slate-500">Toca para quitar</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

function PriceSheet({ filters: f, setFilters, onDone }: { filters: Filters; setFilters: (f: Filters) => void; onDone: () => void }) {
  const [min, setMin] = useState(f.priceMin?.toString() ?? '')
  const [max, setMax] = useState(f.priceMax?.toString() ?? '')

  if (!f.operation) {
    return (
      <div className="space-y-3 pt-1">
        <p className="text-sm text-slate-600">Primero elige la operación (el alquiler va en Bs; venta y anticrético en $us).</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(OPERATION_LABELS) as [Operation, string][]).map(([op, label]) => (
            <Chip key={op} onClick={() => setFilters(setOperation(f, op))}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
    )
  }

  const currency = currencyFor(f.operation)
  const symbol = currency === 'USD' ? '$us' : 'Bs'
  const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(/\D/g, '')) || null)

  return (
    <div className="space-y-4 pt-1">
      <div>
        <p className="mb-2 text-sm text-slate-600">
          {OPERATION_LABELS[f.operation]} · precio máximo en {symbol}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS[f.operation].map((p) => (
            <Chip
              key={p}
              active={f.priceMax === p && f.priceMin == null}
              onClick={() => {
                setFilters({ ...f, priceMin: null, priceMax: p })
                onDone()
              }}
            >
              Hasta {formatPrice(p, currency)}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <label className="flex-1 text-sm text-slate-600">
          Mínimo ({symbol})
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Sin mínimo" className="mt-1 min-h-12 w-full rounded-xl px-3 text-base text-slate-900 ring-1 ring-slate-300" />
        </label>
        <label className="flex-1 text-sm text-slate-600">
          Máximo ({symbol})
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Sin máximo" className="mt-1 min-h-12 w-full rounded-xl px-3 text-base text-slate-900 ring-1 ring-slate-300" />
        </label>
      </div>
      <div className="flex gap-2">
        {(f.priceMin != null || f.priceMax != null) && (
          <button
            type="button"
            onClick={() => {
              setFilters({ ...f, priceMin: null, priceMax: null })
              onDone()
            }}
            className="min-h-12 rounded-xl px-4 font-medium text-slate-700 ring-1 ring-slate-300"
          >
            Quitar
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setFilters({ ...f, priceMin: toNum(min), priceMax: toNum(max) })
            onDone()
          }}
          className="min-h-12 flex-1 rounded-xl bg-brand-600 font-semibold text-white active:bg-brand-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

