import { ArrowLeft, CalendarCheck, FileText, Handshake, House, MessageCircle, Share2, ShieldCheck, Tag, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BottomSheet } from '../components/BottomSheet'
import { FreshnessBadge } from '../components/FreshnessBadge'
import { Gallery } from '../components/Gallery'
import { ShareSheet } from '../components/ShareSheet'
import { DEMO_MODE } from '../config'
import { groupThousands, listingPrice, timeInNetwork } from '../domain/format'
import { fieldLevel, notApplicableOf } from '../domain/fields'
import { CLOSED_LABELS, OPERATION_LABELS, TYPE_LABELS, type DetailField, type Listing } from '../domain/listing'
import { contactMessage, contactUrl } from '../domain/whatsapp'
import { useStore } from '../store/context'
import { logEvent } from '../store/events'

export function Detail() {
  const { id } = useParams()
  const { state } = useStore()
  const navigate = useNavigate()
  const listing = state.listings.find((l) => l.id === id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // listing_viewed only once per listing (StrictMode runs effects twice in development).
  const viewed = useRef<string | null>(null)
  useEffect(() => {
    if (!listing || viewed.current === listing.id) return
    viewed.current = listing.id
    logEvent('listing_viewed', { listingId: listing.id })
  }, [listing])

  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))

  if (!listing) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Esta propiedad ya no está disponible.</p>
        <Link to="/" className="font-medium text-brand-700 underline">
          Ver otras propiedades
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-slate-200 bg-white px-2 py-1">
        <button type="button" onClick={goBack} className="flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Volver">
          <ArrowLeft size={24} />
        </button>
        <h1 className="truncate text-base font-semibold">
          {TYPE_LABELS[listing.type]} · {listing.zone}
        </h1>
      </header>

      <Gallery photos={listing.photos} />
      <ListingSheet listing={listing} />
      {/* A closed listing can no longer be asked about or shared. */}
      {listing.status === 'active' && <ContactBar listing={listing} />}
    </div>
  )
}

/** Standard listing detail: same blocks, in the same order, for every property. */
function ListingSheet({ listing: l }: { listing: Listing }) {
  const isRent = l.operation === 'alquiler'
  const notApplicable = notApplicableOf(l)
  // Fields that never apply to the type and operation are left out (PRD v3 D1).
  const fact = (f: DetailField, label: string, value: FactValue): FactRow[] =>
    fieldLevel(f, l) ? [[label, notApplicable.includes(f) ? NOT_APPLICABLE : value]] : []
  return (
    <div className="divide-y divide-slate-100">
      <Block icon={<Tag size={18} />} title="Precio y operación">
        <p className="text-3xl font-bold tracking-tight">{listingPrice(l)}</p>
        {isRent && l.rentExpenses != null && (
          <p className="text-sm text-slate-600">{l.rentExpenses === 0 ? 'Expensas incluidas' : `+ Bs ${groupThousands(l.rentExpenses)} de expensas al mes`}</p>
        )}
        <p className="text-slate-700">
          {OPERATION_LABELS[l.operation]} · {TYPE_LABELS[l.type]} · {l.zone}
        </p>
      </Block>

      <Block icon={<CalendarCheck size={18} />} title="Disponibilidad">
        {l.status === 'closed' ? (
          <>
            <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-sm font-medium text-slate-700">Ya no está disponible · {CLOSED_LABELS[l.operation]}</span>
            <p className="mt-1 text-sm text-slate-600">Ya no aparece en el listado.</p>
            {l.isMine && (
              <p className="mt-1 text-sm text-slate-600">
                Puedes volver a publicarla desde{' '}
                <Link to="/mis-propiedades?ver=cerradas" className="font-medium text-brand-700 underline">
                  Mis propiedades → Cerradas
                </Link>
                .
              </p>
            )}
          </>
        ) : (
          <>
            <FreshnessBadge lastConfirmedAt={l.lastConfirmedAt} />
            <p className="mt-1 text-sm text-slate-600">
              Última confirmación: {new Date(l.lastConfirmedAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </>
        )}
      </Block>

      <Block icon={<Handshake size={18} />} title="Colaboración">
        {l.commissionShare != null ? (
          <p className="text-lg">
            Comparte <span className="font-bold">{l.commissionShare}%</span> de la comisión
          </p>
        ) : (
          <p className="text-slate-500 italic">Comisión compartida: sin dato (consúltalo al asesor)</p>
        )}
        {l.ownerAuthorized && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <ShieldCheck size={16} aria-hidden /> Autorizado por el propietario
          </span>
        )}
      </Block>

      <Block icon={<House size={18} />} title="Características">
        <Facts
          rows={[
            ...fact('bedrooms', 'Dormitorios', l.bedrooms),
            ...fact('bathrooms', 'Baños', l.bathrooms),
            ...fact('builtM2', 'm² construidos', l.builtM2),
            ...fact('landM2', 'm² de terreno', l.landM2),
            ...fact('garage', 'Garaje', l.garage),
            ...fact('pets', 'Acepta mascotas', l.pets),
            ...fact('storage', 'Baulera', l.storage),
            ...fact('utilities', 'Servicios básicos completos', l.utilities),
          ]}
        />
      </Block>

      <Block icon={<FileText size={18} />} title="Condiciones">
        <Facts
          rows={[
            ...fact('bankCredit', 'Acepta crédito bancario', l.bankCredit),
            ...fact('docsOk', 'Documentación al día', l.docsOk),
            ...fact('rentGuarantee', 'Garantía', l.rentGuarantee),
            ...fact('rentExpenses', 'Expensas', l.rentExpenses == null ? null : l.rentExpenses === 0 ? 'Incluidas' : `Bs ${groupThousands(l.rentExpenses)} / mes`),
          ]}
        />
      </Block>

      <Block icon={<UserRound size={18} />} title="Asesor">
        <p className="font-semibold">{l.agent.name}</p>
        <p className="text-sm text-slate-600">En la red desde {timeInNetwork(l.agent.memberSince)}</p>
      </Block>

      {l.description && (
        <Block icon={<MessageCircle size={18} />} title="Descripción">
          <p className="text-slate-800">{l.description}</p>
        </Block>
      )}
    </div>
  )
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="px-4 py-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

type FactValue = string | number | boolean | null | undefined
/** The agent said the field doesn't apply: different from "Sin dato" (no data). */
const NOT_APPLICABLE = Symbol('No aplica')
type FactRow = readonly [string, FactValue | typeof NOT_APPLICABLE]

function Facts({ rows }: { rows: ReadonlyArray<FactRow> }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-slate-700">{label}</dt>
          <dd className="text-right">
            {value === NOT_APPLICABLE ? (
              <span className="rounded-md px-1.5 text-sm text-slate-600 ring-1 ring-slate-300">No aplica</span>
            ) : value == null ? (
              <span className="text-slate-500 italic">Sin dato</span>
            ) : typeof value === 'boolean' ? (
              <span className={`font-semibold ${value ? 'text-slate-900' : 'text-slate-500'}`}>{value ? 'Sí' : 'No'}</span>
            ) : (
              <span className="font-semibold">{value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ContactBar({ listing }: { listing: Listing }) {
  const [demoOpen, setDemoOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const url = contactUrl(listing)

  const openWhatsApp = () => window.open(url, '_blank', 'noopener')

  const onContact = () => {
    logEvent('contact_click', { listingId: listing.id, demo: DEMO_MODE })
    if (DEMO_MODE) setDemoOpen(true)
    else openWhatsApp()
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={onContact}
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-whatsapp px-2 text-[15px] font-semibold whitespace-nowrap text-white active:brightness-95"
        >
          <MessageCircle size={18} aria-hidden /> Consultar por WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-[15px] font-semibold text-slate-800 ring-1 ring-slate-300 active:bg-slate-100"
        >
          <Share2 size={18} aria-hidden /> Compartir
        </button>
      </div>
      <ShareSheet listing={shareOpen ? listing : null} source="detail" onClose={() => setShareOpen(false)} />

      <BottomSheet
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Prototipo"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setDemoOpen(false)} className="min-h-12 flex-1 rounded-xl font-medium text-slate-700 ring-1 ring-slate-300">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoOpen(false)
                openWhatsApp()
              }}
              className="min-h-12 flex-1 rounded-xl bg-whatsapp font-semibold text-white"
            >
              Continuar
            </button>
          </div>
        }
      >
        <p className="text-slate-700">
          Esto abriría WhatsApp con <span className="font-semibold">{listing.agent.name}</span> y este mensaje:
        </p>
        <blockquote className="mt-3 rounded-xl bg-emerald-50 p-3 text-slate-800 ring-1 ring-emerald-200">{contactMessage(listing)}</blockquote>
        <p className="mt-2 text-xs text-slate-500">Los números de los asesores de ejemplo son ficticios.</p>
      </BottomSheet>
    </>
  )
}

