import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import ChartById from './ChartById'
import { isValidChartId, getAllChartIds, chartRegistry, type ChartId } from '../config/chartRegistry'
// Import global CSS to ensure theme variables are available
import '../App.css'
import '../styles/fsc-theme.css'
import './ChartEmbedPage.css'

function ChartEmbedContent() {
  const { chartId } = useParams<{ chartId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [debugInfo, setDebugInfo] = useState<{ chartId: string; filter: string; columnUsed: string } | null>(null)
  const showDebug = searchParams.get('fscDebug') === '1'

  // Embed theme resolution: single source of truth
  // theme=light|dark|system, default to dark for embeds
  const themeParam = searchParams.get('theme')
  const embedTheme: 'light' | 'dark' = 
    themeParam === 'light' || themeParam === 'dark'
      ? themeParam
      : themeParam === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : 'dark' // Default to dark for embeds when no theme param is provided

  // Apply theme to document AND container (ensures CSS variables resolve correctly)
  // This runs AFTER ThemeContext's useEffect to ensure embed theme takes precedence
  useEffect(() => {
    // Use a small delay to ensure this runs after ThemeContext's useEffect
    const timeoutId = setTimeout(() => {
      document.documentElement.setAttribute('data-theme', embedTheme)
      if (containerRef.current) {
        containerRef.current.setAttribute('data-theme', embedTheme)
      }
    }, 0)
    
    // Also set immediately to prevent flash
    document.documentElement.setAttribute('data-theme', embedTheme)
    if (containerRef.current) {
      containerRef.current.setAttribute('data-theme', embedTheme)
    }
    
    return () => clearTimeout(timeoutId)
  }, [embedTheme])

  // Robust PostMessage height updates for production embeds
  useEffect(() => {
    if (!containerRef.current || !chartId) return

    // Ensure chartId is exactly the route param (string, validated)
    const exactChartId: string = chartId

    let lastSentHeight = 0
    let rafId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let isPaused = false

    // Measure height from the single wrapper element that contains ALL content
    const measureHeight = (): number => {
      if (!containerRef.current) return 0
      
      // Use scrollHeight of the container (includes all content: title, chart, buttons, table, source)
      const height = containerRef.current.scrollHeight
      
      // Round to ensure it's an integer
      return Math.round(height)
    }

    // Send height message to parent iframe
    const sendHeight = () => {
      if (!containerRef.current || !exactChartId || isPaused) return

      const height = measureHeight()
      
      // Only send if height actually changed (avoid spam)
      if (height === lastSentHeight) return
      
      lastSentHeight = height

      // Only send if we're in an iframe
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'FSC_CHART_HEIGHT',
          chartId: exactChartId,
          height: height
        }, '*')
      }
    }

    // Throttle using requestAnimationFrame (more reliable than setTimeout)
    const throttledSendHeight = () => {
      if (rafId !== null || isPaused) return
      
      rafId = requestAnimationFrame(() => {
        sendHeight()
        rafId = null
      })
    }

    // Pause/resume based on modal state (embed modal should pause resizing)
    const checkModalState = () => {
      const modalOpen = document.querySelector('.embed-modal-overlay') !== null
      if (modalOpen && !isPaused) {
        // Pause: disconnect observers
        isPaused = true
        if (resizeObserver) {
          resizeObserver.disconnect()
        }
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      } else if (!modalOpen && isPaused) {
        // Resume: reconnect observers
        isPaused = false
        if (resizeObserver && containerRef.current) {
          resizeObserver.observe(containerRef.current)
        }
        // Send current height after resuming
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sendHeight()
          })
        })
      }
    }

    // Use ResizeObserver on the single wrapper element
    resizeObserver = new ResizeObserver(() => {
      throttledSendHeight()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Check modal state periodically
    const modalCheckInterval = setInterval(checkModalState, 100)

    // Send initial height after first paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sendHeight()
      })
    })

    // Send height after fonts load (critical for production where fonts load async)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sendHeight()
          })
        })
      }).catch(() => {
        // Fallback if fonts.ready fails
        setTimeout(() => sendHeight(), 500)
      })
    } else {
      // Fallback for browsers without document.fonts.ready
      setTimeout(() => sendHeight(), 500)
    }

    // Listen to window resize as fallback
    const handleResize = () => {
      throttledSendHeight()
    }
    window.addEventListener('resize', handleResize)

    // Send height on window load (images and other resources)
    const handleLoad = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sendHeight()
        })
      })
    }
    window.addEventListener('load', handleLoad)

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      clearInterval(modalCheckInterval)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('load', handleLoad)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
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
  // Always pass theme to ChartById (single source of truth)
  params.theme = embedTheme

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
      data-theme={embedTheme}
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
          theme={embedTheme}
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
  // Don't wrap in ThemeProvider - we're already wrapped by App's ThemeProvider
  // ChartEmbedContent handles its own theme via URL params and sets data-theme directly
  return <ChartEmbedContent />
}

