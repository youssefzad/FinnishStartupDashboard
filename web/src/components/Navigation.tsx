import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import './Navigation.css'

const Navigation = () => {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return
      
      ticking.current = true
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const isMobile = window.innerWidth <= 640

        if (!isMobile) {
          // Always show on desktop
          setIsScrolledDown(false)
          lastScrollY.current = currentScrollY
          ticking.current = false
          return
        }

        // On mobile: show when at top or scrolling up, hide when scrolling down
        const scrollDifference = currentScrollY - lastScrollY.current
        
        // Priority 1: Always show if at or near top (within 100px)
        if (currentScrollY <= 100) {
          setIsScrolledDown(false)
        }
        // Priority 2: Always show if scrolling up (any amount)
        else if (scrollDifference < 0) {
          setIsScrolledDown(false)
        }
        // Priority 3: Hide only if scrolling down significantly (more than 10px) and past 150px
        else if (scrollDifference > 10 && currentScrollY > 150) {
          setIsScrolledDown(true)
        }
        // Priority 4: If we're hidden and user stops scrolling, check if we should show
        else if (isScrolledDown && Math.abs(scrollDifference) < 2) {
          // If stopped scrolling and near top, show nav
          if (currentScrollY < 200) {
            setIsScrolledDown(false)
          }
        }

        lastScrollY.current = currentScrollY
        ticking.current = false
      })
    }

    // Initial check
    handleScroll()
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isScrolledDown])

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className={`main-navigation ${isScrolledDown ? 'scrolled-down' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img 
            src={theme === 'light' ? "/fsc-logo-black.svg" : "/fsc-logo-white.svg"} 
            alt="FSC" 
            className="nav-logo-img" 
          />
        </Link>
        <div className="nav-actions-mobile">
          <button 
            className="theme-toggle-button theme-toggle-mobile"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <button
            ref={buttonRef}
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
        <div 
          id="mobile-menu"
          ref={menuRef}
          className={`nav-links ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
        >
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Front Page
          </Link>
          <Link 
            to="/explore" 
            className={`nav-link ${isActive('/explore') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Data
          </Link>
          <Link 
            to="/publications" 
            className={`nav-link ${isActive('/publications') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Publications
          </Link>
          <a 
            href="https://startupyhteiso.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link nav-link-external"
            onClick={handleLinkClick}
          >
            FSC Homepage
            <span className="external-icon">↗</span>
          </a>
          <button 
            className="theme-toggle-button theme-toggle-desktop"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
        {isMobileMenuOpen && <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} />}
      </div>
    </nav>
  )
}

export default Navigation

