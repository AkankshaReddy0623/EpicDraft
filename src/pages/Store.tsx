import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PowerItem } from '../types'

export default function Store() {
  const { user, storeItems, purchaseItem, stats, inventory } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [activeBoosts, setActiveBoosts] = useState<Set<string>>(new Set())

  const categories = ['all', ...new Set(storeItems.map(item => item.category))]

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory)

  const handlePurchase = async (item: PowerItem) => {
    if (!user) {
      alert('Please sign in to purchase items')
      return
    }
    
    if (user.points < item.cost) {
      alert('Insufficient points!')
      return
    }

    const success = await purchaseItem(item)
    if (success) {
      setPurchaseSuccess(item.id)
      setTimeout(() => setPurchaseSuccess(null), 2000)
      
      // Auto-activate entry boosts
      if (item.effectType === 'entry-boost') {
        setActiveBoosts(prev => new Set(prev).add(item.id))
        alert(`${item.name} is now active!`)
      }
    } else {
      alert('Failed to purchase item')
    }
  }

  const handleActivateBoost = (itemId: string) => {
    const hasItem = inventory.some(inv => inv.itemId === itemId && inv.quantity > 0)
    if (!hasItem) {
      alert('You don\'t have this item in your inventory')
      return
    }
    
    setActiveBoosts(prev => new Set(prev).add(itemId))
    alert('Boost activated!')
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
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={`card hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-gold group animate-slide-up ${
              getRarityColor(item.rarity)
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
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
              ) : inventory.some(inv => inv.itemId === item.id && inv.quantity > 0) ? (
                <button
                  onClick={() => handleActivateBoost(item.id)}
                  className="btn-primary text-sm bg-blue-500 hover:bg-blue-600"
                >
                  Activate
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!user || user.points < item.cost}
                  className={`btn-primary text-sm ${
                    !user || user.points < item.cost
                      ? 'opacity-50 cursor-not-allowed'
                      : purchaseSuccess === item.id
                      ? 'bg-green-500 hover:bg-green-600'
                      : ''
                  }`}
                >
                  {purchaseSuccess === item.id ? '✓ Purchased!' : 'Redeem'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-text-light">No items in this category</p>
        </div>
      )}
    </div>
  )
}
