import { useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning' | 'achievement'
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || 3000)
    
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700'
      case 'error':
        return 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700'
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600 border-yellow-600 dark:border-yellow-700'
      case 'achievement':
        return 'bg-gradient-to-r from-gold to-gold-light border-gold-dark animate-pulse-gold'
      default:
        return 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'achievement':
        return '🎉'
      default:
        return 'ℹ'
    }
  }

  return (
    <div
      className={`${getToastStyles()} text-white border-2 rounded-lg shadow-xl p-4 mb-3 flex items-center justify-between min-w-[300px] max-w-[500px] animate-slide-up transform transition-all duration-300`}
      style={{ animationDelay: '0s' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <p className="font-semibold">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-4 hover:bg-white/20 rounded-full p-1 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

