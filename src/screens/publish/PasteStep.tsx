import { ClipboardPaste, Sparkles } from 'lucide-react'
import { useState } from 'react'

const EXAMPLE = 'Ej.:\nALQUILO DPTO en Cala Cala\n2 dorm, 1 baño, c/garaje\nAcepta mascotas\nBs 3.800 / mes\nComparto 50%'

export function PasteStep({ text, setText, onContinue, onManual }: { text: string; setText: (t: string) => void; onContinue: () => void; onManual: () => void }) {
  const [clipboardError, setClipboardError] = useState(false)

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setText(t)
    } catch {
      setClipboardError(true)
    }
  }

  return (
    <>
      <div className="space-y-3 p-4 pb-28">
        <div>
          <h2 className="text-xl font-semibold">Pega el mensaje que mandas a tus grupos</h2>
          <p className="text-sm text-slate-600">Tal cual lo publicas en WhatsApp. Nosotros armamos la ficha.</p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={9}
          aria-label="Mensaje de WhatsApp"
          className="w-full rounded-xl p-3 text-base ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 focus:outline-none"
        />
        <button type="button" onClick={pasteFromClipboard} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-slate-300 active:bg-slate-100">
          <ClipboardPaste size={18} aria-hidden /> Pegar del portapapeles
        </button>
        {clipboardError && <p className="text-sm text-slate-600">No pudimos leer el portapapeles. Mantén presionado el cuadro de texto y elige "Pegar".</p>}
        <p className="flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-slate-700">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
          Detectamos operación, tipo, zona, precio, dormitorios, garaje, mascotas, comisión y más. Lo que falte lo completas con un toque.
        </p>
        <p className="pt-2 text-center">
          <button type="button" onClick={onManual} className="min-h-11 px-2 text-sm font-medium text-slate-700 underline">
            Prefiero llenarlo manualmente
          </button>
        </p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={!text.trim()}
          className="min-h-12 w-full rounded-xl bg-brand-600 text-base font-semibold text-white active:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-600"
        >
          Continuar
        </button>
      </div>
    </>
  )
}
