import { AlertCircle, Bath, BedDouble, Car, Check, FileCheck, Landmark, Package, PawPrint, Sparkles, Zap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Chip } from '../../components/Chip'
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder'
import { relevantFields, type Draft, type DraftField } from '../../domain/draft'
import { currencyFor, OPERATION_LABELS, PHOTO_IDS, TYPE_LABELS, ZONES, type Operation, type PropertyType, type Zone } from '../../domain/listing'

const BOOL_ICONS: Partial<Record<DraftField, ReactNode>> = {
  garage: <Car size={16} aria-hidden />,
  pets: <PawPrint size={16} aria-hidden />,
  storage: <Package size={16} aria-hidden />,
  bankCredit: <Landmark size={16} aria-hidden />,
  docsOk: <FileCheck size={16} aria-hidden />,
  utilities: <Zap size={16} aria-hidden />,
}
const BOOL_FIELDS = ['garage', 'pets', 'storage', 'bankCredit', 'docsOk', 'utilities'] as const
const SHORT_LABELS: Record<(typeof BOOL_FIELDS)[number], string> = {
  garage: 'Garaje',
  pets: 'Mascotas',
  storage: 'Baulera',
  bankCredit: 'Crédito bancario',
  docsOk: 'Papeles al día',
  utilities: 'Servicios completos',
}

interface Props {
  draft: Draft
  setDraft: (d: Draft) => void
  detected: string[]
  showErrors: boolean
}

export function ReviewStep({ draft: d, setDraft, detected, showErrors }: Props) {
  const relevant = relevantFields(d)
  const has = (f: DraftField) => relevant.includes(f)
  const detectedCount = relevant.filter((f) => detected.includes(f)).length
  const missingCount = relevant.filter((f) => d[f] == null).length
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...d, [key]: value })
  const status = (f: DraftField) => ({ detected: detected.includes(f), missing: d[f] == null, error: showErrors && d[f] == null && ['operation', 'type', 'zone', 'price'].includes(f) })

  const [otherCommission, setOtherCommission] = useState(d.commissionShare != null && ![30, 40, 50].includes(d.commissionShare))

  return (
    <div className="space-y-1 p-4 pb-28">
      {detected.length > 0 ? (
        <p className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-slate-800" aria-live="polite">
          <Sparkles size={18} className="shrink-0 text-brand-600" aria-hidden />
          <span>
            Detectamos <b>{detectedCount} de {relevant.length}</b> datos.{' '}
            {missingCount > 0 ? `Faltan ${missingCount}: agrégalos para que te consulten menos.` : '¡Ficha completa!'}
          </span>
        </p>
      ) : (
        <p className="mb-2 text-sm text-slate-600">Completa los datos con un toque. Los marcados con * son obligatorios.</p>
      )}

      <Field label="Operación *" {...status('operation')}>
        <Choice options={OPERATION_LABELS} value={d.operation} onChange={(v: Operation) => setDraft({ ...d, operation: v })} />
      </Field>

      <Field label="Tipo *" {...status('type')}>
        <Choice options={TYPE_LABELS} value={d.type} onChange={(v: PropertyType) => set('type', v)} />
      </Field>

      <Field label="Zona *" {...status('zone')}>
        <select
          value={d.zone ?? ''}
          onChange={(e) => set('zone', (e.target.value || null) as Zone | null)}
          aria-label="Zona"
          className="min-h-12 w-full rounded-xl bg-white px-3 text-base ring-1 ring-slate-300"
        >
          <option value="">Elige la zona…</option>
          {ZONES.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </Field>

      <Field label="Precio *" {...status('price')}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{d.operation ? (currencyFor(d.operation) === 'USD' ? '$us' : 'Bs') : '—'}</span>
          <NumberInput value={d.price} onChange={(v) => set('price', v)} label="Precio" placeholder={d.operation === 'alquiler' ? '3800' : '95000'} />
          {d.operation === 'alquiler' && <span className="text-sm text-slate-500">/ mes</span>}
        </div>
        {!d.operation && <p className="mt-1 text-xs text-slate-500">La moneda depende de la operación: Bs para alquiler, $us para venta y anticrético.</p>}
      </Field>

      {has('bedrooms') && (
        <Field label="Dormitorios" icon={<BedDouble size={16} aria-hidden />} {...status('bedrooms')}>
          <Choice options={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5+' }} value={d.bedrooms} onChange={(v) => set('bedrooms', Number(v))} />
        </Field>
      )}

      {has('bathrooms') && (
        <Field label="Baños" icon={<Bath size={16} aria-hidden />} {...status('bathrooms')}>
          <Choice options={{ 1: '1', 2: '2', 3: '3', 4: '4+' }} value={d.bathrooms} onChange={(v) => set('bathrooms', Number(v))} />
        </Field>
      )}

      {(has('builtM2') || has('landM2')) && (
        <div className="grid grid-cols-2 gap-3">
          {has('builtM2') && (
            <Field label="m² construidos" {...status('builtM2')}>
              <NumberInput value={d.builtM2} onChange={(v) => set('builtM2', v)} label="m² construidos" placeholder="85" />
            </Field>
          )}
          {has('landM2') && (
            <Field label="m² de terreno" {...status('landM2')}>
              <NumberInput value={d.landM2} onChange={(v) => set('landM2', v)} label="m² de terreno" placeholder="300" />
            </Field>
          )}
        </div>
      )}

      <Field label="Características" hint="Toca para marcar lo que tiene. Si algo no tiene, déjalo sin marcar.">
        <div className="flex flex-wrap gap-2">
          {BOOL_FIELDS.filter(has).map((f) => (
            <Chip
              key={f}
              active={d[f] === true}
              onClick={() => set(f, d[f] === true ? false : true)}
              dashed={d[f] == null}
            >
              {d[f] === true ? <Check size={16} aria-hidden /> : BOOL_ICONS[f]}
              {SHORT_LABELS[f]}
              {detected.includes(f) && <span className="sr-only">(detectado)</span>}
            </Chip>
          ))}
        </div>
      </Field>

      {has('rentGuarantee') && (
        <Field label="Garantía" {...status('rentGuarantee')}>
          <Choice options={{ '1 mes': '1 mes', '2 meses': '2 meses', '3 meses': '3 meses' }} value={d.rentGuarantee} onChange={(v) => set('rentGuarantee', v)} />
        </Field>
      )}

      <Field label="Comisión que compartes" {...status('commissionShare')}>
        <div className="flex flex-wrap gap-2">
          {[30, 40, 50].map((p) => (
            <Chip
              key={p}
              active={!otherCommission && d.commissionShare === p}
              onClick={() => {
                setOtherCommission(false)
                set('commissionShare', p)
              }}
            >
              {p}%
            </Chip>
          ))}
          <Chip active={otherCommission} onClick={() => setOtherCommission(true)}>
            Otro
          </Chip>
        </div>
        {otherCommission && (
          <div className="mt-2 flex items-center gap-2">
            <NumberInput value={d.commissionShare} onChange={(v) => set('commissionShare', v == null ? null : Math.min(100, v))} label="Porcentaje de comisión" placeholder="25" />
            <span>%</span>
          </div>
        )}
        <label className="mt-3 flex min-h-11 items-center gap-3 text-base">
          <input type="checkbox" checked={d.ownerAuthorized} onChange={(e) => set('ownerAuthorized', e.target.checked)} className="size-5 accent-brand-600" />
          Tengo autorización del propietario
        </label>
      </Field>

      <Field label={`Fotos (${d.photos.length} de 5)`} hint="En el prototipo eliges entre fotos de ejemplo.">
        <div className="grid grid-cols-3 gap-2">
          {PHOTO_IDS.map((p) => {
            const on = d.photos.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => set('photos', on ? d.photos.filter((x) => x !== p) : d.photos.length < 5 ? [...d.photos, p] : d.photos)}
                className={`relative overflow-hidden rounded-xl ${on ? 'ring-3 ring-brand-600' : 'opacity-60 ring-1 ring-slate-200'}`}
              >
                <PhotoPlaceholder photo={p} iconSize={28} className="h-20 w-full" />
                {on && (
                  <span className="absolute top-1 right-1 rounded-full bg-brand-600 p-0.5 text-white">
                    <Check size={14} aria-hidden />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Descripción">
        <textarea
          value={d.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          aria-label="Descripción"
          className="w-full rounded-xl p-3 text-base ring-1 ring-slate-300"
        />
      </Field>
    </div>
  )
}

function Field({ label, icon, hint, detected, missing, error, children }: { label: string; icon?: ReactNode; hint?: string; detected?: boolean; missing?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <section className={`border-b border-slate-100 py-3 ${missing ? '-mx-2 rounded-lg bg-amber-50/60 px-2' : ''} ${error ? 'ring-2 ring-red-400' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </h3>
        {detected && !missing && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Check size={14} aria-hidden /> detectado
          </span>
        )}
        {missing && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${error ? 'text-red-700' : 'text-amber-800'}`}>
            <AlertCircle size={14} aria-hidden /> {error ? 'Obligatorio' : 'Falta'}
          </span>
        )}
      </div>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      {children}
    </section>
  )
}

function Choice<T extends string | number>({ options, value, onChange }: { options: Record<T, string>; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(options) as [string, string][]).map(([k, label]) => {
        const v = (typeof value === 'number' || /^\d+$/.test(k) ? Number(k) : k) as T
        return (
          <Chip key={k} active={value != null && String(value) === k} onClick={() => onChange(v)}>
            {label}
          </Chip>
        )
      })}
    </div>
  )
}

function NumberInput({ value, onChange, label, placeholder }: { value: number | null; onChange: (v: number | null) => void; label: string; placeholder?: string }) {
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      placeholder={placeholder}
      value={value == null ? '' : String(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits ? Number(digits) : null)
      }}
      className="min-h-12 w-full max-w-40 rounded-xl px-3 text-base ring-1 ring-slate-300"
    />
  )
}

