import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import i18n from './lib/i18n'

function initializeLanguage() {
  const urlParams = new URLSearchParams(window.location.search)
  const language = urlParams.get('language')
  if (language && ['fr', 'en'].includes(language)) {
    i18n.changeLanguage(language)
  }
}

// Initialize language before rendering
initializeLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
