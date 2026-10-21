import { AlertCircle, Ban, Bath, BedDouble, Car, Check, FileCheck, Landmark, ListPlus, MapPin, Package, PawPrint, Pencil, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Chip } from '../../components/Chip'
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder'
import {
  addBack,
  askedFields,
  draftCurrency,
  draftSummary,
  FIELD_LABELS,
  fieldsIn,
  growPending,
  keepFilledFields,
  markNotApplicable,
  REQUIRED_FIELDS,
  sectionOf,
  type Draft,
  type DraftField,
} from '../../domain/draft'
import { fieldLevel } from '../../domain/fields'
import { OPERATION_LABELS, PHOTO_IDS, TYPE_LABELS, ZONES, type DetailField, type Operation, type PropertyType, type Zone } from '../../domain/listing'
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
const isBool = (f: DraftField): f is (typeof BOOL_FIELDS)[number] => (BOOL_FIELDS as readonly string[]).includes(f)
const isDetail = (f: DraftField): f is DetailField => !REQUIRED_FIELDS.includes(f)

interface Props {
  draft: Draft
  setDraft: (d: Draft) => void
  detected: string[]
  /** Fields inferred with less certainty (the zone, from the avenue). */
  suggested: string[]
  /** Text that produced the suggested zone, e.g. "Av. Heroinas". */
  zoneHint?: string
  /** Fields shown in "Te falta" (missing): see `pendingAtStart` and `growPending`. */
  pending: DraftField[]
  setPending: (update: (p: DraftField[]) => DraftField[]) => void
  showErrors: boolean
}

/**
 * Publish step 2, Review (C2 in PRD v2, D1 in PRD v3): what is missing comes first.
 * 1) Summary of what was detected, with "Editar" to expand it; 2) "Te falta"; 3) "Más datos (opcional)";
 * 4) "No aplica", with "Agregar"; 5) authorization and photos.
 */
export function ReviewStep({ draft: d, setDraft, detected, suggested, zoneHint, pending, setPending, showErrors }: Props) {
  const asked = askedFields(d)
  // A field never moves between "Te falta" and the summary while the agent edits it: only newly asked fields are added.
  const update = (next: Draft) => {
    const kept = keepFilledFields(next)
    setPending((p) => growPending(p, d, kept))
    setDraft(kept)
  }
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => update({ ...d, [key]: value })
  const manual = detected.length === 0 && suggested.length === 0

  // "Te falta": fields missing on arrival plus those asked later (e.g., switching to rent adds Garantía).
  const missingNow = asked.filter((f) => pending.includes(f))
  const done = asked.filter((f) => !missingNow.includes(f))
  const missingNowSorted = [...missingNow.filter((f) => REQUIRED_FIELDS.includes(f)), ...missingNow.filter((f) => !REQUIRED_FIELDS.includes(f))]
  const detectedCount = asked.filter((f) => detected.includes(f)).length
  const stillEmpty = asked.filter((f) => d[f] == null).length
  const optional = fieldsIn(d, 'optional')
  const notApplicable = fieldsIn(d, 'notApplicable').filter(isDetail)

  const [editingState, setEditing] = useState(false)
  // If the agent cleared a required field inside "Editar" and tries to publish, open it so the error is visible.
  const editing = editingState || (showErrors && done.some((f) => REQUIRED_FIELDS.includes(f) && d[f] == null))
  const toggleEdit = () => {
    if (!editing) logEvent('publish_review_expanded', { detectedCount })
    setEditing(!editing)
  }

  const [showOptional, setShowOptional] = useState(false)
  const [showNotApplicable, setShowNotApplicable] = useState(false)
  const markNA = (f: DetailField) => {
    logEvent('field_marked_na', { field: f, level: fieldLevel(f, d) })
    update(markNotApplicable(d, f))
  }
  const addFieldBack = (f: DetailField) => {
    logEvent('field_added_back', { field: f })
    const next = addBack(d, f)
    // Open "Más datos" so the agent sees where the field went.
    if (sectionOf(f, next) === 'optional') setShowOptional(true)
    update(next)
  }

  const [otherCommission, setOtherCommission] = useState(d.commissionShare != null && ![30, 40, 50].includes(d.commissionShare))

  // Optional fields are never marked as missing. Required ones can't be marked "No aplica".
  const statusOf = (f: DraftField, optional: boolean) => ({
    detected: detected.includes(f),
    suggested: suggested.includes(f) && d[f] != null,
    missing: d[f] == null && !optional,
    error: showErrors && d[f] == null && REQUIRED_FIELDS.includes(f),
    onNotApplicable: isDetail(f) ? () => markNA(f) : undefined,
  })

  /** Renders the given fields in listing order. */
  const renderFields = (fields: DraftField[], optional = false) => fields.map((f) => <Fragment key={f}>{fieldFor(f, optional)}</Fragment>)

  // A function (not a component): this way inputs do not remount and keep focus while typing.
  function fieldFor(f: DraftField, optional: boolean): ReactNode {
    const status = (field: DraftField) => statusOf(field, optional)
    if (isBool(f)) {
      return (
        <Field label={FIELD_LABELS[f]} icon={BOOL_ICONS[f]} {...status(f)}>
          <Choice options={{ si: 'Sí', no: 'No' }} value={d[f] == null ? null : d[f] ? 'si' : 'no'} onChange={(v) => set(f, v === 'si')} />
        </Field>
      )
    }
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1" role="group" aria-label="Moneda">
                {(['BOB', 'USD'] as const).map((c) => (
                  <Chip key={c} active={draftCurrency(d) === c} onClick={() => set('currency', c)} className="min-w-14 px-3">
                    {c === 'USD' ? '$us' : 'Bs'}
                  </Chip>
                ))}
              </div>
              <NumberInput value={d.price} onChange={(v) => set('price', v)} label="Precio" placeholder={d.operation === 'alquiler' ? '3800' : '95000'} />
              {d.operation === 'alquiler' && <span className="text-sm text-slate-500">/ mes</span>}
            </div>
            {!draftCurrency(d) && <p className="mt-1 text-xs text-slate-500">Si el mensaje no dice la moneda, se usa Bs para alquiler y $us para venta y anticrético.</p>}
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
        // 1. Summary of what was detected, inviting a review (D3 in PRD v3)
        <section className="mb-3 rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-slate-800">
            <Sparkles size={18} className="shrink-0 text-brand-600" aria-hidden />
            <span>
              Revisa lo que detectamos{' '}
              <b>
                ({detectedCount} de {asked.length})
              </b>
            </span>
          </p>
          {done.length > 0 && (
            <>
              <p className="mt-1 text-base font-medium text-slate-900">{draftSummary(d, done)}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-slate-600">
                  Si algo no está bien, toca <b>Editar</b>.
                </p>
                <button
                  type="button"
                  onClick={toggleEdit}
                  aria-expanded={editing}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-600 active:bg-brand-50"
                >
                  {editing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                  {editing ? 'Listo' : 'Editar'}
                </button>
              </div>
            </>
          )}
          {editing && <div className="mt-2 rounded-lg bg-white px-3">{renderFields(done)}{description}</div>}
        </section>
      )}

      {/* 2. "Te falta" (missing) */}
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

      {/* 3. "Más datos (opcional)": never counted as missing */}
      {optional.length > 0 && (
        <Fold icon={<ListPlus size={20} aria-hidden />} title={`Más datos (opcional) · ${optional.length}`} open={showOptional} onToggle={() => setShowOptional(!showOptional)}>
          <p className="text-sm text-slate-600">No hace falta llenarlos para publicar.</p>
          {renderFields(optional, true)}
        </Fold>
      )}

      {/* 4. "No aplica": fields that don't apply to this listing, with "Agregar" */}
      {notApplicable.length > 0 && (
        <Fold icon={<Ban size={20} aria-hidden />} title={`No aplica · ${notApplicable.length}`} open={showNotApplicable} onToggle={() => setShowNotApplicable(!showNotApplicable)}>
          <p className="text-sm text-slate-600">No se piden para esta propiedad. Si la tuya sí lo tiene, agrégalo.</p>
          <ul>
            {notApplicable.map((f) => (
              <li key={f} className="flex min-h-12 items-center justify-between gap-2 border-b border-slate-100 py-1 text-slate-600">
                <span className="flex items-center gap-1.5">
                  {BOOL_ICONS[f]}
                  {FIELD_LABELS[f]}
                </span>
                <Chip onClick={() => addFieldBack(f)}>Agregar</Chip>
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {/* 5. Always visible */}
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

function Fold({ icon, title, open, onToggle, children }: { icon: ReactNode; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="mt-3 border-t border-slate-200">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-2 py-2 text-left">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-slate-600">{icon}</span>
          {title}
        </span>
        <span className="text-sm font-semibold text-brand-700 underline">{open ? 'Ocultar' : 'Ver'}</span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </section>
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
  onNotApplicable,
  children,
}: {
  label: string
  icon?: ReactNode
  hint?: string
  detected?: boolean
  suggested?: boolean
  missing?: boolean
  error?: boolean
  /** Shows the "No aplica" button (recommended and optional fields only). */
  onNotApplicable?: () => void
  children: ReactNode
}) {
  return (
    <section className={`border-b border-slate-100 py-3 ${missing || suggested ? '-mx-2 rounded-lg bg-amber-50/60 px-2' : ''} ${error ? 'ring-2 ring-red-400' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {suggested ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
              <MapPin size={14} aria-hidden /> Sugerida
            </span>
          ) : detected && !missing ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Check size={14} aria-hidden /> detectado
            </span>
          ) : null}
          {/* Fields with "No aplica" are already marked as missing by the section and the background. */}
          {missing && !onNotApplicable && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${error ? 'text-red-700' : 'text-amber-800'}`}>
              <AlertCircle size={14} aria-hidden /> {error ? 'Obligatorio' : 'Falta'}
            </span>
          )}
          {onNotApplicable && (
            <button
              type="button"
              onClick={onNotApplicable}
              aria-label={`${label}: no aplica`}
              className="min-h-9 rounded-lg border border-dashed border-slate-400 bg-white px-2.5 text-xs font-medium text-slate-600 active:bg-slate-100"
            >
              No aplica
            </button>
          )}
        </div>
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
