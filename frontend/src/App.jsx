import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './routes/Landing.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* TODO: add the rest of the routes as you build them out
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/resume-review" element={<ResumeReview />} />
        <Route path="/interview/:sessionId" element={<InterviewSession />} />
        <Route path="/report/:sessionId" element={<ReportDashboard />} />
        <Route path="/history" element={<SessionHistory />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
