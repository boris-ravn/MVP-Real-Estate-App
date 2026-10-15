import { Bath, BedDouble, CookingPot, House, Sofa, Trees, type LucideIcon } from 'lucide-react'
import type { PhotoId } from '../domain/listing'

const PHOTOS: Record<PhotoId, { icon: LucideIcon; label: string; gradient: string }> = {
  fachada: { icon: House, label: 'Fachada', gradient: 'from-sky-100 to-sky-200 text-sky-700' },
  living: { icon: Sofa, label: 'Living', gradient: 'from-amber-50 to-amber-200 text-amber-700' },
  cocina: { icon: CookingPot, label: 'Cocina', gradient: 'from-orange-50 to-orange-200 text-orange-700' },
  dormitorio: { icon: BedDouble, label: 'Dormitorio', gradient: 'from-violet-50 to-violet-200 text-violet-700' },
  bano: { icon: Bath, label: 'Baño', gradient: 'from-cyan-50 to-cyan-200 text-cyan-700' },
  patio: { icon: Trees, label: 'Patio', gradient: 'from-emerald-50 to-emerald-200 text-emerald-700' },
}

/** Foto ficticia: gradiente + ícono. No se usan imágenes de terceros. */
export function PhotoPlaceholder({ photo, className = '', iconSize = 40 }: { photo: PhotoId; className?: string; iconSize?: number }) {
  const { icon: Icon, label, gradient } = PHOTOS[photo]
  return (
    <div role="img" aria-label={`Foto: ${label}`} className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
      <Icon size={iconSize} strokeWidth={1.5} aria-hidden />
    </div>
  )
}
