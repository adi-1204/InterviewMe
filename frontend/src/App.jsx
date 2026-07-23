import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import useAuth from './hooks/useAuth.js'
import Landing from './routes/Landing.jsx'
import Login from './routes/Login.jsx'
import Signup from './routes/Signup.jsx'
import Onboarding from './routes/Onboarding.jsx'

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Loading secure session</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
