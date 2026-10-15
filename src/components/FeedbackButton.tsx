import { Check, Copy, Info, MessageSquareHeart, Send } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { FEEDBACK_WHATSAPP_NUMBER, PRODUCT_NAME } from '../config'
import { feedbackMessage, type FeedbackAnswers, type WouldUse } from '../domain/feedback'
import { waUrl } from '../domain/whatsapp'
import { copyText } from '../lib/clipboard'
import { logEvent, sessionEvents } from '../store/events'
import { BottomSheet } from './BottomSheet'

/** Pantallas con barra de acciones fija abajo: el botón sube para no taparla. */
const WITH_BOTTOM_BAR = [/^\/p\//, /^\/publicar/]

/** F7: botón flotante "Opinar", visible en toda la app durante la prueba. */
export function FeedbackButton() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  if (pathname.startsWith('/debug')) return null
  const raised = WITH_BOTTOM_BAR.some((re) => re.test(pathname))

  return (
    <>
      <div className={`pointer-events-none fixed inset-x-0 z-20 mx-auto flex max-w-md px-4 ${raised ? 'bottom-[84px]' : 'bottom-4'}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-slate-800 shadow-md ring-1 ring-slate-300 active:bg-slate-100"
        >
          <MessageSquareHeart size={18} className="text-brand-600" aria-hidden /> Opinar
        </button>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Tu opinión">
        {open && <FeedbackForm />}
      </BottomSheet>
    </>
  )
}

function FeedbackForm() {
  const [a, setA] = useState<FeedbackAnswers>({ usefulness: null, missing: '', wouldUse: null })
  const [sentText, setSentText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const submit = () => {
    // Se guarda la respuesta completa: sin número configurado, /debug es la forma de recuperarla.
    logEvent('feedback_sent', { usefulness: a.usefulness, wouldUse: a.wouldUse, comment: a.missing.trim() })
    const text = feedbackMessage(a, sessionEvents(), PRODUCT_NAME)
    setSentText(text)
    if (FEEDBACK_WHATSAPP_NUMBER) window.open(waUrl(text, FEEDBACK_WHATSAPP_NUMBER), '_blank', 'noopener')
  }

  if (sentText != null) {
    return (
      <div className="space-y-3 pt-1">
        <p className="text-lg font-semibold">¡Gracias por tu opinión!</p>
        {FEEDBACK_WHATSAPP_NUMBER ? (
          <p className="text-sm text-slate-600">Se abrió WhatsApp con tus respuestas. Solo falta tocar "Enviar".</p>
        ) : (
          <>
            <div className="flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-slate-800 ring-1 ring-brand-100">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
              <p>
                <span className="font-semibold">Prototipo:</span> en la app real, esto se enviaría directo por WhatsApp con este mensaje. Tus respuestas
                quedaron guardadas en este teléfono.
              </p>
            </div>
            <pre className="max-h-48 overflow-y-auto rounded-xl bg-emerald-50 p-3 font-sans text-sm whitespace-pre-wrap ring-1 ring-emerald-200">{sentText}</pre>
            <button
              type="button"
              onClick={async () => setCopied(await copyText(sentText))}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium text-slate-700 underline"
            >
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              {copied ? '¡Copiado!' : 'Copiar el texto'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-1">
      <fieldset>
        <legend className="mb-2 font-medium">¿Qué tan útil te parece?</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={a.usefulness === n}
              onClick={() => setA({ ...a, usefulness: n })}
              className={`min-h-12 flex-1 rounded-xl text-lg font-semibold ring-1 ${a.usefulness === n ? 'bg-brand-600 text-white ring-brand-600' : 'text-slate-800 ring-slate-300'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>Nada útil</span>
          <span>Muy útil</span>
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block font-medium">¿Qué le falta o qué cambiarías?</span>
        <textarea
          value={a.missing}
          onChange={(e) => setA({ ...a, missing: e.target.value })}
          rows={3}
          placeholder="Escribe lo que quieras"
          className="w-full rounded-xl p-3 text-base ring-1 ring-slate-300"
        />
      </label>

      <fieldset>
        <legend className="mb-2 font-medium">¿Lo usarías para tu próximo cliente?</legend>
        <div className="flex gap-2">
          {(['Sí', 'Tal vez', 'No'] as WouldUse[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={a.wouldUse === v}
              onClick={() => setA({ ...a, wouldUse: v })}
              className={`min-h-12 flex-1 rounded-xl font-semibold ring-1 ${a.wouldUse === v ? 'bg-brand-600 text-white ring-brand-600' : 'text-slate-800 ring-slate-300'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={submit}
        disabled={a.usefulness == null && !a.missing.trim() && a.wouldUse == null}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white active:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-600"
      >
        <Send size={18} aria-hidden /> Enviar por WhatsApp
      </button>
    </div>
  )
}
