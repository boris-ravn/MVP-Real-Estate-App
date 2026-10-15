import { Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import type { Listing } from '../domain/listing'
import { listingLink, shareText } from '../domain/share'
import { waUrl } from '../domain/whatsapp'
import { copyText } from '../lib/clipboard'
import { logEvent } from '../store/events'
import { BottomSheet } from './BottomSheet'

/** F6: texto estándar para pegar en los grupos de WhatsApp. */
export function ShareSheet({ listing, source, onClose }: { listing: Listing | null; source: string; onClose: () => void }) {
  return (
    <BottomSheet open={!!listing} onClose={onClose} title="Compartir en tus grupos">
      {listing && <ShareContent key={listing.id} listing={listing} source={source} />}
    </BottomSheet>
  )
}

function ShareContent({ listing, source }: { listing: Listing; source: string }) {
  const [text] = useState(() => shareText(listing, listingLink(listing.id)))
  const [copied, setCopied] = useState<boolean | null>(null)

  const track = (action: 'copy' | 'whatsapp') => logEvent('share_click', { listingId: listing.id, source, action })

  return (
    <div className="space-y-3 pt-1">
      <p className="text-sm text-slate-600">Mismo formato para todas: fácil de leer en el grupo.</p>
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
      <p className="text-xs text-slate-500">Prototipo: el link abre la ficha solo en este teléfono.</p>
    </div>
  )
}
