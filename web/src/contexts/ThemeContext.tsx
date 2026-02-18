import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Check if we're on an embed route - embeds should NOT use localStorage
  const isEmbedRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/embed')
  
  const [theme, setTheme] = useState<Theme>(() => {
    // For embed routes, don't read from localStorage - let ChartEmbedPage control theme
    if (isEmbedRoute) {
      // Return current data-theme or default to dark
      const currentTheme = document.documentElement.getAttribute('data-theme')
      return (currentTheme === 'light' || currentTheme === 'dark') ? currentTheme : 'dark'
    }
    
    // For main site, check localStorage first for saved user preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      return savedTheme
    }
    // Default to dark mode for new users
    return 'dark'
  })

  useEffect(() => {
    // For embed routes, don't apply theme - ChartEmbedPage controls it
    if (isEmbedRoute) {
      return
    }
    
    // Apply theme to document (main site only)
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme, isEmbedRoute])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

