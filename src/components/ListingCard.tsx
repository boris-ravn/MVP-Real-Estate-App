import { Bath, BedDouble, Car, Handshake, PawPrint, Ruler } from 'lucide-react'
import { Link } from 'react-router'
import { listingPrice, listingTitle } from '../domain/format'
import type { Listing } from '../domain/listing'
import { FreshnessBadge } from './FreshnessBadge'
import { PhotoPlaceholder } from './PhotoPlaceholder'

export function ListingCard({ listing: l }: { listing: Listing }) {
  const area = l.type === 'terreno' ? l.landM2 : l.builtM2
  return (
    <Link
      to={`/p/${l.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99]"
    >
      <div className="relative">
        <PhotoPlaceholder photo={l.photos[0] ?? 'fachada'} className="h-36 w-full" />
        {l.photos.length > 1 && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {l.photos.length} fotos
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="text-xl font-bold tracking-tight">{listingPrice(l)}</div>
        <div className="text-sm text-slate-700">
          {listingTitle(l)} · <span className="font-semibold text-slate-900">{l.zone}</span>
        </div>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          {l.bedrooms != null && (
            <li className="flex items-center gap-1">
              <BedDouble size={16} aria-hidden /> {l.bedrooms} dorm
            </li>
          )}
          {l.bathrooms != null && (
            <li className="flex items-center gap-1">
              <Bath size={16} aria-hidden /> {l.bathrooms} {l.bathrooms === 1 ? 'baño' : 'baños'}
            </li>
          )}
          {area != null && (
            <li className="flex items-center gap-1">
              <Ruler size={16} aria-hidden /> {area} m²
            </li>
          )}
          {l.garage && (
            <li className="flex items-center gap-1" title="Garaje">
              <Car size={16} aria-hidden />
              <span className="sr-only">Garaje</span>
            </li>
          )}
          {l.pets && (
            <li className="flex items-center gap-1" title="Acepta mascotas">
              <PawPrint size={16} aria-hidden />
              <span className="sr-only">Acepta mascotas</span>
            </li>
          )}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <FreshnessBadge lastConfirmedAt={l.lastConfirmedAt} />
          {l.commissionShare != null && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
              <Handshake size={14} aria-hidden /> Comparte {l.commissionShare}%
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
