import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { InventoryItem } from '../types'

export default function Inventory() {
  const { inventory, useItem, user } = useApp()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [useSuccess, setUseSuccess] = useState<string | null>(null)

  const handleUseItem = (item: InventoryItem) => {
    if (item.quantity <= 0) return
    
    useItem(item.itemId)
    setUseSuccess(item.itemId)
    setTimeout(() => setUseSuccess(null), 2000)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300'
      case 'rare': return 'border-blue-300'
      case 'epic': return 'border-purple-300'
      case 'legendary': return 'border-gold'
      default: return 'border-gray-200 dark:border-gray-700'
    }
  }

  const groupedInventory = inventory.reduce((acc, item) => {
    const category = item.item.category
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Inventory</h1>
        <p className="text-gray-600 dark:text-gray-400">View and activate your purchased items</p>
      </div>

      {inventory.length === 0 ? (
        <div className="card text-center py-16 animate-slide-up">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Your inventory is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Purchase items from the store to get started</p>
          <a href="/store" className="btn-primary inline-block">
            Visit Store
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedInventory).map(([category, items], catIndex) => (
            <div key={category} className="animate-slide-up" style={{ animationDelay: `${catIndex * 0.1}s` }}>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <span>{items[0].item.icon || '📦'}</span>
                {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, index) => (
                  <div
                    key={item.itemId}
                    className={`card hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 ${getRarityColor(item.item.rarity)} animate-slide-up`}
                    style={{ animationDelay: `${(catIndex * 0.1) + (index * 0.05)}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{item.item.icon || '🎁'}</div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-gold/20 text-gold text-xs font-bold rounded-full">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{item.item.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{item.item.description}</p>
                    
                    {item.item.cooldown && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">⏱️ Cooldown: {item.item.cooldown}h</p>
                    )}
                    
                    <button
                      onClick={() => handleUseItem(item)}
                      disabled={item.quantity <= 0}
                      className={`w-full btn-primary text-sm ${
                        item.quantity <= 0
                          ? 'opacity-50 cursor-not-allowed'
                          : useSuccess === item.itemId
                          ? 'bg-green-500 hover:bg-green-600'
                          : ''
                      }`}
                    >
                      {useSuccess === item.itemId ? '✓ Used!' : `Use (${item.quantity} left)`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

