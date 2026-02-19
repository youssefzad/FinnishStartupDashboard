import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import EmbedModal from './EmbedModal'
import type { ChartId } from '../config/chartRegistry'
import './UnicornsValuationChart.css'

// Unicorn data row interface
interface UnicornRow {
  firm: string
  valuation: number
  isFinnish: boolean
  isFinnishBackground: boolean
}

interface UnicornsValuationChartProps {
  data: any[] // Raw unicorns data from dataLoader
  filter?: 'all' | 'finnish' | 'finnish-background'
  theme?: 'light' | 'dark'
  onFilterChange?: (filter: 'all' | 'finnish' | 'finnish-background') => void
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
  chartId?: ChartId
  showTitle?: boolean
  windowWidth?: number
  fullscreenMode?: boolean // If true, hide filters and action buttons (for fullscreen view)
}

// Normalize unicorns data
function normalizeUnicornData(data: any[]): UnicornRow[] {
  return data
    .map(row => {
      const firm = row['Firm'] || row['firm'] || ''
      const valuation = row['Last valuation'] || row['Last valuation'] || row['lastValuation'] || row['valuation'] || null
      const isFinnish = row['Finnish'] === true || row['Finnish'] === 1 || row['finnish'] === true || row['finnish'] === 1
      const isFinnishBackground = row['Finnish background'] === true || row['Finnish background'] === 1 || 
                                   row['Finnish background'] === true || row['Finnish background'] === 1 ||
                                   row['finnishBackground'] === true || row['finnishBackground'] === 1

      if (!firm || valuation === null || valuation === undefined || isNaN(Number(valuation))) {
        return null
      }

      return {
        firm: String(firm).trim(),
        valuation: typeof valuation === 'number' ? valuation : parseFloat(String(valuation)),
        isFinnish: Boolean(isFinnish),
        isFinnishBackground: Boolean(isFinnishBackground)
      }
    })
    .filter((row): row is UnicornRow => row !== null)
    .sort((a, b) => b.valuation - a.valuation) // Sort descending by valuation
}

// Format valuation for display
function formatValuation(value: number): string {
  if (value >= 1000000000) {
    const billions = value / 1000000000
    return `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`
  } else if (value >= 1000000) {
    const millions = value / 1000000
    return `€${millions.toFixed(millions >= 10 ? 1 : 2)}M`
  } else if (value >= 1000) {
    const thousands = value / 1000
    return `€${thousands.toFixed(1)}K`
  }
  return `€${value.toLocaleString()}`
}

// Truncate firm name for axis labels
function truncateFirmName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength - 3) + '...'
}

const UnicornsValuationChart: React.FC<UnicornsValuationChartProps> = ({
  data,
  filter = 'all',
  theme,
  onFilterChange,
  onShowTable,
  onFullscreen,
  showTable = false,
  chartId,
  showTitle = true,
  windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
  fullscreenMode = false
}) => {
  const [localFilter, setLocalFilter] = useState<'all' | 'finnish' | 'finnish-background'>(filter)
  const [currentWindowWidth, setCurrentWindowWidth] = useState<number>(windowWidth)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  
  // Theme state - initialized from document and updated via MutationObserver
  const getInitialTheme = (): 'light' | 'dark' => {
    // If theme prop is provided, use it
    if (theme) return theme
    // Otherwise, read from document
    if (typeof document !== 'undefined') {
      const themeAttr = document.documentElement.getAttribute('data-theme')
      return themeAttr === 'light' ? 'light' : 'dark'
    }
    return 'dark'
  }
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getInitialTheme)

  // Sync with props
  useEffect(() => {
    setLocalFilter(filter)
  }, [filter])

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setCurrentWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Watch for theme changes via MutationObserver (only if theme prop is not provided)
  useEffect(() => {
    if (typeof document === 'undefined') return

    // If theme prop is provided, use it directly and don't watch document
    if (theme) {
      setCurrentTheme(theme)
      return
    }

    // Create MutationObserver to watch for data-theme attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const themeAttr = document.documentElement.getAttribute('data-theme')
          const newTheme = themeAttr === 'light' ? 'light' : 'dark'
          setCurrentTheme(newTheme)
        }
      })
    })

    // Observe changes to the data-theme attribute on the html element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    // Cleanup observer on unmount
    return () => {
      observer.disconnect()
    }
  }, [theme]) // Re-run if theme prop changes

  // Use current window width or prop
  const effectiveWindowWidth = currentWindowWidth || windowWidth

  // Use state-based theme (not reading from document directly during render)
  const effectiveTheme: 'light' | 'dark' = theme || currentTheme

  // Normalize and filter data
  const normalizedData = normalizeUnicornData(data)
  
  if (normalizedData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: effectiveTheme === 'light' ? '#1a1a1a' : '#ffffff' }}>
        No unicorn data available.
      </div>
    )
  }

  // Apply filter
  let filteredData = normalizedData
  if (localFilter === 'finnish') {
    filteredData = normalizedData.filter(row => row.isFinnish === true)
  } else if (localFilter === 'finnish-background') {
    filteredData = normalizedData.filter(row => row.isFinnishBackground === true)
  }

  // Use all filtered data (no Top N limit)
  const chartData = filteredData

  // Convert to chart format
  const barChartData = chartData.map(row => ({
    name: row.firm,
    value: row.valuation,
    isFinnish: row.isFinnish,
    isFinnishBackground: row.isFinnishBackground
  }))

  // Determine layout
  const isMobile = effectiveWindowWidth <= 768
  const isDesktop = effectiveWindowWidth > 900
  const isHorizontalBars = isMobile

  // Chart colors based on theme - optimized for light mode readability
  const isLight = effectiveTheme === 'light'
  const chartColors = {
    grid: isLight ? 'rgba(26, 26, 26, 0.12)' : 'rgba(255, 255, 255, 0.1)',
    axis: isLight ? 'rgba(26, 26, 26, 0.35)' : 'rgba(255, 255, 255, 0.5)',
    tick: isLight ? 'rgba(26, 26, 26, 0.85)' : 'rgba(255, 255, 255, 0.7)',
    tooltipBg: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(17, 17, 17, 0.95)',
    tooltipText: isLight ? 'rgba(26, 26, 26, 0.95)' : '#ffffff',
    tooltipBorder: isLight ? 'rgba(26, 26, 26, 0.15)' : 'rgba(255, 255, 255, 0.15)'
  }

  // Handle filter change
  const handleFilterChange = (newFilter: 'all' | 'finnish' | 'finnish-background') => {
    setLocalFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  // Calculate chart height based on layout
  const getChartHeight = () => {
    if (isHorizontalBars) {
      // Horizontal bars: need height for all items
      // Each bar needs ~30-32px on mobile, add padding for margins (top/bottom) and axis labels (X-axis at bottom)
      // Ensure enough space so no items are clipped - be generous with padding
      const itemHeight = effectiveWindowWidth <= 640 ? 30 : 32
      const basePadding = effectiveWindowWidth <= 640 ? 160 : 170 // Top margin + bottom margin + X-axis labels
      const calculatedHeight = barChartData.length * itemHeight + basePadding
      // Ensure minimum height but allow growth for all items
      return Math.max(350, calculatedHeight)
    }
    // Desktop vertical bars: fixed height
    return isDesktop ? 360 : 400
  }

  return (
    <div className="unicorns-chart-container">
      {showTitle && !fullscreenMode && (
        <h3 className="chart-card-title" style={{ marginBottom: '1.5rem' }}>Unicorn Valuations</h3>
      )}
      
      {/* Filter buttons - hidden in fullscreen mode */}
      {!fullscreenMode && (
        <div className="chart-filters" style={{ marginBottom: '1rem' }}>
        <button
          className={`filter-button ${localFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <span className="filter-label">All</span>
        </button>
        <button
          className={`filter-button ${localFilter === 'finnish' ? 'active' : ''}`}
          onClick={() => handleFilterChange('finnish')}
        >
          <span className="filter-label">Founded in Finland</span>
        </button>
        <button
          className={`filter-button ${localFilter === 'finnish-background' ? 'active' : ''}`}
          onClick={() => handleFilterChange('finnish-background')}
        >
          <span className="filter-label">Finnish background</span>
        </button>
      </div>
      )}

      {/* Desktop: Full-width chart with text below */}
      {isDesktop ? (
        <div>
          <div className="chart-wrapper chart-wrapper-grid">
            <ResponsiveContainer width="100%" height={getChartHeight()}>
              <BarChart
                data={barChartData}
                margin={{ top: 10, right: 5, left: 10, bottom: 80 }}
                layout="horizontal"
              >
                <defs>
                  <linearGradient 
                    id="gradient-unicorn-valuation-desktop" 
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    {/* Vertical bars: solid at top, transparent at bottom */}
                    <stop offset="0%" stopColor="#A580F2" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#A580F2" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                
                {/* Vertical bars: X-axis is category (bottom), Y-axis is numeric (left) */}
                <XAxis
                  type="category"
                  dataKey="name"
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.tick, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={{ stroke: chartColors.axis }}
                  angle={-60}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tickFormatter={(value: string) => {
                    const maxLength = 12
                    return truncateFirmName(value, maxLength)
                  }}
                />
                <YAxis
                  type="number"
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.tick, fontSize: 8 }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={{ stroke: chartColors.axis }}
                  width={60}
                  tickFormatter={formatValuation}
                  label={{ 
                    value: 'Valuation', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: chartColors.tick, fontSize: 11 }
                  }}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: isLight ? `1px solid ${chartColors.tooltipBorder}` : 'none',
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                    boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  cursor={false}
                  formatter={(value: number, name: string) => {
                    return [formatValuation(value), name] as [string, string]
                  }}
                />
                
                <Bar
                  dataKey="value"
                  fill="url(#gradient-unicorn-valuation-desktop)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Action buttons - positioned below chart, left-aligned */}
          {(onShowTable || onFullscreen || chartId) && (
            <div className="chart-actions">
              {onShowTable && (
                <button
                  className={`action-button ${showTable ? 'active' : ''}`}
                  onClick={() => {
                    onShowTable()
                    if (!showTable && window.innerWidth <= 640) {
                      setTimeout(() => {
                        const tableElement = document.querySelector('.unicorns-chart-container .chart-data-table-container')
                        if (tableElement) {
                          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }
                  }}
                  title={showTable ? 'Hide Data Table' : 'Show Data Table'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3zM3 9h18M9 3v18" />
                  </svg>
                </button>
              )}
              {onFullscreen && (
                <button
                  className="action-button"
                  onClick={onFullscreen}
                  title="Open in fullscreen"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              )}
              {chartId && (
                <button
                  className="action-button embed-button-desktop-only"
                  onClick={() => setShowEmbedModal(true)}
                  title="Embed this chart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {/* Context text - below chart on desktop - hidden in fullscreen mode */}
          {!fullscreenMode && (
            <div className="chart-context-text" style={{ marginTop: '1.5rem' }}>
              <p>
                Finnish unicorns represent companies valued at over $1 billion. {filteredData.length} {localFilter === 'all' ? 'total' : localFilter === 'finnish' ? 'Finnish-founded' : 'Finnish background'} unicorn{filteredData.length !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile/Tablet: Action buttons */}
          {(onShowTable || onFullscreen || chartId) && (
            <div className="chart-actions" style={{ marginBottom: '0.75rem' }}>
              {onShowTable && (
                <button
                  className={`action-button ${showTable ? 'active' : ''}`}
                  onClick={() => {
                    onShowTable()
                    if (!showTable && window.innerWidth <= 640) {
                      setTimeout(() => {
                        const tableElement = document.querySelector('.unicorns-chart-container .chart-data-table-container')
                        if (tableElement) {
                          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }
                  }}
                  title={showTable ? 'Hide Data Table' : 'Show Data Table'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3zM3 9h18M9 3v18" />
                  </svg>
                </button>
              )}
              {onFullscreen && (
                <button
                  className="action-button"
                  onClick={onFullscreen}
                  title="Open in fullscreen"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              )}
              {chartId && (
                <button
                  className="action-button"
                  onClick={() => setShowEmbedModal(true)}
                  title="Embed this chart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {/* Mobile/Tablet: Stacked layout */}
          <div 
            className="chart-wrapper chart-wrapper-grid unicorns-mobile-chart-wrapper" 
            style={{ 
              height: `${getChartHeight()}px`,
              minHeight: `${getChartHeight()}px`,
              overflow: 'visible'
            }}
          >
            <ResponsiveContainer width="100%" height={getChartHeight()} style={{ overflow: 'visible' }}>
              <BarChart
                data={barChartData}
                margin={isHorizontalBars 
                  ? { top: 10, right: 10, left: effectiveWindowWidth <= 640 ? 45 : 50, bottom: 50 }
                  : { top: 10, right: 20, left: 10, bottom: 80 }
                }
                {...(isHorizontalBars ? { layout: 'vertical' } : { layout: 'horizontal' })}
              >
                <defs>
                  <linearGradient 
                    id="gradient-unicorn-valuation-mobile" 
                    {...(isHorizontalBars ? { x1: "0", y1: "0", x2: "1", y2: "0" } : { x1: "0", y1: "0", x2: "0", y2: "1" })}
                  >
                    {isHorizontalBars ? (
                      <>
                        {/* Horizontal bars: fade from transparent (start) to solid (end) */}
                        <stop offset="0%" stopColor="#A580F2" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#A580F2" stopOpacity={0.8} />
                      </>
                    ) : (
                      <>
                        {/* Vertical bars: solid at top, transparent at bottom */}
                        <stop offset="0%" stopColor="#A580F2" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#A580F2" stopOpacity={0.3} />
                      </>
                    )}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                
                {isHorizontalBars ? (
                  <>
                    {/* Horizontal bars: X-axis is numeric (bottom), Y-axis is category (left) */}
                    <XAxis
                      type="number"
                      stroke={chartColors.axis}
                      tick={{ fill: chartColors.tick, fontSize: 9 }}
                      axisLine={{ stroke: chartColors.axis }}
                      tickLine={{ stroke: chartColors.axis }}
                      height={50}
                      tickFormatter={formatValuation}
                      label={{ 
                        value: 'Valuation', 
                        position: 'insideBottom',
                        offset: -5,
                        style: { textAnchor: 'middle', fill: chartColors.tick, fontSize: effectiveWindowWidth <= 640 ? 10 : 11 }
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke={chartColors.axis}
                      tick={{ fill: chartColors.tick, fontSize: effectiveWindowWidth <= 640 ? 10 : 11 }}
                      axisLine={{ stroke: chartColors.axis }}
                      tickLine={{ stroke: chartColors.axis }}
                      width={effectiveWindowWidth <= 640 ? 45 : 50}
                      interval={0}
                      tickFormatter={(value: string) => {
                        // Show full names on Y-axis, they'll also appear inside bars
                        return value
                      }}
                    />
                  </>
                ) : (
                  <>
                    {/* Vertical bars: X-axis is category (bottom), Y-axis is numeric (left) */}
                    <XAxis
                      type="category"
                      dataKey="name"
                      stroke={chartColors.axis}
                      tick={{ fill: chartColors.tick, fontSize: 9 }}
                      axisLine={{ stroke: chartColors.axis }}
                      tickLine={{ stroke: chartColors.axis }}
                      angle={-60}
                      textAnchor="end"
                      height={70}
                      interval={0}
                      tickFormatter={(value: string) => {
                        const maxLength = effectiveWindowWidth <= 640 ? 10 : 12
                        return truncateFirmName(value, maxLength)
                      }}
                    />
                    <YAxis
                      type="number"
                      stroke={chartColors.axis}
                      tick={{ fill: chartColors.tick, fontSize: 10 }}
                      axisLine={{ stroke: chartColors.axis }}
                      tickLine={{ stroke: chartColors.axis }}
                      width={60}
                      tickFormatter={formatValuation}
                    />
                  </>
                )}
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: isLight ? `1px solid ${chartColors.tooltipBorder}` : 'none',
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                    boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  cursor={false}
                  formatter={(value: number, name: string) => {
                    return [formatValuation(value), name] as [string, string]
                  }}
                />
                
                <Bar
                  dataKey="value"
                  fill="url(#gradient-unicorn-valuation-mobile)"
                  radius={isHorizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mobile: No context text (removed per requirements) */}
        </>
      )}
      
      {/* Data table */}
      {showTable && (
        <div className="chart-table-wrapper" style={{ marginTop: '1.5rem' }}>
          <div className="chart-data-table-container">
            <table className="chart-data-table">
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>Valuation</th>
                  <th>Founded in Finland</th>
                  <th>Finnish Background</th>
                </tr>
              </thead>
              <tbody>
                {barChartData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.name}</td>
                    <td>{formatValuation(row.value)}</td>
                    <td>{row.isFinnish ? 'Yes' : 'No'}</td>
                    <td>{row.isFinnishBackground ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Embed modal */}
      {showEmbedModal && chartId && (
        <EmbedModal
          chartId={chartId}
          currentFilter={localFilter}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </div>
  )
}

export default UnicornsValuationChart

