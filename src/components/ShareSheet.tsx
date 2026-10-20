import { Check, Copy, Handshake, MessageCircle, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Listing } from '../domain/listing'
import { clientShareText, defaultShareMode, listingLink, shareText, type ShareMode } from '../domain/share'
import { waUrl } from '../domain/whatsapp'
import { copyText } from '../lib/clipboard'
import { ProfileSheet } from '../screens/publish/ProfileSheet'
import { useStore } from '../store/context'
import { logEvent } from '../store/events'
import { BottomSheet } from './BottomSheet'

const MODES: { key: ShareMode; label: string; icon: ReactNode; hint: string }[] = [
  { key: 'client', label: 'Para mi cliente', icon: <UserRound size={16} aria-hidden />, hint: 'Sin comisión ni datos del asesor que publicó. Tu cliente te consulta a ti.' },
  { key: 'agents', label: 'Para asesores', icon: <Handshake size={16} aria-hidden />, hint: 'Formato estándar para tus grupos: fácil de leer y con la comisión.' },
]

/** F6 + C1 of PRD v2: WhatsApp text in two modes, for agents or for the end client. */
export function ShareSheet({ listing, source, onClose }: { listing: Listing | null; source: string; onClose: () => void }) {
  return (
    <BottomSheet open={!!listing} onClose={onClose} title="Compartir">
      {listing && <ShareContent key={listing.id} listing={listing} source={source} />}
    </BottomSheet>
  )
}

function ShareContent({ listing, source }: { listing: Listing; source: string }) {
  const { state, dispatch } = useStore()
  const [mode, setMode] = useState<ShareMode>(() => defaultShareMode(listing))
  const [copied, setCopied] = useState<boolean | null>(null)
  const [askProfile, setAskProfile] = useState(false)
  const [link] = useState(() => listingLink(listing.id))

  const profile = state.profile
  const needsProfile = mode === 'client' && !profile
  const text = mode === 'client' ? (profile ? clientShareText(listing, profile) : '') : shareText(listing, link)

  const track = (action: 'copy' | 'whatsapp') => logEvent('share_click', { listingId: listing.id, source, action, mode })

  return (
    <div className="space-y-3 pt-1">
      <p className="text-sm font-medium text-slate-700">¿Con quién lo compartes?</p>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Modo de compartir">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            onClick={() => {
              setMode(m.key)
              setCopied(null)
            }}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${mode === m.key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600'}`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600">{MODES.find((m) => m.key === mode)!.hint}</p>

      {needsProfile ? (
        <div className="space-y-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <p className="text-sm text-amber-950">Para enviárselo a tu cliente necesitamos tu nombre y tu WhatsApp: así te consulta a ti, no al asesor que publicó.</p>
          <button type="button" onClick={() => setAskProfile(true)} className="min-h-12 w-full rounded-xl bg-brand-600 font-semibold text-white active:bg-brand-700">
            Agregar mis datos
          </button>
        </div>
      ) : (
        <>
          <pre className="rounded-xl bg-emerald-50 p-3 font-sans text-sm whitespace-pre-wrap text-slate-800 ring-1 ring-emerald-200">{text}</pre>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                track('copy')
                setCopied(await copyText(text))
              }}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold text-slate-800 ring-1 ring-slate-300 active:bg-slate-100"
            >
              {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
            <button
              type="button"
              onClick={() => {
                track('whatsapp')
                window.open(waUrl(text), '_blank', 'noopener')
              }}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp font-semibold text-white active:brightness-95"
            >
              <MessageCircle size={18} aria-hidden /> Abrir WhatsApp
            </button>
          </div>
          {copied === false && <p className="text-sm text-red-700">No se pudo copiar. Mantén presionado el texto para copiarlo.</p>}
          {mode === 'agents' && <p className="text-xs text-slate-500">Prototipo: el link abre la ficha solo en este teléfono.</p>}
        </>
      )}

      <ProfileSheet
        open={askProfile}
        onClose={() => setAskProfile(false)}
        title="¿Quién lo envía?"
        intro="Tu cliente verá tu nombre y tu WhatsApp. Se guarda solo en este teléfono; es el mismo dato que pedimos al publicar."
        cta="Guardar y continuar"
        onSave={(agent) => {
          dispatch({ type: 'setProfile', profile: agent })
          setAskProfile(false)
        }}
      />
    </div>
  )
}
