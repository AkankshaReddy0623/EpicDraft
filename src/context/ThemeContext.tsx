import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'golden' | 'ocean' | 'forest'

interface ThemeContextType {
  theme: Theme
  customTheme: Theme | null
  toggleTheme: () => void
  setCustomTheme: (theme: Theme | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [baseTheme, setBaseTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) return savedTheme
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })
  
  const [customTheme, setCustomThemeState] = useState<Theme | null>(() => {
    const saved = localStorage.getItem('customTheme')
    return saved as Theme | null
  })

  const theme = customTheme || baseTheme

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'golden', 'ocean', 'forest')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', baseTheme)
    if (customTheme) {
      localStorage.setItem('customTheme', customTheme)
    } else {
      localStorage.removeItem('customTheme')
    }
  }, [theme, baseTheme, customTheme])

  const toggleTheme = () => {
    setBaseTheme(prev => prev === 'light' ? 'dark' : 'light')
    setCustomThemeState(null) // Clear custom theme when toggling
  }
  
  const setCustomTheme = (newTheme: Theme | null) => {
    setCustomThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, customTheme, toggleTheme, setCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

