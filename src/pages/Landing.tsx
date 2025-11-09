import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  let user, loading
  try {
    const appContext = useApp()
    user = appContext.user
    loading = appContext.loading
  } catch (error) {
    console.warn('Landing: AppContext not available', error)
    user = null
    loading = false
  }
  
  const navigate = useNavigate()

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (!loading && user) {
      navigate('/home')
    }
  }, [user, loading, navigate])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 py-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-50 mb-6 leading-tight animate-slide-up">
          Welcome to <span className="text-gold animate-pulse-gold">StoryWeave</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-4 max-w-3xl mx-auto font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Multi-author interactive story builder
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Create branching narratives, vote on story paths, and earn points as you craft epic tales together
        </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link 
            to="/login" 
            className="game-button text-lg px-10 py-4 w-full sm:w-auto font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link 
            to="/home" 
            className="btn-secondary text-lg px-10 py-4 w-full sm:w-auto font-semibold hover:border-gold transition-all duration-200"
          >
            Explore Stories
          </Link>
        </div>
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="game-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-gold text-4xl mb-4 animate-float">✍️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Collaborative Writing</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Work together with multiple authors to create branching story narratives
            </p>
          </div>
          
          <div className="game-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-gold text-4xl mb-4 animate-float" style={{ animationDelay: '0.2s' }}>🎮</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Gamified Experience</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Earn points, unlock badges, and compete on the leaderboard
            </p>
          </div>
          
          <div className="game-card animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="text-gold text-4xl mb-4 animate-float" style={{ animationDelay: '0.4s' }}>🗳️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Vote on Paths</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Democracy in storytelling - vote on which branches become canon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

