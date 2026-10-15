import { ArrowLeft, Copy, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { DEMO_MODE, FEEDBACK_WHATSAPP_NUMBER, PRODUCT_NAME } from '../config'
import { useResetDemo } from '../hooks/useResetDemo'
import { copyText } from '../lib/clipboard'
import { currentSessionId, getEvents, summarizeEvents, type TrackedEvent } from '../store/events'
import { useStore } from '../store/context'

/** Ruta oculta para el moderador: eventos, configuración y reinicio. */
export function Debug() {
  const { state } = useStore()
  const reset = useResetDemo()
  const [events, setEvents] = useState<TrackedEvent[]>(() => getEvents())
  const [copied, setCopied] = useState(false)

  const bySession = new Map<string, TrackedEvent[]>()
  for (const e of events) bySession.set(e.sessionId, [...(bySession.get(e.sessionId) ?? []), e])

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white pb-8 text-sm">
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-slate-200 bg-white px-2 py-1">
        <Link to="/" className="flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Volver al inicio">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-base font-semibold">Debug</h1>
      </header>

      <section className="space-y-1 p-4">
        <h2 className="font-semibold">Configuración (src/config.ts)</h2>
        <p>PRODUCT_NAME: {PRODUCT_NAME}</p>
        <p>DEMO_MODE: {String(DEMO_MODE)}</p>
        <p>FEEDBACK_WHATSAPP_NUMBER: {FEEDBACK_WHATSAPP_NUMBER || '(vacío: el feedback se copia)'}</p>
        <p>
          Perfil: {state.profile ? `${state.profile.name} · ${state.profile.whatsapp}` : '(sin registrar)'} · Propiedades: {state.listings.length} (
          {state.listings.filter((l) => l.isMine).length} propias)
        </p>
      </section>

      <section className="flex gap-2 px-4">
        <button
          type="button"
          onClick={() => {
            if (reset()) setEvents(getEvents())
          }}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 font-semibold text-white active:bg-red-700"
        >
          <RotateCcw size={18} aria-hidden /> Reiniciar demo
        </button>
        <button
          type="button"
          onClick={async () => setCopied(await copyText(JSON.stringify(events, null, 2)))}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl font-semibold ring-1 ring-slate-300 active:bg-slate-100"
        >
          <Copy size={18} aria-hidden /> {copied ? '¡Copiado!' : 'Copiar eventos'}
        </button>
      </section>

      <section className="p-4">
        <h2 className="mb-2 font-semibold">Eventos ({events.length})</h2>
        {events.length === 0 && <p className="text-slate-500">Sin eventos.</p>}
        {[...bySession.entries()].reverse().map(([sid, list]) => (
          <div key={sid} className="mb-4">
            <p className="mb-1 font-medium">
              Sesión {sid}
              {sid === currentSessionId() && <span className="ml-1 rounded bg-brand-50 px-1.5 text-brand-700">actual</span>}
            </p>
            <p className="mb-2 text-xs text-slate-600">{summarizeEvents(list)}</p>
            <table className="w-full table-fixed text-xs">
              <tbody>
                {[...list].reverse().map((e, i) => (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="w-20 py-1 whitespace-nowrap text-slate-500">{new Date(e.at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td className="w-28 py-1 font-medium break-all">{e.name}</td>
                    <td className="py-1 break-all text-slate-600">{e.data ? JSON.stringify(e.data) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  )
}
