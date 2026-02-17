import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import ChartById from './ChartById'
import { isValidChartId, getAllChartIds, chartRegistry } from '../config/chartRegistry'
import './ChartEmbedPage.css'

function ChartEmbedContent() {
  const { chartId } = useParams<{ chartId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme: contextTheme, toggleTheme } = useTheme()
  const [debugInfo, setDebugInfo] = useState<{ chartId: string; filter: string; columnUsed: string } | null>(null)
  const showDebug = searchParams.get('fscDebug') === '1'

  // Get theme from URL param or use context
  const themeParam = searchParams.get('theme')
  const effectiveTheme = themeParam === 'light' || themeParam === 'dark' 
    ? themeParam 
    : themeParam === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : contextTheme

  // Apply theme temporarily for embed (don't persist)
  useEffect(() => {
    if (themeParam && themeParam !== 'system') {
      document.documentElement.setAttribute('data-theme', themeParam)
    }
  }, [themeParam])

  // PostMessage height updates to parent with throttling
  useEffect(() => {
    if (!containerRef.current || !chartId) return

    let lastSentHeight = 0
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null
    const THROTTLE_MS = 100 // Max 10 messages per second
    let resizeObserver: ResizeObserver | null = null
    let isPaused = false

    const measureHeight = (): number => {
      if (!containerRef.current) return 0
      
      // Measure height using max of multiple sources
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        containerRef.current.scrollHeight
      )
      
      return docHeight
    }

    const sendHeight = () => {
      if (!containerRef.current || !chartId || isPaused) return

      const height = measureHeight()
      
      // Only send if height changed significantly (avoid noise)
      if (Math.abs(height - lastSentHeight) < 2) return
      
      lastSentHeight = height

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'FSC_CHART_HEIGHT',
          chartId,
          height
        }, '*')
      }
    }

    const throttledSendHeight = () => {
      if (throttleTimeout || isPaused) return
      
      throttleTimeout = setTimeout(() => {
        sendHeight()
        throttleTimeout = null
      }, THROTTLE_MS)
    }

    // Pause/resume based on modal state
    const checkModalState = () => {
      const modalOpen = document.querySelector('.embed-modal-overlay') !== null
      if (modalOpen && !isPaused) {
        // Pause: disconnect observers
        isPaused = true
        if (resizeObserver) {
          resizeObserver.disconnect()
        }
      } else if (!modalOpen && isPaused) {
        // Resume: reconnect observers
        isPaused = false
        if (resizeObserver && containerRef.current) {
          resizeObserver.observe(containerRef.current)
          // Don't observe body/documentElement to avoid jittering
        }
        // Send current height after resuming
        setTimeout(() => sendHeight(), 100)
      }
    }

    // Send initial height after render (use double RAF for fonts/images)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => sendHeight(), 0)
      })
    })

    // Use ResizeObserver for height changes - only observe container, not body/documentElement
    resizeObserver = new ResizeObserver(() => {
      throttledSendHeight()
    })

    resizeObserver.observe(containerRef.current)
    // Don't observe body/documentElement - they cause jittering when modal opens

    // Check modal state periodically
    const modalCheckInterval = setInterval(checkModalState, 100)

    // Listen to window resize as fallback
    const handleResize = () => {
      throttledSendHeight()
    }
    window.addEventListener('resize', handleResize)

    // Send height on window load (fonts/images loaded)
    const handleLoad = () => {
      setTimeout(() => sendHeight(), 100)
    }
    window.addEventListener('load', handleLoad)

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      clearInterval(modalCheckInterval)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('load', handleLoad)
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [chartId])

  if (!chartId || !isValidChartId(chartId)) {
    const allChartIds = getAllChartIds()
    const getEmbedUrl = (id: ChartId) => {
      const baseUrl = typeof window !== 'undefined' && import.meta.env.VITE_PUBLIC_BASE_URL
        ? import.meta.env.VITE_PUBLIC_BASE_URL
        : typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
      return `${baseUrl}/embed/${id}`
    }

    const copyEmbedUrl = async (id: ChartId) => {
      const url = getEmbedUrl(id)
      try {
        await navigator.clipboard.writeText(url)
        // Visual feedback could be added here
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }

    return (
      <div className="chart-embed-container">
        <div className="chart-embed-error">
          <h2>Chart Not Found</h2>
          <p>Invalid chart ID: <code>{chartId || 'undefined'}</code></p>
          <p>Available chart IDs:</p>
          <ul className="chart-id-list">
            {allChartIds.map(id => (
              <li key={id} className="chart-id-item">
                <code className="chart-id-code">{id}</code>
                <span className="chart-id-title"> - {chartRegistry[id].title}</span>
                <button 
                  className="chart-id-copy-button"
                  onClick={() => copyEmbedUrl(id)}
                  title="Copy embed URL"
                >
                  Copy URL
                </button>
              </li>
            ))}
          </ul>
          <p className="chart-embed-help-link">
            <a href="/embed-help" target="_blank" rel="noopener noreferrer">
              View embedding documentation →
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Extract params from URL
  const params: Record<string, string> = {}
  const filter = searchParams.get('filter')
  if (filter) params.filter = filter
  const view = searchParams.get('view')
  if (view) params.view = view
  if (searchParams.get('showMaleBar') !== null) params.showMaleBar = searchParams.get('showMaleBar') || 'true'
  if (searchParams.get('showFemaleBar') !== null) params.showFemaleBar = searchParams.get('showFemaleBar') || 'true'
  if (searchParams.get('showFinnishBar') !== null) params.showFinnishBar = searchParams.get('showFinnishBar') || 'true'
  if (searchParams.get('showForeignBar') !== null) params.showForeignBar = searchParams.get('showForeignBar') || 'true'
  if (themeParam) params.theme = effectiveTheme

  const showTitle = searchParams.get('showTitle') !== '0' // Default true if param missing
  const showSource = searchParams.get('showSource') !== '0'
  const compact = searchParams.get('compact') === '1'

  // Get title from registry (fallback to chartId if registry entry missing)
  const chartTitle = chartId && isValidChartId(chartId) 
    ? chartRegistry[chartId].title 
    : chartId || 'Chart'

  // Handle filter changes by updating URL params
  const handleFilterChange = (newFilter: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (newFilter === 'all') {
      newParams.delete('filter') // Remove filter param for 'all'
    } else {
      newParams.set('filter', newFilter)
    }
    // Preserve other params (theme, showTitle, showSource, compact, fscDebug)
    navigate(`/embed/${chartId}?${newParams.toString()}`, { replace: true })
  }

  // Handle view changes (for bar charts with share views)
  const handleViewChange = (newView: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (newView === 'none') {
      newParams.delete('view')
    } else {
      newParams.set('view', newView)
    }
    navigate(`/embed/${chartId}?${newParams.toString()}`, { replace: true })
  }

  // Handle toggle bar visibility (for bar charts)
  const handleToggleBar = (bar: 'male' | 'female' | 'finnish' | 'foreign', visible: boolean) => {
    const newParams = new URLSearchParams(searchParams)
    const paramName = bar === 'male' ? 'showMaleBar' : 
                     bar === 'female' ? 'showFemaleBar' :
                     bar === 'finnish' ? 'showFinnishBar' : 'showForeignBar'
    if (visible) {
      newParams.set(paramName, 'true')
    } else {
      newParams.set(paramName, 'false')
    }
    navigate(`/embed/${chartId}?${newParams.toString()}`, { replace: true })
  }

  return (
    <div 
      ref={containerRef}
      className={`chart-embed-container ${compact ? 'compact' : ''}`}
    >
      {showTitle && chartId && isValidChartId(chartId) && (
        <div className="chart-embed-header">
          <h2 className="chart-embed-title">{chartTitle}</h2>
        </div>
      )}
      <div className="chart-embed-content">
        <ChartById 
          chartId={chartId} 
          params={params}
          embedMode={true}
          onFilterChange={handleFilterChange}
          onViewChange={handleViewChange}
          onToggleBar={handleToggleBar}
          onDebugInfo={showDebug ? setDebugInfo : undefined}
        />
      </div>
      {showDebug && debugInfo && (
        <div className="chart-embed-debug">
          <small>
            chartId={debugInfo.chartId} | filter={debugInfo.filter} | columnUsed={debugInfo.columnUsed}
          </small>
        </div>
      )}
      {showSource && (
        <div className="chart-embed-footer">
          <p className="chart-embed-source">
            Source: <a href="https://startupyhteiso.com" target="_blank" rel="noopener noreferrer">Finnish Startup Community</a>
          </p>
        </div>
      )}
    </div>
  )
}

export default function ChartEmbedPage() {
  return (
    <ThemeProvider>
      <ChartEmbedContent />
    </ThemeProvider>
  )
}

