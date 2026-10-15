import { useEffect } from 'react'

export interface ToastData {
  id: number
  message: string
  action?: { label: string; onClick: () => void }
}

/** Aviso breve sobre la barra inferior; se oculta solo a los 5 s. */
export function Toast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onDone, 5000)
    return () => window.clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md justify-center px-4" role="status" aria-live="polite">
      <div className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
        <span className="py-1.5">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action!.onClick()
              onDone()
            }}
            className="-mr-2 min-h-11 shrink-0 px-2 font-semibold text-sky-300 underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  )
}
