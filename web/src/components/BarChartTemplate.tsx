import React, { useState, useEffect } from 'react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import EmbedModal from './EmbedModal'
import type { ChartId } from '../config/chartRegistry'

// Helper to format valuation for table display
function formatValuationForTable(value: number): string {
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

// Type definitions for bar chart configuration
export interface BarSeries {
  dataKey: string
  label: string
  color: string
  gradientId: string
  gradientStartColor: string
  gradientEndColor: string
  gradientStartOpacity: number
  gradientEndOpacity: number
  visible: boolean
  onToggle?: () => void
}

export interface BarChartFiltersConfig {
  enabled: boolean
  toggleButtons?: Array<{
    label: string
    isActive: boolean
    onClick: () => void
  }>
  viewModeButtons?: Array<{
    label: string
    value: string
    isActive: boolean
    onClick: () => void
  }>
}

export interface YAxisConfig {
  formatter: (value: number) => string
  width?: number
  interval?: number | 'preserveStartEnd' | 'preserveStart' | 'preserveEnd' // Optional: for category Y-axis (horizontal bars)
  tickFormatter?: (value: string | number) => string // Optional: for category Y-axis
  fontSize?: number // Optional: override default font size
}

export interface XAxisConfig {
  interval?: number | 'preserveStartEnd' | 'preserveStart' | 'preserveEnd'
  tickFormatter?: (value: string) => string
  height?: number
  angle?: number
  fontSize?: number
  tickMargin?: number // Optional: spacing for ticks
}

export interface TooltipConfig {
  formatter: (value: number, name: string) => [string, string]
}

export interface BarChartTemplateConfig {
  // Data
  data: Array<{ name: string; [key: string]: any }>
  
  // Title and labels
  title: string
  dataLabel: string
  
  // Chart type
  chartType: 'bar' | 'area' // 'bar' for comparison, 'area' for share views
  
  // Bar chart layout (for bar chart type)
  barLayout?: 'vertical' | 'horizontal' // 'vertical' = bars go up, 'horizontal' = bars go right
  
  // Bar series configuration (for bar chart type)
  barSeries?: BarSeries[]
  
  // Area chart configuration (for area chart type)
  areaConfig?: {
    dataKey: string
    color: string
    gradientId: string
    gradientStartColor: string
    gradientEndColor: string
    gradientStartOpacity: number
    gradientEndOpacity: number
  }
  
  // Filters and toggles
  filtersConfig?: BarChartFiltersConfig
  
  // Top N control (optional)
  topNConfig?: {
    enabled: boolean
    options: Array<{ value: number; label: string }>
    defaultTopN: number
    onTopNChange?: (topN: number) => void
  }
  
  // Y-axis configuration
  yAxisConfig: YAxisConfig
  
  // X-axis configuration (optional, for custom X-axis behavior)
  xAxisConfig?: XAxisConfig
  
  // Tooltip configuration
  tooltipConfig: TooltipConfig
  
  // Context text (optional)
  contextText?: string
  
  // Actions
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
  
  // Chart colors from theme
  chartColors: {
    axis: string
    tick: string
    grid: string
    tooltipBg: string
    tooltipText: string
  }
  
  // Responsive
  windowWidth: number
  
  // X-axis interval function
  getXAxisInterval: () => number
  
  // Debug info (optional, for development)
  _debug?: {
    filter?: string
    columnUsed?: string
  }
  
  // Data table rendering
  isRevenueValue?: boolean
  renderTable?: () => React.ReactNode
  tableData?: Array<{ name: string; [key: string]: any }>
  tableColumns?: Array<{ key: string; label: string }>
  tableFirstColumnLabel?: string // Label for the first column (default: "Year")
  tableHiddenKeys?: string[] // Keys to hide from table columns (default: [])
}

interface BarChartTemplateProps {
  config: BarChartTemplateConfig
  filterValue?: string
  onFilterChange?: (value: string) => void // Reserved for future use
  chartId?: ChartId // Optional: for embed functionality
  embedMode?: boolean // Optional: if true, use single-column layout and hide insight panel
  theme?: 'light' | 'dark' // Optional: explicit theme for embed mode (single source of truth)
}

const BarChartTemplate: React.FC<BarChartTemplateProps> = ({ config, filterValue = '', chartId, embedMode = false, theme }) => {
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  
  // Theme state - initialized from document/prop and updated via MutationObserver
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

  // Use state-based theme (not reading from document directly during render)
  const effectiveTheme: 'light' | 'dark' = theme || currentTheme
  
  const {
    data,
    title,
    dataLabel,
    chartType,
    barSeries = [],
    areaConfig,
    filtersConfig,
    topNConfig,
    yAxisConfig,
    xAxisConfig,
    tooltipConfig,
    contextText,
    barLayout = 'vertical', // Default to vertical (current behavior)
    onShowTable,
    onFullscreen,
    showTable = false,
    chartColors,
    windowWidth,
    getXAxisInterval,
    isRevenueValue = false,
    renderTable,
    tableData,
    tableColumns,
    tableFirstColumnLabel = 'Year',
    tableHiddenKeys = []
  } = config

  // Determine if horizontal bars are being used (for responsive height calculation)
  const isHorizontalBarsForHeight = barLayout === 'horizontal'

  // Get margins based on screen size and bar layout
  const getMargins = (isHorizontal: boolean = false) => {
    if (isHorizontal) {
      // Horizontal bars: increased left margin for Y-axis labels (firm names), more bottom for X-axis values
      if (windowWidth <= 640) {
        return { bottom: 50, top: 10, right: 8, left: 10 }
      }
      return { bottom: 50, top: 10, right: 20, left: 10 }
    }
    // Vertical bars (default): bottom margin must accommodate X-axis height to prevent label clipping
    const xAxisHeight = xAxisConfig?.height ?? (windowWidth <= 640 ? 100 : 80)
    const minBottomMargin = xAxisHeight + 20 // Ensure labels aren't clipped (height + padding)
    const defaultBottom = windowWidth <= 640 ? 50 : 50
    if (windowWidth <= 640) {
      return { bottom: Math.max(defaultBottom, minBottomMargin), top: 20, right: 8, left: 10 }
    }
    return { bottom: Math.max(defaultBottom, minBottomMargin), top: 20, right: 20, left: 20 }
  }

  // Calculate responsive height - for horizontal bars, need more height to fit all items
  const getChartHeight = () => {
    if (isHorizontalBarsForHeight && windowWidth <= 768) {
      // For horizontal bars on mobile/tablet: ensure enough height for all items
      // Each bar needs ~34px, add padding for margins (top/bottom) and axis labels (X-axis at bottom)
      // Formula: base height + (items * item height) + axis padding
      // For 20 items: Math.max(520, 20 * 34 + 220) = Math.max(520, 900) = 900px
      return Math.max(520, data.length * 34 + 220)
    }
    // For vertical bars, ensure enough height for all labels
    if (!isHorizontalBarsForHeight && data.length > 10) {
      // Increase height for many items to ensure all labels are visible
      return Math.max(400, 300 + (data.length - 10) * 15)
    }
    return 400
  }

  // Render data table if needed
  const renderDataTableContent = () => {
    if (renderTable) {
      return renderTable()
    }
    
    if (!tableData || tableData.length === 0) return null

    return (
      <div className="chart-data-table-container">
        <table className="chart-data-table">
          <thead>
            <tr>
              <th>{tableFirstColumnLabel}</th>
              {tableColumns?.filter(col => !tableHiddenKeys.includes(col.key)).map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                {tableColumns?.filter(col => !tableHiddenKeys.includes(col.key)).map(col => {
                  const cellValue = row[col.key]
                  // Handle valuation column specially
                  if (col.key === 'value' && isRevenueValue) {
                    const numValue = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue))
                    return (
                      <td key={col.key}>
                        {formatValuationForTable(numValue)}
                      </td>
                    )
                  }
                  // Handle boolean columns (isFinnish, isFinnishBackground) - they're already formatted as Yes/No
                  if (typeof cellValue === 'string') {
                    return <td key={col.key}>{cellValue}</td>
                  }
                  // Handle numeric columns
                  if (typeof cellValue === 'number') {
                    return (
                      <td key={col.key}>
                        {isRevenueValue 
                          ? formatValuationForTable(cellValue)
                          : cellValue.toLocaleString()
                        }
                      </td>
                    )
                  }
                  return <td key={col.key}>{String(cellValue)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`chart-card chart-card-with-text ${embedMode ? 'embed' : ''}`} style={{ marginBottom: '2rem', gridColumn: '1 / -1' }}>
      {!embedMode && (
        <div className="chart-header">
          <h3 className="chart-card-title">{title}</h3>
        </div>
      )}
      <div className={`chart-content-wrapper ${embedMode ? 'embed' : ''}`}>
        <div className="chart-column">
          {embedMode && filtersConfig?.enabled && (
            <div className="chart-filters-embed">
              {filtersConfig.toggleButtons?.map((button, index) => (
                <button
                  key={index}
                  className={`filter-button ${button.isActive ? 'active' : ''}`}
                  onClick={button.onClick}
                >
                  <span className="filter-label">{button.label}</span>
                </button>
              ))}
              {filtersConfig.viewModeButtons?.map((button, index) => (
                <button
                  key={index}
                  className={`filter-button ${button.isActive ? 'active' : ''}`}
                  onClick={button.onClick}
                >
                  <span className="filter-label">{button.label}</span>
                </button>
              ))}
              {topNConfig?.enabled && (
                <>
                  <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                  {topNConfig.options.map((option, index) => (
                    <button
                      key={index}
                      className={`filter-button ${topNConfig.defaultTopN === option.value ? 'active' : ''}`}
                      onClick={() => topNConfig.onTopNChange?.(option.value)}
                    >
                      <span className="filter-label">{option.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
          <div className="chart-wrapper chart-wrapper-grid">
            <ResponsiveContainer width="100%" height={getChartHeight()}>
              {chartType === 'area' && areaConfig ? (
                <AreaChart data={data} margin={getMargins(false)}>
                  <defs>
                    <linearGradient id={areaConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaConfig.gradientStartColor} stopOpacity={areaConfig.gradientStartOpacity} />
                      <stop offset="100%" stopColor={areaConfig.gradientEndColor} stopOpacity={areaConfig.gradientEndOpacity} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    tick={{ fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={getXAxisInterval()}
                  />
                  <YAxis 
                    stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    tick={{ fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', fontSize: windowWidth <= 640 ? 9 : 10 }}
                    width={windowWidth <= 640 ? (yAxisConfig.width || 35) : undefined}
                    tickFormatter={yAxisConfig.formatter}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: 'none', 
                      borderRadius: '8px',
                      color: chartColors.tooltipText
                    }}
                    cursor={false}
                    formatter={(value: number, _name: string) => tooltipConfig.formatter(value, dataLabel)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={areaConfig.dataKey} 
                    stroke={areaConfig.color} 
                    fill={`url(#${areaConfig.gradientId})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                (() => {
                  // Runtime safety: guard against empty data
                  if (!data || data.length === 0) {
                    return null
                  }

                  // In Recharts: 
                  // layout="horizontal" (or omitted) => bars go UP (vertical bars) - DEFAULT
                  // layout="vertical" => bars go RIGHT (horizontal bars)
                  // So: if we want horizontal bars (left-right), use layout="vertical"
                  const isHorizontalBars = barLayout === 'horizontal'
                  
                  try {
                    return (
                      <BarChart 
                        data={data} 
                        margin={getMargins(isHorizontalBars)}
                        {...(isHorizontalBars ? { layout: 'vertical' } : { layout: 'horizontal' })}
                      >
                        <defs>
                          {barSeries.map(series => {
                            // For horizontal bars (left-right), gradient goes left to right
                            // For vertical bars (up-down), gradient goes top to bottom
                            const gradientDirection = isHorizontalBars
                              ? { x1: "0", y1: "0", x2: "1", y2: "0" }
                              : { x1: "0", y1: "0", x2: "0", y2: "1" }
                            // For horizontal bars: reverse gradient so it fades from transparent (start) to solid (end)
                            // For vertical bars: keep original (solid at top, transparent at bottom)
                            const stops = isHorizontalBars ? [
                              <stop key="start" offset="0%" stopColor={series.gradientStartColor} stopOpacity={series.gradientEndOpacity} />,
                              <stop key="end" offset="100%" stopColor={series.gradientEndColor} stopOpacity={series.gradientStartOpacity} />
                            ] : [
                              <stop key="start" offset="0%" stopColor={series.gradientStartColor} stopOpacity={series.gradientStartOpacity} />,
                              <stop key="end" offset="100%" stopColor={series.gradientEndColor} stopOpacity={series.gradientEndOpacity} />
                            ]
                            
                            return (
                              <linearGradient 
                                key={series.gradientId} 
                                id={series.gradientId} 
                                {...gradientDirection}
                              >
                                {stops}
                              </linearGradient>
                            )
                          })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        {isHorizontalBars ? (
                          <>
                            {/* Horizontal bars (left-right): X-axis is the value axis (bottom), Y-axis is the name axis (left) */}
                            <XAxis 
                              type="number"
                              stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                              tick={{ 
                                fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', 
                                fontSize: windowWidth <= 640 ? 9 : 10
                              }}
                              tickMargin={10}
                              height={45}
                              tickFormatter={yAxisConfig.formatter}
                            />
                            <YAxis 
                              type="category"
                              dataKey="name"
                              stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                              tick={{ 
                                fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', 
                                fontSize: yAxisConfig.fontSize || xAxisConfig?.fontSize || (windowWidth <= 640 ? 9 : 10)
                              }}
                              width={yAxisConfig.width || (windowWidth <= 640 ? 115 : 100)}
                              {...(yAxisConfig.interval !== undefined ? { interval: yAxisConfig.interval } : {})}
                              {...(yAxisConfig.tickFormatter ? { tickFormatter: yAxisConfig.tickFormatter } : (xAxisConfig?.tickFormatter ? { tickFormatter: xAxisConfig.tickFormatter } : {}))}
                            />
                          </>
                        ) : (
                          <>
                            {/* Vertical bars (up-down): X-axis is the name axis (bottom), Y-axis is the value axis (left) */}
                            <XAxis 
                              type="category"
                              dataKey="name" 
                              stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                              tick={{ 
                                fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', 
                                fontSize: xAxisConfig?.fontSize || (windowWidth <= 640 ? 9 : 10)
                              }}
                              {...(xAxisConfig?.angle !== undefined ? { angle: xAxisConfig.angle } : { angle: windowWidth <= 640 ? -60 : -45 })}
                              textAnchor="end"
                              {...(xAxisConfig?.height !== undefined ? { height: xAxisConfig.height } : { height: windowWidth <= 640 ? 100 : 80 })}
                              {...(xAxisConfig?.interval !== undefined ? { interval: xAxisConfig.interval } : { interval: getXAxisInterval() })}
                              {...(xAxisConfig?.tickFormatter ? { tickFormatter: xAxisConfig.tickFormatter } : {})}
                              {...(xAxisConfig?.tickMargin !== undefined ? { tickMargin: xAxisConfig.tickMargin } : {})}
                            />
                            <YAxis 
                              type="number"
                              stroke={effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                              tick={{ fill: effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)', fontSize: windowWidth <= 640 ? 9 : 10 }}
                              width={windowWidth <= 640 ? (yAxisConfig.width || 35) : undefined}
                              tickFormatter={yAxisConfig.formatter}
                            />
                          </>
                        )}
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: chartColors.tooltipBg, 
                            border: 'none', 
                            borderRadius: '8px',
                            color: chartColors.tooltipText
                          }}
                          cursor={false}
                          formatter={(value: number, name: string) => {
                            try {
                              return tooltipConfig.formatter(value, name)
                            } catch (error) {
                              console.error('[BarChartTemplate] Tooltip formatter error:', error)
                              return [String(value), name]
                            }
                          }}
                        />
                        {barSeries.map(series => 
                          series.visible && (
                            <Bar 
                              key={series.dataKey}
                              dataKey={series.dataKey} 
                              fill={`url(#${series.gradientId})`}
                              radius={isHorizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                            />
                          )
                        )}
                      </BarChart>
                    )
                  } catch (error) {
                    console.error('[BarChartTemplate] Error rendering bar chart:', error)
                    return null
                  }
                })()
              )}
            </ResponsiveContainer>
          </div>
          <div className="chart-actions">
            {onShowTable && (
              <button
                className={`action-button ${showTable ? 'active' : ''}`}
                onClick={() => {
                  onShowTable()
                  if (!showTable && window.innerWidth <= 640) {
                    setTimeout(() => {
                      const tableElement = document.querySelector('.chart-data-table-container')
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
        </div>
        {!embedMode && filtersConfig?.enabled && (
          <div className="chart-sidebar">
            <div className="chart-filters">
              {filtersConfig.toggleButtons?.map((button, index) => (
                <button
                  key={index}
                  className={`filter-button ${button.isActive ? 'active' : ''}`}
                  onClick={button.onClick}
                >
                  <span className="filter-label">{button.label}</span>
                </button>
              ))}
              {filtersConfig.viewModeButtons?.map((button, index) => (
                <button
                  key={index}
                  className={`filter-button ${button.isActive ? 'active' : ''}`}
                  onClick={button.onClick}
                >
                  <span className="filter-label">{button.label}</span>
                </button>
              ))}
            </div>
            {topNConfig?.enabled && (
              <div className="chart-filters" style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Show:
                </div>
                {topNConfig.options.map((option, index) => (
                  <button
                    key={index}
                    className={`filter-button ${topNConfig.defaultTopN === option.value ? 'active' : ''}`}
                    onClick={() => topNConfig.onTopNChange?.(option.value)}
                  >
                    <span className="filter-label">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
            {contextText && (
              <div className="chart-context-text">
                <p>{contextText}</p>
              </div>
            )}
          </div>
        )}
        {!embedMode && !filtersConfig?.enabled && contextText && (
          <div className="chart-sidebar">
            <div className="chart-context-text">
              <p>{contextText}</p>
            </div>
          </div>
        )}
      </div>
      {showTable && (
        <div className="chart-table-wrapper">
          {renderDataTableContent()}
        </div>
      )}
      {showEmbedModal && chartId && (
        <EmbedModal
          chartId={chartId}
          currentFilter={filterValue}
          currentView={filtersConfig?.viewModeButtons?.find(b => b.isActive)?.value}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </div>
  )
}

export default BarChartTemplate

