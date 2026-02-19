import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { getStartupMetrics, type StartupMetrics } from '../utils/dataLoader'
import './LandingPage.css'

// Custom hook for number counter animation
const useCounter = (targetValue: string, duration: number = 2000) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Parse the target value
    const parseValue = (value: string): { num: number; suffix: string; prefix: string; multiplier: number } => {
      const trimmed = value.trim()
      let prefix = ''
      let suffix = ''
      let numStr = trimmed
      let multiplier = 1

      // Extract prefix (€)
      if (trimmed.startsWith('€')) {
        prefix = '€'
        numStr = trimmed.slice(1)
      }

      // Extract suffix (B, K, M) and set multiplier
      if (numStr.endsWith('B')) {
        suffix = 'B'
        numStr = numStr.slice(0, -1)
        multiplier = 1000000000 // 1 billion
      } else if (numStr.endsWith('M')) {
        suffix = 'M'
        numStr = numStr.slice(0, -1)
        multiplier = 1000000 // 1 million
      } else if (numStr.endsWith('K')) {
        suffix = 'K'
        numStr = numStr.slice(0, -1)
        multiplier = 1000 // 1 thousand
      }

      // Remove commas and parse
      numStr = numStr.replace(/,/g, '')
      const num = parseFloat(numStr) || 0

      return { num, suffix, prefix, multiplier }
    }

    const { num: targetNum } = parseValue(targetValue)
    
    if (targetNum === 0) {
      setCount(0)
      return
    }

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (targetNum - startValue) * easeOut
      
      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(targetNum)
      }
    }

    requestAnimationFrame(animate)
  }, [targetValue, duration])

  // Parse target value to get format info
  const parseFormat = (value: string): { suffix: string; prefix: string } => {
    const trimmed = value.trim()
    let prefix = ''
    let suffix = ''
    let numStr = trimmed

    if (trimmed.startsWith('€')) {
      prefix = '€'
      numStr = trimmed.slice(1)
    }

    if (numStr.endsWith('B')) {
      suffix = 'B'
    } else if (numStr.endsWith('M')) {
      suffix = 'M'
    } else if (numStr.endsWith('K')) {
      suffix = 'K'
    }

    return { suffix, prefix }
  }

  const { suffix, prefix } = parseFormat(targetValue)

  // Format the number with suffix and prefix
  const formatValue = (value: number): string => {
    let formatted: string
    
    if (suffix === 'B') {
      // For billions, show 2 decimal places
      formatted = value.toFixed(2)
      // Remove trailing zeros
      formatted = parseFloat(formatted).toFixed(2)
    } else if (suffix === 'M') {
      // For millions, check if it's a whole number - if so, show no decimals
      const rounded = Math.round(value)
      if (rounded === value) {
        // Whole number - no decimals
        formatted = rounded.toString()
      } else {
        // Has decimals - show 2 decimal places
        formatted = value.toFixed(2)
        formatted = parseFloat(formatted).toFixed(2)
      }
    } else if (suffix === 'K') {
      // For thousands, round to nearest integer
      formatted = Math.round(value).toString()
    } else {
      // For plain numbers, add commas
      formatted = Math.round(value).toLocaleString()
    }

    return `${prefix}${formatted}${suffix}`
  }

  return formatValue(count)
}

// Metric Card Component with animated counter
const MetricCard = ({ label, value, trend, description, showTrend = true }: { 
  label: string
  value: string
  trend: string
  description: string
  showTrend?: boolean
}) => {
  const animatedValue = useCounter(value, 2000)

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {showTrend && trend && (
          <span className="metric-trend positive">{trend}</span>
        )}
      </div>
      <div className="metric-value">{animatedValue}</div>
      <div className="metric-description">{description}</div>
    </div>
  )
}

const LandingPage = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [waveTime, setWaveTime] = useState(0)
  const [metrics, setMetrics] = useState<StartupMetrics | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)

  // Animate the wave curve
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveTime(prev => prev + 0.05)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoadingMetrics(true)
      try {
        // Import test function for debugging
        const { testGoogleSheetsConnection } = await import('../utils/testDataConnection')
        const testResult = await testGoogleSheetsConnection()
        console.log('Google Sheets connection test:', testResult)
        
        const data = await getStartupMetrics()
        console.log('Metrics data loaded:', data)
        setMetrics(data)
      } catch (error) {
        console.error('Error loading metrics:', error)
      } finally {
        setIsLoadingMetrics(false)
      }
    }
    loadMetrics()
  }, [])


  function generateExponentialPath(time: number, includeArea: boolean): string {
    // Exponential growth curve with variable growth rates
    // Starts slow, accelerates exponentially, with some sections growing faster
    const baseY = 580
    const endY = 5
    const width = 2800 // Total width from -200 to 2600
    
    // Generate points using exponential function with variable growth rates
    const numPoints = 20
    const points: { x: number; y: number }[] = []
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints // 0 to 1
      const x = -200 + t * width
      
      // Exponential growth: starts at baseY, ends near endY
      // Using exponential function: y = baseY * (endY/baseY)^t
      // But with variable growth rates at different sections
      let growthRate = 1.0
      
      // Variable growth rates - some sections grow faster
      if (t < 0.2) {
        growthRate = 0.3 + Math.sin(time * 0.5) * 0.1 // Slow start with gentle movement
      } else if (t < 0.4) {
        growthRate = 0.6 + Math.sin(time * 0.8) * 0.15 // Picking up speed
      } else if (t < 0.6) {
        growthRate = 1.2 + Math.sin(time * 1.2) * 0.2 // Faster growth
      } else if (t < 0.8) {
        growthRate = 2.0 + Math.sin(time * 1.8) * 0.3 // Much faster (exponential acceleration)
      } else {
        growthRate = 3.5 + Math.sin(time * 2.5) * 0.4 // Very fast (steep exponential)
      }
      
      // Calculate exponential curve with variable rates
      const exponentialFactor = Math.pow(endY / baseY, t * growthRate)
      let y = baseY * exponentialFactor
      
      // Add dynamic wave movement that increases with time (more movement in faster sections)
      const waveAmplitude = (1 - t) * 8 + t * 20 // More movement at the end
      const waveFrequency = 0.5 + t * 3.5 // Faster waves at the end
      y += Math.sin(time * waveFrequency) * waveAmplitude
      
      // Add secondary wave for more complex movement
      y += Math.cos(time * waveFrequency * 1.3 + t * 2) * (waveAmplitude * 0.5)
      
      points.push({ x, y })
    }
    
    // Build smooth path using cubic Bezier curves for natural exponential flow
    let path = `M ${points[0].x},${points[0].y} `
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      
      if (i === 1) {
        // First curve: use control point to create smooth start
        const cp1x = prev.x + (curr.x - prev.x) * 0.3
        const cp1y = prev.y
        const cp2x = prev.x + (curr.x - prev.x) * 0.7
        const cp2y = curr.y
        path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y} `
      } else {
        // Use smooth curves for exponential flow
        const prevPrev = points[i - 2]
        const cp1x = prev.x + (curr.x - prevPrev.x) * 0.15
        const cp1y = prev.y
        const cp2x = prev.x + (curr.x - prev.x) * 0.85
        const cp2y = curr.y
        path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y} `
      }
    }
    
    if (includeArea) {
      path += `L ${points[points.length - 1].x},600 L ${points[0].x},600 Z`
    }
    
    return path
  }

  return (
    <div className="landing-page">
      {/* Hero Section - Clean, minimal design with centered content and subtle background */}
      <section className="hero">
        {/* Subtle animated background wave - positioned to not interfere with text */}
        <div className="hero-bg-chart">
          <svg 
            viewBox="0 0 2400 600" 
            preserveAspectRatio="none"
            className="bg-chart-svg"
            aria-hidden="true"
          >
            <defs>
              {/* Subtle area gradient with reduced opacity */}
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.06" />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
              </linearGradient>
              {/* Edge fades for seamless blending - theme aware */}
              <linearGradient id="leftFade" x1="0%" y1="0%" x2="20%" y2="0%">
                <stop offset="0%" stopColor={theme === 'light' ? '#ffffff' : '#000000'} stopOpacity="1" />
                <stop offset="100%" stopColor={theme === 'light' ? '#ffffff' : '#000000'} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="rightFade" x1="80%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme === 'light' ? '#ffffff' : '#000000'} stopOpacity="0" />
                <stop offset="100%" stopColor={theme === 'light' ? '#ffffff' : '#000000'} stopOpacity="1" />
              </linearGradient>
              {/* Subtle line gradient */}
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Subtle area fill */}
            <path
              d={generateExponentialPath(waveTime, true)}
              fill="url(#chartGradient)"
              className="bg-chart-area"
            />
            {/* Subtle line */}
            <path
              d={generateExponentialPath(waveTime, false)}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              className="bg-chart-line"
              strokeLinecap="round"
            />
            {/* Edge fades */}
            <rect x="0" y="0" width="480" height="600" fill="url(#leftFade)" />
            <rect x="1920" y="0" width="480" height="600" fill="url(#rightFade)" />
          </svg>
        </div>
        
        {/* Hero content: centered, max-width constrained, clean typography */}
        <div className="hero-content">
          <div className="hero-logo">
            <img 
              src={theme === 'light' ? "/fsc-logo-black.svg" : "/fsc-logo-white.svg"} 
              alt="Finnish Startup Community" 
              className="fsc-logo-img" 
            />
          </div>
          
          <h1 className="hero-headline">
            Finnish Startup Ecosystem
          </h1>
          
          <p className="hero-subheadline">
            Discover insights, track growth, and explore the data behind Finland's thriving startup community
          </p>
          
          <div className="hero-cta">
            <button className="cta-button primary" onClick={() => navigate('/explore')}>
              Explore Data
            </button>
            <button className="cta-button secondary">
              Learn More
            </button>
          </div>

          {/* Key Metrics */}
          <div className="hero-metrics">
            <h2 className="metrics-title">Key Metrics</h2>
            {isLoadingMetrics ? (
              <div className="metric-cards-wrapper">
                <div className="metric-cards">
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-label">Loading...</span>
                    </div>
                    <div className="metric-value">-</div>
                  </div>
                </div>
              </div>
            ) : metrics ? (
              <div className="metric-cards-wrapper">
                <div className="metric-cards">
                  <MetricCard
                    label="Startups"
                    value={metrics.firms.formattedValue}
                    trend={`${metrics.firms.growth >= 0 ? '+' : ''}${metrics.firms.growth.toFixed(1)}%`}
                    description={String(metrics.firms.year)}
                  />
                  <MetricCard
                    label="Revenue"
                    value={metrics.revenue.formattedValue}
                    trend={`${metrics.revenue.growth >= 0 ? '+' : ''}${metrics.revenue.growth.toFixed(1)}%`}
                    description={String(metrics.revenue.year)}
                  />
                  <MetricCard
                    label="Employees"
                    value={metrics.employees.formattedValue}
                    trend={`${metrics.employees.growth >= 0 ? '+' : ''}${metrics.employees.growth.toFixed(1)}%`}
                    description={String(metrics.employees.year)}
                  />
                  <MetricCard
                    label="R&D-INVESTMENTS"
                    value={metrics.rdi.formattedValue}
                    trend={`${metrics.rdi.growth >= 0 ? '+' : ''}${metrics.rdi.growth.toFixed(1)}%`}
                    description={String(metrics.rdi.year)}
                  />
                  <MetricCard
                    label="Unicorns"
                    value={metrics.unicorns.formattedValue}
                    trend=""
                    description={String(metrics.unicorns.year)}
                    showTrend={false}
                  />
                </div>
              </div>
            ) : (
              <div className="metric-cards-wrapper">
                <div className="metric-cards">
                  <div className="metric-card">
                    <div className="metric-header">
                      <span className="metric-label">Data unavailable</span>
                    </div>
                    <div className="metric-value">-</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage

