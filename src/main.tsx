import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SubscribeDevProvider } from '@subscribe.dev/react'
import './index.css'
import App from './App.tsx'

const project = import.meta.env.VITE_SUBSCRIBEDEV_PROJECT_SLUG?.trim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {project ? (
      <SubscribeDevProvider project={project}>
        <App />
      </SubscribeDevProvider>
    ) : (
      <main style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1>frontrunner</h1>
        <p>This workspace is not configured yet. Please check back soon.</p>
      </main>
    )}
  </StrictMode>,
)
