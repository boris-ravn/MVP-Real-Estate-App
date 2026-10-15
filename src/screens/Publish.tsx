import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { draftFromParsed, draftToListing, EMPTY_DRAFT, missingRequired, relevantFields, type Draft } from '../domain/draft'
import type { Agent, Listing } from '../domain/listing'
import { parseListing } from '../parser/parseListing'
import { useStore } from '../store/context'
import { logEvent } from '../store/events'
import { PasteStep } from './publish/PasteStep'
import { ProfileSheet } from './publish/ProfileSheet'
import { ReviewStep } from './publish/ReviewStep'
import { SuccessStep } from './publish/SuccessStep'

type Step = 'paste' | 'review' | 'done'
const STEPS: { key: Step; label: string }[] = [
  { key: 'paste', label: 'Pegar' },
  { key: 'review', label: 'Revisar' },
  { key: 'done', label: 'Listo' },
]

export function Publish() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('paste')
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [detected, setDetected] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [askProfile, setAskProfile] = useState(false)
  const [published, setPublished] = useState<Listing | null>(null)

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    logEvent('publish_started')
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const goReview = (manual: boolean) => {
    const parsed = manual ? { detected: [] } : parseListing(text)
    const next = draftFromParsed(parsed, manual ? '' : text)
    const fields = relevantFields(next)
    logEvent('publish_parsed', {
      manual,
      detectedCount: fields.filter((f) => parsed.detected.includes(f)).length,
      relevantCount: fields.length,
      detected: parsed.detected,
    })
    setDraft(next)
    setDetected(parsed.detected)
    setShowErrors(false)
    setStep('review')
  }

  const publish = (agent: Agent | null = state.profile) => {
    if (missingRequired(draft).length) {
      setShowErrors(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!agent) {
      setAskProfile(true)
      return
    }
    const listing = draftToListing(draft, agent)
    dispatch({ type: 'publish', listing })
    logEvent('publish_completed', {
      listingId: listing.id,
      detectedCount: relevantFields(draft).filter((f) => detected.includes(f)).length,
    })
    setPublished(listing)
    setStep('done')
  }

  const missing = missingRequired(draft)

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1 px-2 py-1">
          {step === 'review' ? (
            <button type="button" onClick={() => setStep('paste')} className="flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Volver a pegar">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/')} className="flex size-11 items-center justify-center rounded-full active:bg-slate-100" aria-label="Cerrar">
              <X size={24} />
            </button>
          )}
          <h1 className="text-base font-semibold">{step === 'review' ? 'Revisa tu ficha' : 'Publicar propiedad'}</h1>
        </div>
        <ol className="flex items-center gap-2 px-4 pb-2 text-xs text-slate-500">
          {STEPS.map((s, i) => {
            const current = STEPS.findIndex((x) => x.key === step)
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${i <= current ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i + 1}</span>
                <span className={i === current ? 'font-semibold text-slate-900' : ''}>{s.label}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" aria-hidden />}
              </li>
            )
          })}
        </ol>
      </header>

      {step === 'paste' && <PasteStep text={text} setText={setText} onContinue={() => goReview(false)} onManual={() => goReview(true)} />}

      {step === 'review' && (
        <>
          <ReviewStep draft={draft} setDraft={setDraft} detected={detected} showErrors={showErrors} />
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white p-3">
            {showErrors && missing.length > 0 && <p className="mb-2 text-center text-sm text-red-700">Completa los campos obligatorios (*) para publicar.</p>}
            <button type="button" onClick={() => publish()} className="min-h-12 w-full rounded-xl bg-brand-600 text-base font-semibold text-white active:bg-brand-700">
              Publicar
            </button>
          </div>
        </>
      )}

      {step === 'done' && published && <SuccessStep listing={published} />}

      <ProfileSheet
        open={askProfile}
        onClose={() => setAskProfile(false)}
        onSave={(agent) => {
          dispatch({ type: 'setProfile', profile: agent })
          setAskProfile(false)
          publish(agent)
        }}
      />
    </div>
  )
}
