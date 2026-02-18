import React, { useState, useEffect } from 'react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import EmbedModal from './EmbedModal'
import type { ChartId } from '../config/chartRegistry'

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
  
  // Y-axis configuration
  yAxisConfig: YAxisConfig
  
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
}

interface BarChartTemplateProps {
  config: BarChartTemplateConfig
  filterValue?: string
  onFilterChange?: (value: string) => void // Reserved for future use
  chartId?: ChartId // Optional: for embed functionality
  embedMode?: boolean // Optional: if true, use single-column layout and hide insight panel
}

const BarChartTemplate: React.FC<BarChartTemplateProps> = ({ config, filterValue = '', chartId, embedMode = false }) => {
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark')
  
  // Detect theme from document attribute (works in both main site and embeds)
  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme')
      setEffectiveTheme(themeAttr === 'light' ? 'light' : 'dark')
    }
    updateTheme()
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  
  const {
    data,
    title,
    dataLabel,
    chartType,
    barSeries = [],
    areaConfig,
    filtersConfig,
    yAxisConfig,
    tooltipConfig,
    contextText,
    onShowTable,
    onFullscreen,
    showTable = false,
    chartColors,
    windowWidth,
    getXAxisInterval,
    isRevenueValue = false,
    renderTable,
    tableData,
    tableColumns
  } = config

  // Get margins based on screen size
  const getMargins = () => {
    if (windowWidth <= 640) {
      return { bottom: 50, top: 20, right: 8, left: 10 }
    }
    return { bottom: 50, top: 20, right: 20, left: 20 }
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
              <th>Year</th>
              {tableColumns?.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                {tableColumns?.map(col => (
                  <td key={col.key}>
                    {isRevenueValue 
                      ? `€${((row[col.key] as number) / 1000000000).toFixed(2)}B`
                      : (row[col.key] as number).toLocaleString()
                    }
                  </td>
                ))}
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
            </div>
          )}
          <div className="chart-wrapper chart-wrapper-grid">
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'area' && areaConfig ? (
                <AreaChart data={data} margin={getMargins()}>
                  <defs>
                    <linearGradient id={areaConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaConfig.gradientStartColor} stopOpacity={areaConfig.gradientStartOpacity} />
                      <stop offset="100%" stopColor={areaConfig.gradientEndColor} stopOpacity={areaConfig.gradientEndOpacity} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axis || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)')}
                    tick={{ fill: chartColors.tick || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)'), fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={getXAxisInterval()}
                  />
                  <YAxis 
                    stroke={chartColors.axis || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)')}
                    tick={{ fill: chartColors.tick || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)'), fontSize: windowWidth <= 640 ? 9 : 10 }}
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
                <BarChart data={data} margin={getMargins()}>
                  <defs>
                    {barSeries.map(series => (
                      <linearGradient key={series.gradientId} id={series.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={series.gradientStartColor} stopOpacity={series.gradientStartOpacity} />
                        <stop offset="100%" stopColor={series.gradientEndColor} stopOpacity={series.gradientEndOpacity} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axis || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)')}
                    tick={{ fill: chartColors.tick || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)'), fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={getXAxisInterval()}
                  />
                  <YAxis 
                    stroke={chartColors.axis || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.5)')}
                    tick={{ fill: chartColors.tick || (effectiveTheme === 'light' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)'), fontSize: 10 }}
                    tickFormatter={yAxisConfig.formatter}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: 'none', 
                      borderRadius: '8px',
                      color: chartColors.tooltipText
                    }}
                    formatter={(value: number, name: string) => tooltipConfig.formatter(value, name)}
                  />
                  {barSeries.map(series => 
                    series.visible && (
                      <Bar 
                        key={series.dataKey}
                        dataKey={series.dataKey} 
                        fill={`url(#${series.gradientId})`}
                        radius={[4, 4, 0, 0]}
                      />
                    )
                  )}
                </BarChart>
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

