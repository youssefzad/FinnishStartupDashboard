import React, { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import EmbedModal from './EmbedModal'
import type { ChartId } from '../config/chartRegistry'

// Shared revenue formatting helper
// Formats revenue values that may be in billions (< 1000) or raw units (> 1000)
function formatRevenueBillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  // If value is > 1000, assume it's in raw units and convert to billions
  // If value is < 1000, assume it's already in billions
  const billions = value > 1000 ? value / 1000000000 : value
  return `€${billions.toFixed(2)}B`
}

// Type definitions for graph configuration
export interface FilterOption {
  value: string
  label: string
  columnKey?: string // Optional: column name in data if different from value
}

export interface FiltersConfig {
  enabled: boolean
  options: FilterOption[]
  defaultFilter: string
  filterKey: string // State key for this filter (e.g., 'revenueFilter')
}

export interface YAxisConfig {
  formatter: (value: number) => string
  width?: number // Optional width constraint for mobile
  domain?: [number, number] // Optional fixed domain [min, max] for Y-axis
  label?: string // Optional Y-axis label text
}

export interface TooltipConfig {
  formatter: (value: number, originalValue: number, label: string) => [string, string]
}

export interface ChartStyleConfig {
  strokeColor: string
  gradientId: string
  gradientStartColor: string
  gradientEndColor: string
  gradientStartOpacity: number
  gradientEndOpacity: number
  strokeWidth?: number
}

export interface SeriesConfig {
  key: string // Data key for this series
  label: string // Display label for legend/tooltip
  color?: string // Optional: custom color (defaults to styleConfig.strokeColor)
  style?: 'solid' | 'dashed' // Optional: line style (defaults to 'solid')
  gradientId?: string // Optional: custom gradient ID
  gradientStartColor?: string // Optional: custom gradient start color
  gradientEndColor?: string // Optional: custom gradient end color
  gradientStartOpacity?: number // Optional: custom gradient start opacity
  gradientEndOpacity?: number // Optional: custom gradient end opacity
}

export interface GraphTemplateConfig {
  // Data - supports both single series (backward compatible) and multi-series
  data: Array<{ name: string; value?: number; originalValue?: number; [key: string]: any }>
  
  // Title and labels
  title: string
  titleNote?: string // Optional explanatory note below title (subtle, low-contrast)
  dataLabel: string // Label for tooltip/legend (used for single series or as fallback)
  
  // Multi-series support (optional - if provided, renders multiple series)
  series?: SeriesConfig[]
  
  // Filters (optional)
  filtersConfig?: FiltersConfig
  
  // Y-axis configuration
  yAxisConfig: YAxisConfig
  
  // Tooltip configuration
  tooltipConfig: TooltipConfig
  
  // Styling (used for single series or as defaults for multi-series)
  styleConfig: ChartStyleConfig
  
  // Context text (optional)
  contextText?: string | ((filterValue: string) => string)
  
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
  isRevenueValue?: boolean // Whether to format table values as revenue
  renderTable?: () => React.ReactNode // Optional custom table renderer
}

interface GraphTemplateProps {
  config: GraphTemplateConfig
  filterValue: string
  onFilterChange: (value: string) => void
  chartId?: ChartId // Optional: for embed functionality
  embedMode?: boolean // Optional: if true, use single-column layout and hide insight panel
}

const GraphTemplate: React.FC<GraphTemplateProps> = ({ config, filterValue, onFilterChange, chartId, embedMode = false }) => {
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const {
    data,
    title,
    titleNote,
    dataLabel,
    series,
    filtersConfig,
    yAxisConfig,
    tooltipConfig,
    styleConfig,
    contextText,
    onShowTable,
    onFullscreen,
    showTable = false,
    chartColors,
    windowWidth,
    getXAxisInterval,
    isRevenueValue = false,
    renderTable
  } = config

  // Feature flag for multi-series support (can be disabled for rollback)
  const ENABLE_MULTI_SERIES_GRAPH = true
  
  // Determine if we're using multi-series mode
  const isMultiSeries = ENABLE_MULTI_SERIES_GRAPH && series && series.length > 0

  // Get margins based on screen size
  const getMargins = () => {
    if (windowWidth <= 640) {
      return { bottom: 15, top: 10, right: 8, left: 0 }
    }
    return { bottom: 15, top: 10, right: 10, left: 10 }
  }

  // Get context text (can be string or function)
  const getContextTextValue = (): string | undefined => {
    if (!contextText) return undefined
    if (typeof contextText === 'string') return contextText
    return contextText(filterValue)
  }

  const contextTextValue = getContextTextValue()

  // Render data table if needed
  const renderDataTableContent = () => {
    if (renderTable) {
      return renderTable()
    }
    
    if (data.length === 0) return null

    // Multi-series table
    if (isMultiSeries && series) {
      return (
        <div className="chart-data-table-container">
          <table className="chart-data-table">
            <thead>
              <tr>
                <th>Time</th>
                {series.map(s => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td>{row.name}</td>
                  {series.map(s => {
                    const value = row[s.key]
                    if (value === null || value === undefined) return <td key={s.key}>-</td>
                    return (
                      <td key={s.key}>
                        {typeof value === 'number' ? value.toFixed(1) : String(value)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Single-series table (backward compatible)
    return (
      <div className="chart-data-table-container">
        <table className="chart-data-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>{dataLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>
                  {isRevenueValue 
                    ? formatRevenueBillions(row.originalValue ?? row.value)
                    : (row.originalValue || row.value || 0).toLocaleString()
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`chart-card chart-card-filterable chart-card-with-text ${embedMode ? 'embed' : ''}`} style={{ gridColumn: '1 / -1' }}>
      {!embedMode && (
        <div className="chart-header">
          <h3 className="chart-card-title">{title}</h3>
          {titleNote && (
            <p className="chart-title-note">{titleNote}</p>
          )}
        </div>
      )}
      {embedMode && titleNote && (
        <div className="chart-header">
          <p className="chart-title-note">{titleNote}</p>
        </div>
      )}
      <div className={`chart-content-wrapper ${embedMode ? 'embed' : ''}`}>
        <div className="chart-column">
          {embedMode && filtersConfig?.enabled && (
            <div className="chart-filters-embed">
              {filtersConfig.options.map((option) => (
                <button
                  key={option.value}
                  className={`filter-button ${filterValue === option.value ? 'active' : ''}`}
                  onClick={() => onFilterChange(option.value)}
                >
                  <span className="filter-label">{option.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="chart-wrapper chart-wrapper-grid">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={getMargins()}>
                <defs>
                  {isMultiSeries && series ? (
                    // Multi-series gradients
                    series.map((s, index) => {
                      const gradientId = s.gradientId || `${styleConfig.gradientId}-${index}`
                      const startColor = s.gradientStartColor || s.color || styleConfig.gradientStartColor
                      const endColor = s.gradientEndColor || s.color || styleConfig.gradientEndColor
                      const startOpacity = s.gradientStartOpacity ?? styleConfig.gradientStartOpacity
                      const endOpacity = s.gradientEndOpacity ?? styleConfig.gradientEndOpacity
                      return (
                        <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={startColor} stopOpacity={startOpacity} />
                          <stop offset="100%" stopColor={endColor} stopOpacity={endOpacity} />
                        </linearGradient>
                      )
                    })
                  ) : (
                    // Single-series gradient (backward compatible)
                    <linearGradient id={styleConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={styleConfig.gradientStartColor} stopOpacity={styleConfig.gradientStartOpacity} />
                      <stop offset="100%" stopColor={styleConfig.gradientEndColor} stopOpacity={styleConfig.gradientEndOpacity} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                {/* Enhanced 0 line for barometer charts (when domain includes 0) */}
                {yAxisConfig.domain && yAxisConfig.domain[0] <= 0 && yAxisConfig.domain[1] >= 0 && (
                  <ReferenceLine 
                    y={0} 
                    stroke={chartColors.axis || '#888'} 
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                    strokeDasharray="0"
                  />
                )}
                <XAxis 
                  dataKey="name" 
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.tick, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  interval={getXAxisInterval()}
                />
                <YAxis 
                  stroke={chartColors.axis}
                  tick={{ fill: chartColors.tick, fontSize: windowWidth <= 640 ? 9 : 10 }}
                  width={windowWidth <= 640 ? (yAxisConfig.width || 35) : undefined}
                  tickFormatter={yAxisConfig.formatter}
                  domain={yAxisConfig.domain}
                  label={yAxisConfig.label ? {
                    value: yAxisConfig.label,
                    angle: -90,
                    position: 'insideLeft',
                    style: { 
                      textAnchor: 'middle',
                      fill: chartColors.tick,
                      fontSize: windowWidth <= 640 ? 10 : 11,
                      opacity: 0.7
                    }
                  } : undefined}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    border: 'none', 
                    borderRadius: '8px',
                    color: chartColors.tooltipText
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (isMultiSeries && series) {
                      // Multi-series tooltip
                      const seriesConfig = series.find(s => s.key === name)
                      const label = seriesConfig?.label || name
                      if (value === null || value === undefined) return ['N/A', label]
                      return [value.toFixed(1), label]
                    } else {
                      // Single-series tooltip (backward compatible)
                      return tooltipConfig.formatter(value, props.payload?.originalValue || value, dataLabel)
                    }
                  }}
                />
                {isMultiSeries && series ? (
                  // Multi-series rendering
                  <>
                    {series.map((s, index) => {
                      const gradientId = s.gradientId || `${styleConfig.gradientId}-${index}`
                      const strokeColor = s.color || styleConfig.strokeColor
                      const strokeDasharray = s.style === 'dashed' ? '5 5' : undefined
                      return (
                        <Area
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          stroke={strokeColor}
                          fill={`url(#${gradientId})`}
                          strokeWidth={styleConfig.strokeWidth || 2}
                          strokeDasharray={strokeDasharray}
                          name={s.label}
                        />
                      )
                    })}
                    <Legend />
                  </>
                ) : (
                  // Single-series rendering (backward compatible)
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={styleConfig.strokeColor} 
                    fill={`url(#${styleConfig.gradientId})`}
                    strokeWidth={styleConfig.strokeWidth || 2}
                  />
                )}
              </AreaChart>
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
              {filtersConfig.options.map((option) => (
                <button
                  key={option.value}
                  className={`filter-button ${filterValue === option.value ? 'active' : ''}`}
                  onClick={() => onFilterChange(option.value)}
                >
                  <span className="filter-label">{option.label}</span>
                </button>
              ))}
            </div>
            {contextTextValue && (
              <div className="chart-context-text">
                <p>{contextTextValue}</p>
              </div>
            )}
          </div>
        )}
        {!embedMode && !filtersConfig?.enabled && contextTextValue && (
          <div className="chart-sidebar">
            <div className="chart-context-text">
              <p>{contextTextValue}</p>
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
          currentFilter={filterValue !== 'all' ? filterValue : undefined}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </div>
  )
}

export default GraphTemplate

