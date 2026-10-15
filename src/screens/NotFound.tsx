import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">Esta página no existe</h1>
      <Link to="/" className="font-medium text-brand-700 underline">
        Volver al inicio
      </Link>
    </div>
  )
}
