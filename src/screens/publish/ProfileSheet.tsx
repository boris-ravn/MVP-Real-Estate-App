import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import type { Agent } from '../../domain/listing'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (a: Agent) => void
  title?: string
  intro?: string
  cta?: string
}

/** Name and WhatsApp, saved on the phone. No account or password. Requested when publishing or sharing with a client. */
export function ProfileSheet({
  open,
  onClose,
  onSave,
  title = '¿Quién publica?',
  intro = 'Solo la primera vez. Así otros asesores te pueden consultar por WhatsApp. No necesitas cuenta ni contraseña.',
  cta = 'Guardar y publicar',
}: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)
  const digits = phone.replace(/\D/g, '')
  const nameOk = name.trim().length >= 2
  const phoneOk = /^[67]\d{7}$/.test(digits)

  const save = () => {
    setTouched(true)
    if (!nameOk || !phoneOk) return
    onSave({ name: name.trim(), whatsapp: `+591${digits}`, memberSince: new Date().toISOString() })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button type="button" onClick={save} className="min-h-12 w-full rounded-xl bg-brand-600 text-base font-semibold text-white active:bg-brand-700">
          {cta}
        </button>
      }
    >
      <p className="mb-3 text-sm text-slate-600">{intro}</p>
      <label className="block text-sm font-medium text-slate-700">
        Tu nombre
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Ej.: Ana Pérez"
          className="mt-1 min-h-12 w-full rounded-xl px-3 text-base font-normal ring-1 ring-slate-300"
        />
      </label>
      {touched && !nameOk && <p className="mt-1 text-sm text-red-700">Escribe tu nombre.</p>}
      <label className="mt-3 block text-sm font-medium text-slate-700">
        Tu WhatsApp
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-xl bg-slate-100 px-3 py-3 text-base font-normal">+591</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="7xxxxxxx"
            className="min-h-12 w-full rounded-xl px-3 text-base font-normal ring-1 ring-slate-300"
          />
        </div>
      </label>
      {touched && !phoneOk && <p className="mt-1 text-sm text-red-700">Debe ser un celular de 8 dígitos que empiece con 6 o 7.</p>}
    </BottomSheet>
  )
}
