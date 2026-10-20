import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logEvent } from './store/events'

// Outside React so StrictMode does not run it twice.
logEvent('session_start', { userAgent: navigator.userAgent })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
