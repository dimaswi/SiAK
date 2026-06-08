import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'
import { rewriteBackendUrl } from './lib/runtime'

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    config.url = rewriteBackendUrl(config.url)
  }

  return config
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
