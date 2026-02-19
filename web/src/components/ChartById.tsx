import { useState, useEffect } from 'react'
import { loadAllTabsData } from '../utils/dataLoader'
import { chartRegistry, type ChartId, isValidChartId } from '../config/chartRegistry'
import GraphTemplate from './GraphTemplate'
import BarChartTemplate from './BarChartTemplate'
import UnicornsValuationChart from './UnicornsValuationChart'

interface ChartByIdProps {
  chartId: ChartId
  params?: Record<string, string>
  embedMode?: boolean
  onConfigReady?: (config: any) => void
  onFilterChange?: (value: string) => void
  onViewChange?: (view: string) => void
  onToggleBar?: (bar: 'male' | 'female' | 'finnish' | 'foreign', visible: boolean) => void
  onDebugInfo?: (info: { chartId: string; filter: string; columnUsed: string }) => void
  theme?: 'light' | 'dark' // Explicit theme prop for embed mode
}

export default function ChartById({ chartId, params = {}, embedMode = false, onConfigReady, onFilterChange, onViewChange, onToggleBar, onDebugInfo, theme }: ChartByIdProps) {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
  // Sync filterValue with params.filter (for URL param changes)
  const filterValue = params.filter || 'all'

  // Handle window resize for responsive charts
  useEffect(() => {
    if (chartId === 'unicorns-valuation') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [chartId])

  useEffect(() => {
    if (!isValidChartId(chartId)) {
      setError(`Invalid chart ID: ${chartId}`)
      setLoading(false)
      return
    }

    const entry = chartRegistry[chartId]
    if (!entry) {
      setError(`Chart not found: ${chartId}`)
      setLoading(false)
      return
    }

    // Load data - for now we load all tabs (acceptable for embed use case)
    // TODO: Optimize to load only needed dataset if performance becomes an issue
    loadAllTabsData().then(({ main, employeesGender, rdi, barometer, unicorns }) => {
      let data: any[] = []
      switch (entry.dataKey) {
        case 'main':
          data = main
          break
        case 'employeesGender':
          data = employeesGender
          break
        case 'rdi':
          data = rdi
          break
        case 'barometer':
          data = barometer
          break
        case 'unicorns':
          data = unicorns
          break
      }

      if (data.length === 0) {
        setError(`No data available for chart: ${chartId}`)
        setLoading(false)
        return
      }

      // Get window width for responsive behavior
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200

      // Build config with params
      // Use explicit theme prop if provided (for embeds), otherwise use params.theme or default
      const effectiveTheme = theme || params.theme || 'dark'
      const builtConfig = entry.buildConfig(data, {
        ...params,
        windowWidth,
        theme: effectiveTheme,
        filter: params.filter || 'all',
        view: params.view || 'none',
        showMaleBar: params.showMaleBar !== 'false',
        showFemaleBar: params.showFemaleBar !== 'false',
        showFinnishBar: params.showFinnishBar !== 'false',
        showForeignBar: params.showForeignBar !== 'false',
        onShowTable: embedMode ? undefined : () => {},
        onFullscreen: embedMode ? undefined : () => {},
        showTable: false,
        // Pass callbacks for embed mode URL updates
        onViewChange: embedMode ? onViewChange : undefined,
        onToggleBar: embedMode ? onToggleBar : undefined,
        onFilterChange: embedMode ? onFilterChange : undefined
      })

      if (!builtConfig) {
        setError(`Failed to build config for chart: ${chartId}`)
        setLoading(false)
        return
      }

      setConfig(builtConfig)
      if (onConfigReady) {
        onConfigReady(builtConfig)
      }
      // Expose debug info if callback provided
      if (onDebugInfo && builtConfig?._debug) {
        onDebugInfo({
          chartId,
          filter: params.filter || 'all',
          columnUsed: builtConfig._debug.columnUsed || 'unknown'
        })
      }
      setLoading(false)
    }).catch(err => {
      console.error('Error loading chart data:', err)
      setError(`Error loading data: ${err.message}`)
      setLoading(false)
    })
  }, [chartId, params.filter, params.view, params.theme, params.showMaleBar, params.showFemaleBar, params.showFinnishBar, params.showForeignBar, embedMode, onConfigReady])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        <p>Loading chart...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 0, 0, 0.7)' }}>
        <p>{error}</p>
        {!isValidChartId(chartId) && (
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <p>Valid chart IDs:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {Object.keys(chartRegistry).map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (!config) {
    return null
  }

  const entry = chartRegistry[chartId]

  // Get effective theme for passing to templates (ensure it's 'light' | 'dark')
  const effectiveTheme: 'light' | 'dark' = theme || (params.theme === 'light' || params.theme === 'dark' ? params.theme : 'dark')

  // Special handling for Unicorns chart - use dedicated component
  if (chartId === 'unicorns-valuation') {
    // Parse filter from params
    const unicornsFilter = (params.filter === 'finnish' || params.filter === 'finnish-background' ? params.filter : 'all') as 'all' | 'finnish' | 'finnish-background'

    return (
      <UnicornsValuationChart
        data={config?.data || []}
        filter={unicornsFilter}
        theme={effectiveTheme}
        onFilterChange={(newFilter) => {
          if (onFilterChange) {
            onFilterChange(newFilter)
          }
        }}
        windowWidth={windowWidth}
        showTitle={params.showTitle !== 'false'}
      />
    )
  }

  if (entry.kind === 'graph') {
    return (
      <GraphTemplate
        config={config}
        filterValue={filterValue}
        onFilterChange={(value) => {
          if (onFilterChange) {
            onFilterChange(value)
          }
        }}
        embedMode={embedMode}
        theme={embedMode ? effectiveTheme : undefined}
      />
    )
  } else {
    return (
      <BarChartTemplate
        config={config}
        filterValue={filterValue}
        onFilterChange={(value) => {
          if (onFilterChange) {
            onFilterChange(value)
          }
        }}
        embedMode={embedMode}
        theme={embedMode ? effectiveTheme : undefined}
      />
    )
  }
}

