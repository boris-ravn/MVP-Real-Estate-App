import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Thumb-friendly bottom sheet. Closes via the backdrop, the X or Escape. */
export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-3xl bg-white shadow-xl"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden />
        <div className="flex items-center justify-between px-4 pt-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="border-t border-slate-200 p-4">{footer}</div>}
      </div>
    </div>
  )
}
