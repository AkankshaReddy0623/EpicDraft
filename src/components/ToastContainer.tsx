import React, { useState, useCallback } from 'react'
import ToastComponent, { Toast } from './Toast'

interface ToastContainerProps {
  children: React.ReactNode
}

export const ToastContext = React.createContext<{
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
}>({
  showToast: () => {},
})

export default function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration?: number
  ) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col items-end">
        {toasts.map(toast => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastContainer')
  }
  return context
}

