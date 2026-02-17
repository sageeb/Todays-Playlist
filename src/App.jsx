import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import TodayPage from './pages/TodayPage.jsx'
import AuthCallback from './pages/AuthCallback.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/callback" element={<AuthCallback />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
