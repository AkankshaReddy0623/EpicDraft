import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateStory from './pages/CreateStory'
import Room from './pages/Room'
import ReaderMode from './pages/ReaderMode'
import Profile from './pages/Profile'
import Store from './pages/Store'
import Leaderboard from './pages/Leaderboard'
import Inventory from './pages/Inventory'
import Quests from './pages/Quests'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <ToastContainer>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/home" element={<Dashboard />} />
                  <Route path="/create" element={<CreateStory />} />
                  <Route path="/room/:roomId" element={<Room />} />
                  <Route path="/room/:roomId/read" element={<ReaderMode />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/quests" element={<Quests />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </ToastContainer>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

