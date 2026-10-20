import { AlertCircle, Bath, BedDouble, Car, Check, FileCheck, Landmark, MapPin, Package, PawPrint, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Chip } from '../../components/Chip'
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder'
import { draftSummary, relevantFields, REQUIRED_FIELDS, type Draft, type DraftField } from '../../domain/draft'
import { currencyFor, OPERATION_LABELS, PHOTO_IDS, TYPE_LABELS, ZONES, type Operation, type PropertyType, type Zone } from '../../domain/listing'
import { logEvent } from '../../store/events'

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
const isBool = (f: DraftField): f is (typeof BOOL_FIELDS)[number] => (BOOL_FIELDS as readonly string[]).includes(f)

interface Props {
  draft: Draft
  setDraft: (d: Draft) => void
  detected: string[]
  /** Campos inferidos con menos certeza (la zona por avenida). */
  suggested: string[]
  /** Texto que originó la zona sugerida, ej. "Av. Heroinas". */
  zoneHint?: string
  /** "Te falta" al llegar al paso (ver `pendingAtStart`). */
  pending: DraftField[]
  showErrors: boolean
}

/**
 * Paso 2 de Publicar (C2 del PRD v2): primero lo que falta.
 * 1) Resumen de lo detectado, con "Editar" para desplegarlo; 2) "Te falta"; 3) autorización y fotos.
 */
export function ReviewStep({ draft: d, setDraft, detected, suggested, zoneHint, pending, showErrors }: Props) {
  const relevant = relevantFields(d)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...d, [key]: value })
  const manual = detected.length === 0 && suggested.length === 0

  // Un campo queda en "Te falta" si faltaba al llegar o si falta ahora (p. ej., al cambiar a alquiler aparece Garantía).
  const missingNow = relevant.filter((f) => pending.includes(f) || d[f] == null)
  const done = relevant.filter((f) => !missingNow.includes(f))
  const missingNowSorted = [...missingNow.filter((f) => REQUIRED_FIELDS.includes(f)), ...missingNow.filter((f) => !REQUIRED_FIELDS.includes(f))]
  const detectedCount = relevant.filter((f) => detected.includes(f)).length
  const stillEmpty = relevant.filter((f) => d[f] == null).length

  const [editing, setEditing] = useState(false)
  const toggleEdit = () => {
    if (!editing) logEvent('publish_review_expanded', { detectedCount })
    setEditing(!editing)
  }

  const [otherCommission, setOtherCommission] = useState(d.commissionShare != null && ![30, 40, 50].includes(d.commissionShare))

  const status = (f: DraftField) => ({
    detected: detected.includes(f),
    suggested: suggested.includes(f) && d[f] != null,
    missing: d[f] == null,
    error: showErrors && d[f] == null && REQUIRED_FIELDS.includes(f),
  })

  /** Renderiza los campos dados en el orden de la ficha; los booleanos van juntos en "Características". */
  const renderFields = (fields: DraftField[]) => {
    const bools = fields.filter(isBool)
    const out: ReactNode[] = []
    for (const f of fields) {
      if (isBool(f)) {
        if (f !== bools[0]) continue
        out.push(
          <Field key="bools" label="Características" hint="Toca para marcar lo que tiene. Si algo no tiene, déjalo sin marcar." missing={bools.some((b) => d[b] == null)}>
            <div className="flex flex-wrap gap-2">
              {bools.map((b) => (
                <Chip key={b} active={d[b] === true} onClick={() => set(b, d[b] === true ? false : true)} dashed={d[b] == null}>
                  {d[b] === true ? <Check size={16} aria-hidden /> : BOOL_ICONS[b]}
                  {SHORT_LABELS[b]}
                  {detected.includes(b) && <span className="sr-only">(detectado)</span>}
                </Chip>
              ))}
            </div>
          </Field>,
        )
        continue
      }
      out.push(<Fragment key={f}>{fieldFor(f)}</Fragment>)
    }
    return out
  }

  // Función (no componente): así los inputs no se vuelven a montar y no pierden el foco al escribir.
  function fieldFor(f: DraftField): ReactNode {
    switch (f) {
      case 'operation':
        return (
          <Field label="Operación *" {...status('operation')}>
            <Choice options={OPERATION_LABELS} value={d.operation} onChange={(v: Operation) => set('operation', v)} />
          </Field>
        )
      case 'type':
        return (
          <Field label="Tipo *" {...status('type')}>
            <Choice options={TYPE_LABELS} value={d.type} onChange={(v: PropertyType) => set('type', v)} />
          </Field>
        )
      case 'zone':
        return (
          <Field label="Zona *" icon={<MapPin size={16} aria-hidden />} {...status('zone')}>
            {suggested.includes('zone') && zoneHint && (
              <p className="mb-2 text-xs text-slate-600">
                Sugerida por “{zoneHint}”: revísala, una avenida puede cruzar varias zonas.
              </p>
            )}
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
        )
      case 'price':
        return (
          <Field label="Precio *" {...status('price')}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{d.operation ? (currencyFor(d.operation) === 'USD' ? '$us' : 'Bs') : '—'}</span>
              <NumberInput value={d.price} onChange={(v) => set('price', v)} label="Precio" placeholder={d.operation === 'alquiler' ? '3800' : '95000'} />
              {d.operation === 'alquiler' && <span className="text-sm text-slate-500">/ mes</span>}
            </div>
            {!d.operation && <p className="mt-1 text-xs text-slate-500">La moneda depende de la operación: Bs para alquiler, $us para venta y anticrético.</p>}
          </Field>
        )
      case 'bedrooms':
        return (
          <Field label="Dormitorios" icon={<BedDouble size={16} aria-hidden />} {...status('bedrooms')}>
            <Choice options={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5+' }} value={d.bedrooms} onChange={(v) => set('bedrooms', Number(v))} />
          </Field>
        )
      case 'bathrooms':
        return (
          <Field label="Baños" icon={<Bath size={16} aria-hidden />} {...status('bathrooms')}>
            <Choice options={{ 1: '1', 2: '2', 3: '3', 4: '4+' }} value={d.bathrooms} onChange={(v) => set('bathrooms', Number(v))} />
          </Field>
        )
      case 'builtM2':
        return (
          <Field label="m² construidos" {...status('builtM2')}>
            <NumberInput value={d.builtM2} onChange={(v) => set('builtM2', v)} label="m² construidos" placeholder="85" />
          </Field>
        )
      case 'landM2':
        return (
          <Field label="m² de terreno" {...status('landM2')}>
            <NumberInput value={d.landM2} onChange={(v) => set('landM2', v)} label="m² de terreno" placeholder="300" />
          </Field>
        )
      case 'rentGuarantee':
        return (
          <Field label="Garantía" {...status('rentGuarantee')}>
            <Choice options={{ '1 mes': '1 mes', '2 meses': '2 meses', '3 meses': '3 meses' }} value={d.rentGuarantee} onChange={(v) => set('rentGuarantee', v)} />
          </Field>
        )
      case 'rentExpenses':
        return (
          <Field label="Expensas" {...status('rentExpenses')}>
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={d.rentExpenses === 0} onClick={() => set('rentExpenses', d.rentExpenses === 0 ? null : 0)}>
                Incluidas
              </Chip>
              <span className="text-sm text-slate-500">o</span>
              <span className="font-semibold text-slate-700">Bs</span>
              <NumberInput value={d.rentExpenses ? d.rentExpenses : null} onChange={(v) => set('rentExpenses', v)} label="Expensas por mes" placeholder="250" />
              <span className="text-sm text-slate-500">/ mes</span>
            </div>
          </Field>
        )
      case 'commissionShare':
        return (
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
          </Field>
        )
      default:
        return null
    }
  }

  const description = (
    <Field label="Descripción">
      <textarea
        value={d.description}
        onChange={(e) => set('description', e.target.value)}
        rows={4}
        aria-label="Descripción"
        className="w-full rounded-xl p-3 text-base ring-1 ring-slate-300"
      />
    </Field>
  )

  return (
    <div className="space-y-1 p-4 pb-28">
      {manual ? (
        <p className="mb-2 text-sm text-slate-600">Completa los datos con un toque. Los marcados con * son obligatorios.</p>
      ) : (
        // 1. Resumen de lo detectado
        <section className="mb-3 rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100" aria-live="polite">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-2 text-sm text-slate-800">
              <Sparkles size={18} className="shrink-0 text-brand-600" aria-hidden />
              <span>
                Detectamos <b>{detectedCount} de {relevant.length}</b> datos.
              </span>
            </p>
            {done.length > 0 && (
              <button type="button" onClick={toggleEdit} aria-expanded={editing} className="-my-2 min-h-11 px-1 text-sm font-semibold text-brand-700 underline">
                {editing ? 'Listo' : 'Editar'}
              </button>
            )}
          </div>
          {done.length > 0 && <p className="mt-1 text-base font-medium text-slate-900">{draftSummary(d, done)}</p>}
          {editing && <div className="mt-2 rounded-lg bg-white px-3">{renderFields(done)}{description}</div>}
        </section>
      )}

      {/* 2. Te falta */}
      {missingNowSorted.length > 0 ? (
        <>
          <h2 className="flex items-center gap-2 pt-1 text-lg font-semibold">
            <AlertCircle size={20} className="text-amber-700" aria-hidden />
            {manual ? 'Datos de la propiedad' : `Te falta${stillEmpty > 0 ? ` (${stillEmpty})` : ''}`}
          </h2>
          {!manual && <p className="text-sm text-slate-600">Agrégalos para que te consulten menos.</p>}
          {renderFields(missingNowSorted)}
        </>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          <Check size={18} aria-hidden /> ¡Ficha completa!
        </p>
      )}

      {/* 3. Siempre visibles */}
      <h2 className="flex items-center gap-2 pt-4 text-lg font-semibold">
        <ShieldCheck size={20} className="text-slate-600" aria-hidden /> Antes de publicar
      </h2>
      <label className="flex min-h-11 items-center gap-3 border-b border-slate-100 py-2 text-base">
        <input type="checkbox" checked={d.ownerAuthorized} onChange={(e) => set('ownerAuthorized', e.target.checked)} className="size-5 accent-brand-600" />
        Tengo autorización del propietario
      </label>
      <Field label={`Fotos (${d.photos.length} de 5)`} hint="En el prototipo eliges entre fotos de ejemplo.">
        <div className="grid grid-cols-6 gap-1.5">
          {PHOTO_IDS.map((p) => {
            const on = d.photos.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                aria-label={`Foto ${p}`}
                onClick={() => set('photos', on ? d.photos.filter((x) => x !== p) : d.photos.length < 5 ? [...d.photos, p] : d.photos)}
                className={`relative overflow-hidden rounded-lg ${on ? 'ring-3 ring-brand-600' : 'opacity-60 ring-1 ring-slate-200'}`}
              >
                <PhotoPlaceholder photo={p} iconSize={18} className="h-12 w-full" />
              </button>
            )
          })}
        </div>
      </Field>
      {manual && description}
    </div>
  )
}

function Field({
  label,
  icon,
  hint,
  detected,
  suggested,
  missing,
  error,
  children,
}: {
  label: string
  icon?: ReactNode
  hint?: string
  detected?: boolean
  suggested?: boolean
  missing?: boolean
  error?: boolean
  children: ReactNode
}) {
  return (
    <section className={`border-b border-slate-100 py-3 ${missing || suggested ? '-mx-2 rounded-lg bg-amber-50/60 px-2' : ''} ${error ? 'ring-2 ring-red-400' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </h3>
        {suggested ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
            <MapPin size={14} aria-hidden /> Sugerida
          </span>
        ) : detected && !missing ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Check size={14} aria-hidden /> detectado
          </span>
        ) : null}
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
