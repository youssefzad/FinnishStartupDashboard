import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

export interface GraphTemplateConfig {
  // Data
  data: Array<{ name: string; value: number; originalValue: number }>
  
  // Title and labels
  title: string
  dataLabel: string // Label for tooltip/legend
  
  // Filters (optional)
  filtersConfig?: FiltersConfig
  
  // Y-axis configuration
  yAxisConfig: YAxisConfig
  
  // Tooltip configuration
  tooltipConfig: TooltipConfig
  
  // Styling
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
  
  // Data table rendering
  isRevenueValue?: boolean // Whether to format table values as revenue
  renderTable?: () => React.ReactNode // Optional custom table renderer
}

interface GraphTemplateProps {
  config: GraphTemplateConfig
  filterValue: string
  onFilterChange: (value: string) => void
}

const GraphTemplate: React.FC<GraphTemplateProps> = ({ config, filterValue, onFilterChange }) => {
  const {
    data,
    title,
    dataLabel,
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
                    ? `€${(row.originalValue / 1000000000).toFixed(2)}B`
                    : row.originalValue.toLocaleString()
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
    <div className="chart-card chart-card-filterable chart-card-with-text" style={{ gridColumn: '1 / -1' }}>
      <div className="chart-header">
        <h3 className="chart-card-title">{title}</h3>
      </div>
      <div className="chart-content-wrapper">
        <div className="chart-column">
          <div className="chart-wrapper chart-wrapper-grid">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={getMargins()}>
                <defs>
                  <linearGradient id={styleConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={styleConfig.gradientStartColor} stopOpacity={styleConfig.gradientStartOpacity} />
                    <stop offset="100%" stopColor={styleConfig.gradientEndColor} stopOpacity={styleConfig.gradientEndOpacity} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
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
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    border: 'none', 
                    borderRadius: '8px',
                    color: chartColors.tooltipText
                  }}
                  formatter={(value: number, _name: string, props: any) => {
                    return tooltipConfig.formatter(value, props.payload.originalValue, dataLabel)
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={styleConfig.strokeColor} 
                  fill={`url(#${styleConfig.gradientId})`}
                  strokeWidth={styleConfig.strokeWidth || 2}
                />
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
          </div>
        </div>
        {filtersConfig?.enabled && (
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
        {!filtersConfig?.enabled && contextTextValue && (
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
    </div>
  )
}

export default GraphTemplate

