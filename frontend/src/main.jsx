import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { clerkAppearance } from './styles/clerkAppearance.js'
import './styles/index.css'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkSetupNotice() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/40">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Clerk setup required</p>
        <h1 className="text-3xl font-semibold">Set VITE_CLERK_PUBLISHABLE_KEY to start the app</h1>
        <p className="text-sm leading-6 text-slate-300">
          The frontend is wired for Clerk, but it still needs your publishable key in the Vite environment before sign up and login can work.
        </p>
      </div>
    </div>
  )
}

function Root() {
  if (!clerkPublishableKey) {
    return <ClerkSetupNotice />
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/" appearance={clerkAppearance}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
