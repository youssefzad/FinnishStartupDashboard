import { useEffect, useState } from 'react'
import './FSCDebugBadge.css'

const FSCDebugBadge = () => {
  const [dimensions, setDimensions] = useState({
    headerHeight: '0px',
    heroMinHeight: '0px'
  })

  useEffect(() => {
    const updateDimensions = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      const isMobile = window.innerWidth <= 768
      const headerVar = isMobile 
        ? '--fsc-header-height-mobile' 
        : '--fsc-header-height-desktop'
      const heroVar = isMobile
        ? '--fsc-hero-min-height-mobile'
        : '--fsc-hero-min-height-desktop'
      
      setDimensions({
        headerHeight: computedStyle.getPropertyValue(headerVar).trim() || 'N/A',
        heroMinHeight: computedStyle.getPropertyValue(heroVar).trim() || 'N/A'
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  return (
    <div className="fsc-debug-badge">
      <div className="fsc-debug-label">FSC Debug</div>
      <div className="fsc-debug-value">Header: {dimensions.headerHeight}</div>
      <div className="fsc-debug-value">Hero: {dimensions.heroMinHeight}</div>
    </div>
  )
}

export default FSCDebugBadge

