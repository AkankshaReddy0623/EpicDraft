import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/ToastContainer'
import { PowerItem } from '../types'

export default function Store() {
  const { user, storeItems, purchaseItem, stats, inventory } = useApp()
  const { setCustomTheme } = useTheme()
  const { showToast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [activeBoosts, setActiveBoosts] = useState<Set<string>>(new Set())
  const [appliedThemes, setAppliedThemes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('appliedThemes')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [appliedFonts, setAppliedFonts] = useState<string | null>(() => {
    return localStorage.getItem('appliedFont') || null
  })

  const categories = useMemo(() => ['all', ...new Set(storeItems.map(item => item.category))], [storeItems])

  const filteredItems = useMemo(() => 
    selectedCategory === 'all' 
      ? storeItems 
      : storeItems.filter(item => item.category === selectedCategory),
    [storeItems, selectedCategory]
  )

  const handlePurchase = async (item: PowerItem) => {
    if (!user) {
      showToast('Please sign in to purchase items', 'warning')
      return
    }
    
    if (user.points < item.cost) {
      showToast('Insufficient points!', 'error')
      return
    }

    try {
      const success = await purchaseItem(item)
      if (success) {
        setPurchaseSuccess(item.id)
        setTimeout(() => setPurchaseSuccess(null), 2000)
        
        // Auto-activate entry boosts
        if (item.effectType === 'entry-boost') {
          setActiveBoosts(prev => new Set(prev).add(item.id))
        }
        
        // Auto-apply themes and fonts with persistence
        if (item.category === 'Themes') {
          const newThemes = new Set(appliedThemes).add(item.id)
          setAppliedThemes(newThemes)
          localStorage.setItem('appliedThemes', JSON.stringify(Array.from(newThemes)))
          
          // Actually apply the theme
          const themeMap: Record<string, 'golden' | 'ocean' | 'forest'> = {
            'cos1': 'golden',
            'cos3': 'ocean',
            'cos4': 'forest',
          }
          const themeName = themeMap[item.id]
          if (themeName) {
            setCustomTheme(themeName)
            localStorage.setItem('customTheme', themeName)
            showToast(`✅ Theme "${item.name}" applied and saved!`, 'success')
          }
        }
        
        if (item.category === 'Fonts') {
          setAppliedFonts(item.id)
          localStorage.setItem('appliedFont', item.id)
          
          // Apply font to document
          const fontMap: Record<string, string> = {
            'cos7': 'serif',
            'cos8': 'sans-serif',
            'cos9': 'cursive',
            'cos10': 'monospace',
          }
          const fontFamily = fontMap[item.id]
          if (fontFamily) {
            document.documentElement.style.fontFamily = fontFamily
            showToast(`✅ Font "${item.name}" applied and saved!`, 'success')
          }
        }
      } else {
        showToast('Failed to purchase item', 'error')
      }
    } catch (error: any) {
      // Handle offline errors gracefully
      const errorMsg = error.message || 'Failed to purchase item'
      if (errorMsg.includes('offline') || errorMsg.includes('client is offline')) {
        showToast('You are offline. Please check your connection and try again.', 'warning', 4000)
      } else {
        showToast(errorMsg, 'error')
      }
    }
  }

  const handleActivateBoost = (itemId: string) => {
    const hasItem = inventory.some(inv => inv.itemId === itemId && inv.quantity > 0)
    if (!hasItem) {
      showToast('You don\'t have this item in your inventory', 'warning')
      return
    }
    
    setActiveBoosts(prev => new Set(prev).add(itemId))
    showToast('Boost activated!', 'success')
  }

  const isBoostActive = (itemId: string) => activeBoosts.has(itemId)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-gold bg-gold/10'
      default: return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
    }
  }

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-gold bg-gold/20'
      default: return 'text-text-light bg-gray-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Store</h1>
        <p className="text-gray-600 dark:text-gray-400">Redeem your points for boosts and cosmetics</p>
      </div>
      
      {/* Points Display */}
      <div className="mb-8 card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-50 block mb-1">Your Points</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Earn points by writing nodes and contributing</span>
          </div>
          <div className="text-right">
            <span className="text-5xl font-bold text-gold animate-bounce-in">{stats.points}</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Level {stats.level}</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-gold text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 hover:border-gold'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Store Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => {
          const hasItem = inventory.some(inv => inv.itemId === item.id && inv.quantity > 0)
          const isTheme = item.category === 'Themes'
          const isFont = item.category === 'Fonts'
          const isApplied = isTheme ? appliedThemes.has(item.id) : isFont ? appliedFonts === item.id : false
          
          return (
            <div
              key={item.id}
              className={`card hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gold group animate-slide-up relative overflow-hidden ${
                getRarityColor(item.rarity)
              } ${hasItem ? 'ring-2 ring-gold' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
            {hasItem && (
              <div className="absolute top-2 right-2 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse-gold">
                ✓ Owned
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">
                {item.icon || '🎁'}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getRarityBadge(item.rarity)}`}>
                {item.rarity.toUpperCase()}
              </span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">{item.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed min-h-[3rem]">
              {item.description}
            </p>
            
            {item.cooldown && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">⏱️ Cooldown: {item.cooldown}h</p>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold text-xl">{item.cost}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">pts</span>
              </div>
              {item.effectType === 'entry-boost' && isBoostActive(item.id) ? (
                <button
                  disabled
                  className="btn-primary text-sm bg-green-500 hover:bg-green-600 cursor-not-allowed"
                >
                  ✓ Active
                </button>
              ) : (isTheme || isFont) && isApplied ? (
                <button
                  disabled
                  className="btn-primary text-sm bg-green-500 hover:bg-green-600 cursor-not-allowed"
                >
                  ✓ Applied
                </button>
              ) : hasItem ? (
                <button
                  onClick={() => {
                    if (isTheme) {
                      const newThemes = new Set(appliedThemes).add(item.id)
                      setAppliedThemes(newThemes)
                      localStorage.setItem('appliedThemes', JSON.stringify(Array.from(newThemes)))
                      
                      const themeMap: Record<string, 'golden' | 'ocean' | 'forest'> = {
                        'cos1': 'golden',
                        'cos3': 'ocean',
                        'cos4': 'forest',
                      }
                      const themeName = themeMap[item.id]
                      if (themeName) {
                        setCustomTheme(themeName)
                        localStorage.setItem('customTheme', themeName)
                        showToast(`✅ Theme "${item.name}" applied!`, 'success')
                      }
                    } else if (isFont) {
                      setAppliedFonts(item.id)
                      localStorage.setItem('appliedFont', item.id)
                      
                      const fontMap: Record<string, string> = {
                        'cos7': 'serif',
                        'cos8': 'sans-serif',
                        'cos9': 'cursive',
                        'cos10': 'monospace',
                      }
                      const fontFamily = fontMap[item.id]
                      if (fontFamily) {
                        document.documentElement.style.fontFamily = fontFamily
                        showToast(`✅ Font "${item.name}" applied!`, 'success')
                      }
                    } else {
                      handleActivateBoost(item.id)
                    }
                  }}
                  className="btn-primary text-sm bg-blue-500 hover:bg-blue-600"
                >
                  {isTheme || isFont ? 'Apply' : 'Activate'}
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!user || user.points < item.cost}
                  className={`btn-primary text-sm transition-all ${
                    !user || user.points < item.cost
                      ? 'opacity-50 cursor-not-allowed'
                      : purchaseSuccess === item.id
                      ? 'bg-green-500 hover:bg-green-600 animate-bounce-in'
                      : 'hover:scale-105'
                  }`}
                >
                  {purchaseSuccess === item.id ? '✓ Purchased!' : `Redeem ${item.cost} pts`}
                </button>
              )}
            </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-text-light">No items in this category</p>
        </div>
      )}
    </div>
  )
}
