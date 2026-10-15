import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logEvent } from './store/events'

// Fuera de React para que StrictMode no lo duplique.
logEvent('session_start', { userAgent: navigator.userAgent })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
