import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Safely get context values with fallbacks
  let user, stats, loading
  let theme, toggleTheme
  
  try {
    const appContext = useApp()
    user = appContext.user
    stats = appContext.stats
    loading = appContext.loading
  } catch (error) {
    console.warn('Navbar: AppContext not available', error)
    user = null
    stats = { level: 1, xp: 0, points: 0, badges: [], totalNodesWritten: 0, totalVotesReceived: 0, totalStoriesCreated: 0 }
    loading = false
  }
  
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
    toggleTheme = themeContext.toggleTheme
  } catch (error) {
    console.warn('Navbar: ThemeContext not available', error)
    theme = 'light'
    toggleTheme = () => {}
  }

  const isActive = (path: string) => location.pathname === path

  // Show minimal navbar while loading
  if (loading) {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gold">StoryWeave</span>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gold hover:text-gold-dark transition-colors">
              StoryWeave
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gold/10 rounded-lg border border-gold/20">
                <span className="text-gold font-bold">{stats.points}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">pts</span>
              </div>
            )}
            <Link 
              to="/home" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/home') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/quests" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/quests') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Quests
            </Link>
            <Link 
              to="/store" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/store') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Store
            </Link>
            <Link 
              to="/inventory" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/inventory') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Inventory
            </Link>
            <Link 
              to="/leaderboard" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/leaderboard') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/profile" 
              className={`transition-colors duration-200 font-medium ${
                isActive('/profile') 
                  ? 'text-gold border-b-2 border-gold pb-1' 
                  : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Profile
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-900 dark:text-gray-50 hover:text-gold transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
            {user && (
              <div className="px-4 py-2 bg-gold/10 rounded-lg border border-gold/20 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Points</span>
                  <span className="text-gold font-bold">{stats.points}</span>
                </div>
              </div>
            )}
            <Link 
              to="/home" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/home') ? 'text-gold' : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/quests" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/quests') ? 'text-gold' : 'text-gray-900 dark:text-gray-50 hover:text-gold'
              }`}
            >
              Quests
            </Link>
            <Link 
              to="/store" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/store') ? 'text-gold' : 'text-text hover:text-gold'
              }`}
            >
              Store
            </Link>
            <Link 
              to="/inventory" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/inventory') ? 'text-gold' : 'text-text hover:text-gold'
              }`}
            >
              Inventory
            </Link>
            <Link 
              to="/leaderboard" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/leaderboard') ? 'text-gold' : 'text-text hover:text-gold'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors duration-200 font-medium ${
                isActive('/profile') ? 'text-gold' : 'text-text hover:text-gold'
              }`}
            >
              Profile
            </Link>
            {!user && (
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary block text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

