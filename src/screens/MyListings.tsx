import { ArrowLeft, BellRing, Flag, Plus, RefreshCw, RotateCcw, Share2, Tag } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BottomSheet } from '../components/BottomSheet'
import { FreshnessBadge } from '../components/FreshnessBadge'
import { PhotoPlaceholder } from '../components/PhotoPlaceholder'
import { ShareSheet } from '../components/ShareSheet'
import { Toast, type ToastData } from '../components/Toast'
import { daysSince, needsConfirmation } from '../domain/freshness'
import { formatPrice, listingPrice, listingTitle } from '../domain/format'
import { CLOSED_LABELS, TYPE_LABELS, type Listing, type Operation } from '../domain/listing'
import { useStore } from '../store/context'
import { logEvent } from '../store/events'
import { myListings, pendingFirstOrder } from '../store/listingsReducer'

const CLOSE_LABEL: Record<Operation, { action: string; done: string; question: string; confirm: string }> = {
  venta: { action: 'Marcar vendida', done: CLOSED_LABELS.venta, question: '¿Marcar como vendida?', confirm: 'Sí, marcar vendida' },
  alquiler: { action: 'Marcar alquilada', done: CLOSED_LABELS.alquiler, question: '¿Marcar como alquilada?', confirm: 'Sí, marcar alquilada' },
  anticretico: { action: 'Marcar cerrada', done: CLOSED_LABELS.anticretico, question: '¿Marcar como cerrada?', confirm: 'Sí, marcar cerrada' },
}
const nowIso = () => new Date().toISOString()
let toastSeq = 0

export function MyListings() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // ?ver=cerradas opens the Cerradas tab (link from the sheet of an own closed listing).
  const [tab, setTab] = useState<'active' | 'closed'>(params.get('ver') === 'cerradas' ? 'closed' : 'active')
  const [priceFor, setPriceFor] = useState<Listing | null>(null)
  const [closeFor, setCloseFor] = useState<Listing | null>(null)
  const [shareFor, setShareFor] = useState<Listing | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const mine = myListings(state.listings)
  // C4: pending first. The order is computed on entry and does not change on confirm, so cards do not jump.
  const [order] = useState(() => pendingFirstOrder(state.listings))
  const rank = (l: Listing) => order.indexOf(l.id)
  const active = mine.filter((l) => l.status === 'active').sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt))
  const closed = mine.filter((l) => l.status === 'closed')
  const pending = active.filter((l) => needsConfirmation(l.lastConfirmedAt))
  const list = tab === 'active' ? active : closed

  const show = (message: string, action?: ToastData['action']) => setToast({ id: ++toastSeq, message, action })

  const confirm = (l: Listing) => {
    dispatch({ type: 'confirmAvailable', id: l.id, at: nowIso() })
    logEvent('confirm_available', { listingId: l.id, daysSinceConfirmed: daysSince(l.lastConfirmedAt), bulk: false })
    show('Listo: confirmada hoy.')
  }

  const confirmAll = () => {
    const previous = pending.map((l) => ({ id: l.id, lastConfirmedAt: l.lastConfirmedAt }))
    dispatch({ type: 'confirmMany', ids: pending.map((l) => l.id), at: nowIso() })
    logEvent('confirm_available', { bulk: true, count: pending.length, listingIds: pending.map((l) => l.id) })
    show(pending.length === 1 ? '1 propiedad confirmada hoy.' : `${pending.length} propiedades confirmadas hoy.`, {
      label: 'Deshacer',
      onClick: () => dispatch({ type: 'restoreConfirmed', previous }),
    })
  }

  // D2: closing asks for confirmation first; only confirmed closings are logged as mark_closed.
  const close = (l: Listing) => {
    setCloseFor(null)
    dispatch({ type: 'markClosed', id: l.id, at: nowIso() })
    logEvent('mark_closed', { listingId: l.id, operation: l.operation })
    show(`${CLOSE_LABEL[l.operation].done}: ya no aparece en el listado.`, {
      label: 'Deshacer',
      onClick: () => {
        dispatch({ type: 'reopen', id: l.id })
        // mark_closed was already logged: this tells a mis-tap undone from a final close.
        logEvent('close_undone', { listingId: l.id, operation: l.operation })
      },
    })
  }
  const cancelClose = () => {
    if (closeFor) logEvent('close_cancelled', { listingId: closeFor.id, operation: closeFor.operation })
    setCloseFor(null)
  }

  const republish = (l: Listing) => {
    dispatch({ type: 'republish', id: l.id, at: nowIso() })
    logEvent('listing_reopened', { listingId: l.id, daysClosed: l.closedAt ? daysSince(l.closedAt) : null })
    setTab('active')
    show('Publicada de nuevo · Confirmado hoy', {
      label: 'Deshacer',
      onClick: () => {
        dispatch({ type: 'restoreClosed', id: l.id, lastConfirmedAt: l.lastConfirmedAt, closedAt: l.closedAt })
        // listing_reopened was already logged: this tells an undone republish from a final one.
        logEvent('reopen_undone', { listingId: l.id })
      },
    })
  }

  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1 px-2 py-1">
          <button type="button" onClick={goBack} className="flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Volver">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">Mis propiedades</h1>
            {state.profile && <p className="text-xs text-slate-500">{state.profile.name}</p>}
          </div>
          <Link to="/publicar" className="flex size-11 items-center justify-center rounded-full text-brand-700 active:bg-slate-100" aria-label="Publicar propiedad">
            <Plus size={24} />
          </Link>
        </div>
        <div className="flex px-4" role="tablist">
          {(
            [
              ['active', `Activas (${active.length})`],
              ['closed', `Cerradas (${closed.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-11 flex-1 border-b-2 text-sm font-medium ${tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'active' && pending.length > 0 && (
        <div className="m-4 mb-0 flex gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200" role="status">
          <BellRing size={22} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold text-amber-950">{pendingTitle(pending)}</p>
            <p className="text-sm text-amber-900">¿Siguen disponibles? Confirmarlo hace que te consulten menos por chat.</p>
            <button
              type="button"
              onClick={confirmAll}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white active:bg-amber-700"
            >
              <RefreshCw size={16} aria-hidden /> Confirmar {pending.length === 1 ? 'ahora' : `todas (${pending.length})`}
            </button>
          </div>
        </div>
      )}

      <main className="space-y-3 p-4">
        {list.map((l) => (
          <MyListingCard
            key={l.id}
            listing={l}
            needsConfirm={l.status === 'active' && needsConfirmation(l.lastConfirmedAt)}
            onConfirm={() => confirm(l)}
            onChangePrice={() => setPriceFor(l)}
            onClose={() => setCloseFor(l)}
            onShare={() => setShareFor(l)}
            onRepublish={() => republish(l)}
          />
        ))}

        {list.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
            {tab === 'active' ? (
              <>
                <p className="font-semibold">Aún no tienes propiedades publicadas.</p>
                <Link to="/publicar" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white">
                  <Plus size={18} aria-hidden /> Publicar
                </Link>
              </>
            ) : (
              <p className="text-slate-600">Aquí aparecen las que marques como vendidas o alquiladas.</p>
            )}
          </div>
        )}
      </main>

      <ShareSheet listing={shareFor} source="my_listings" onClose={() => setShareFor(null)} />
      <CloseSheet listing={closeFor} onCancel={cancelClose} onConfirm={close} />
      <PriceSheet
        listing={priceFor}
        onClose={() => setPriceFor(null)}
        onSave={(l, price) => {
          dispatch({ type: 'changePrice', id: l.id, price, at: nowIso() })
          setPriceFor(null)
          show(`Precio actualizado a ${formatPrice(price, l.currency)}.`)
        }}
      />
      <Toast key={toast?.id} toast={toast} onDone={clearToast} />
    </div>
  )
}

/** Up to 3 are named ("Casa en Tiquipaya y Departamento en Sarco…"); beyond that, only the count. */
const NAME_PENDING_UP_TO = 3

function pendingTitle(pending: Listing[]): string {
  if (pending.length > NAME_PENDING_UP_TO) return `${pending.length} propiedades necesitan confirmación.`
  const names = pending.map((l) => `${TYPE_LABELS[l.type]} en ${l.zone}`)
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
  return `${list} ${pending.length === 1 ? 'necesita' : 'necesitan'} confirmación.`
}

function MyListingCard({
  listing: l,
  needsConfirm,
  onConfirm,
  onChangePrice,
  onClose,
  onShare,
  onRepublish,
}: {
  listing: Listing
  needsConfirm: boolean
  onConfirm: () => void
  onChangePrice: () => void
  onClose: () => void
  onShare: () => void
  onRepublish: () => void
}) {
  const isClosed = l.status === 'closed'
  return (
    <article className={`rounded-2xl bg-white p-3 ring-1 ${needsConfirm ? 'ring-2 ring-amber-300' : 'ring-slate-200'} ${isClosed ? 'opacity-75' : ''}`}>
      <Link to={`/p/${l.id}`} className="flex gap-3">
        <PhotoPlaceholder photo={l.photos[0] ?? 'fachada'} iconSize={28} className="h-20 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 space-y-1">
          <p className="font-bold">{listingPrice(l)}</p>
          <p className="line-clamp-2 text-sm text-slate-700">
            {listingTitle(l)} · {l.zone}
          </p>
          {isClosed ? (
            <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">{CLOSE_LABEL[l.operation].done}</span>
          ) : (
            <FreshnessBadge lastConfirmedAt={l.lastConfirmedAt} />
          )}
        </div>
      </Link>
      {isClosed && (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton onClick={onRepublish} icon={<RotateCcw size={16} aria-hidden />}>
            Volver a publicar
          </ActionButton>
        </div>
      )}
      {!isClosed && (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton primary={needsConfirm} onClick={onConfirm} icon={<RefreshCw size={16} aria-hidden />}>
            Sigue disponible
          </ActionButton>
          <ActionButton onClick={onChangePrice} icon={<Tag size={16} aria-hidden />}>
            Cambiar precio
          </ActionButton>
          <ActionButton onClick={onShare} icon={<Share2 size={16} aria-hidden />}>
            Compartir
          </ActionButton>
          <ActionButton onClick={onClose} icon={<Flag size={16} aria-hidden />}>
            {CLOSE_LABEL[l.operation].action}
          </ActionButton>
        </div>
      )}
    </article>
  )
}

function ActionButton({ primary = false, onClick, icon, children }: { primary?: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${
        primary ? 'bg-brand-600 text-white active:bg-brand-700' : 'text-slate-800 ring-1 ring-slate-300 active:bg-slate-100'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

/** D2: confirmation before closing, naming the listing so a mis-tap is easy to spot. */
function CloseSheet({ listing, onCancel, onConfirm }: { listing: Listing | null; onCancel: () => void; onConfirm: (l: Listing) => void }) {
  const label = listing ? CLOSE_LABEL[listing.operation] : null
  return (
    <BottomSheet open={!!listing} onClose={onCancel} title={label?.question ?? ''}>
      {listing && label && (
        <div className="space-y-4 pt-1 pb-2">
          <p className="text-base">
            <b>
              {TYPE_LABELS[listing.type]} en {listing.zone}
            </b>{' '}
            ({listingPrice(listing)}). Ya no aparecerá en el listado.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-xl font-semibold text-slate-800 ring-1 ring-slate-300 active:bg-slate-100">
              Cancelar
            </button>
            <button type="button" onClick={() => onConfirm(listing)} className="min-h-12 flex-[1.4] rounded-xl bg-brand-600 font-semibold text-white active:bg-brand-700">
              {label.confirm}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function PriceSheet({ listing, onClose, onSave }: { listing: Listing | null; onClose: () => void; onSave: (l: Listing, price: number) => void }) {
  return (
    <BottomSheet open={!!listing} onClose={onClose} title="Cambiar precio">
      {listing && <PriceForm key={listing.id} listing={listing} onSave={onSave} />}
    </BottomSheet>
  )
}

function PriceForm({ listing, onSave }: { listing: Listing; onSave: (l: Listing, price: number) => void }) {
  const [value, setValue] = useState(String(listing.price))
  const price = Number(value.replace(/\D/g, ''))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (price > 0) onSave(listing, price)
      }}
      className="space-y-3 pt-1"
    >
      <p className="text-sm text-slate-600">
        {listingTitle(listing)} · {listing.zone}. Actualizar el precio también la marca como confirmada hoy.
      </p>
      <label className="flex items-center gap-2">
        <span className="font-semibold">{listing.currency === 'USD' ? '$us' : 'Bs'}</span>
        <input
          autoFocus
          inputMode="numeric"
          aria-label="Nuevo precio"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          className="min-h-12 w-full rounded-xl px-3 text-lg ring-1 ring-slate-300"
        />
      </label>
      <button type="submit" disabled={!(price > 0)} className="min-h-12 w-full rounded-xl bg-brand-600 font-semibold text-white disabled:bg-slate-200 disabled:text-slate-600">
        Guardar precio
      </button>
    </form>
  )
}
