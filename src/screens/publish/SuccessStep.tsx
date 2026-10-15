import { CircleCheck, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { FreshnessBadge } from '../../components/FreshnessBadge'
import { ListingCard } from '../../components/ListingCard'
import { ShareSheet } from '../../components/ShareSheet'
import type { Listing } from '../../domain/listing'

export function SuccessStep({ listing }: { listing: Listing }) {
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <div className="space-y-4 p-4 pb-8">
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <CircleCheck size={56} className="text-emerald-600" aria-hidden />
        <h2 className="text-2xl font-bold">¡Publicada!</h2>
        <FreshnessBadge lastConfirmedAt={listing.lastConfirmedAt} />
        <p className="text-sm text-slate-600">Ya aparece primera en el listado y en Mis propiedades.</p>
      </div>
      <ListingCard listing={listing} />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp font-semibold text-white active:brightness-95"
        >
          <Share2 size={20} aria-hidden /> Compartir en tus grupos
        </button>
        <Link to="/mis-propiedades" className="flex min-h-12 items-center justify-center rounded-xl font-medium text-slate-700 ring-1 ring-slate-300">
          Ver mis propiedades
        </Link>
        <Link to="/" className="flex min-h-12 items-center justify-center rounded-xl font-medium text-slate-700 ring-1 ring-slate-300">
          Ir al inicio
        </Link>
      </div>
      <ShareSheet listing={shareOpen ? listing : null} source="publish_success" onClose={() => setShareOpen(false)} />
    </div>
  )
}
