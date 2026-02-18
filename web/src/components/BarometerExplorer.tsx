import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import GraphTemplate from './GraphTemplate'
import type { GraphTemplateConfig } from './GraphTemplate'
import type { ChartId } from '../config/chartRegistry'
import styles from './BarometerExplorer.module.css'

interface BarometerExplorerProps {
  barometerData: any[]
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
  selectedTab?: 'financial' | 'employees' | 'economy'
  onTabChange?: (tab: 'financial' | 'employees' | 'economy') => void
}

type TabType = 'financial' | 'employees' | 'economy'

const BarometerExplorer = ({ 
  barometerData, 
  onShowTable, 
  onFullscreen, 
  showTable = false,
  selectedTab: externalSelectedTab,
  onTabChange
}: BarometerExplorerProps) => {
  const { theme } = useTheme()
  const location = useLocation()
  const isEmbedMode = location.pathname.startsWith('/embed')
  const [internalSelectedTab, setInternalSelectedTab] = useState<TabType>('financial')
  
  // Use external tab if provided, otherwise use internal state
  const selectedTab = externalSelectedTab || internalSelectedTab
  
  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalSelectedTab(tab)
    }
  }

  // Get chart colors based on theme
  const getChartColors = () => {
    if (theme === 'light') {
      return {
        grid: 'rgba(0, 0, 0, 0.1)',
        axis: 'rgba(26, 26, 26, 0.5)',
        tick: 'rgba(26, 26, 26, 0.7)',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#1a1a1a'
      }
    } else {
      return {
        grid: 'rgba(255, 255, 255, 0.1)',
        axis: 'rgba(255, 255, 255, 0.5)',
        tick: 'rgba(255, 255, 255, 0.7)',
        tooltipBg: 'rgba(17, 17, 17, 0.95)',
        tooltipText: '#ffffff'
      }
    }
  }

  const chartColors = getChartColors()

  // Find Time column
  const findTimeColumn = (): string | null => {
    if (barometerData.length === 0) return null
    const headers = Object.keys(barometerData[0])
    return headers.find(h => {
      const hLower = h.toLowerCase()
      return hLower.includes('time') || hLower.includes('date') || hLower.includes('period')
    }) || null
  }

  // Get column names for a tab
  const getTabColumns = (tab: TabType): { past: string | null; next: string | null } => {
    if (barometerData.length === 0) return { past: null, next: null }
    
    const headers = Object.keys(barometerData[0])
    
    let searchTerms: string[] = []
    switch (tab) {
      case 'financial':
        searchTerms = ['financial', 'company financial']
        break
      case 'employees':
        searchTerms = ['employees', 'number of employees']
        break
      case 'economy':
        searchTerms = ['economy', 'surrounding economy']
        break
    }
    
    const pastCol = headers.find((h) => {
      const hLower = h.toLowerCase()
      return searchTerms.some(term => hLower.includes(term)) && 
             (hLower.includes('past') || hLower.includes('past 3mo'))
    })
    
    const nextCol = headers.find((h) => {
      const hLower = h.toLowerCase()
      return searchTerms.some(term => hLower.includes(term)) && 
             (hLower.includes('next') || hLower.includes('next 3mo') || hLower.includes('expectation'))
    })
    
    return { past: pastCol || null, next: nextCol || null }
  }

  // Get window width for responsive intervals
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const getXAxisInterval = () => {
    if (windowWidth >= 1024) {
      return 0 // Show all on large screens
    } else if (windowWidth >= 768) {
      return 1 // Show every 2nd on medium screens
    } else {
      return 2 // Show every 3rd on small screens
    }
  }

  // Build GraphTemplate config for selected tab
  const buildBarometerConfig = useMemo((): GraphTemplateConfig | null => {
    if (barometerData.length === 0) return null
    
    const timeCol = findTimeColumn()
    if (!timeCol) return null
    
    const { past, next } = getTabColumns(selectedTab)
    if (!past && !next) return null
    
    // Parse quarter/year string (e.g., "Q2/2022") to a sortable value
    const parseQuarterYear = (timeStr: string): { year: number; quarter: number } | null => {
      const match = String(timeStr).match(/Q(\d)\/(\d{4})/)
      if (match) {
        return {
          quarter: parseInt(match[1], 10),
          year: parseInt(match[2], 10)
        }
      }
      return null
    }

    // Prepare chart data
    const chartData = barometerData
      .filter(row => row[timeCol] !== undefined && row[timeCol] !== null)
      .map(row => {
        const dataPoint: any = {
          name: String(row[timeCol])
        }
        
        if (past) {
          const pastValue = row[past]
          dataPoint.past = typeof pastValue === 'number' ? pastValue : (parseFloat(String(pastValue)) || null)
        }
        
        if (next) {
          const nextValue = row[next]
          dataPoint.next = typeof nextValue === 'number' ? nextValue : (parseFloat(String(nextValue)) || null)
        }
        
        return dataPoint
      })
      .filter(row => row.past !== null || row.next !== null)
      .sort((a, b) => {
        const parsedA = parseQuarterYear(a.name)
        const parsedB = parseQuarterYear(b.name)
        
        // If both can be parsed as quarter/year, sort chronologically
        if (parsedA && parsedB) {
          if (parsedA.year !== parsedB.year) {
            return parsedA.year - parsedB.year
          }
          return parsedA.quarter - parsedB.quarter
        }
        
        // Fallback to string comparison if parsing fails
        return String(a.name).localeCompare(String(b.name))
      })

    if (chartData.length === 0) return null

    // Build series config
    const series = []
    if (past) {
      series.push({
        key: 'past',
        label: 'Past 3 months',
        color: '#A580F2',
        gradientId: 'gradient-barometer-past',
        gradientStartColor: '#A580F2',
        gradientEndColor: '#A580F2',
        gradientStartOpacity: 0.3,
        gradientEndOpacity: 0.05
      })
    }
    if (next) {
      series.push({
        key: 'next',
        label: 'Next 3 months',
        color: '#4A90E2',
        gradientId: 'gradient-barometer-next',
        gradientStartColor: '#4A90E2',
        gradientEndColor: '#4A90E2',
        gradientStartOpacity: 0.3,
        gradientEndOpacity: 0.05
      })
    }

    // Get tab title
    const getTabTitle = (tab: TabType): string => {
      switch (tab) {
        case 'financial':
          return 'Financial situation'
        case 'employees':
          return 'Number of employees'
        case 'economy':
          return 'Surrounding economy'
      }
    }

    return {
      data: chartData,
      title: getTabTitle(selectedTab),
      titleNote: 'Balance = % very positive + (0.5*positive) - (0.5*%negative) - % very negative',
      dataLabel: 'Sentiment',
      series: series,
      yAxisConfig: {
        formatter: (value: number) => value.toFixed(1),
        domain: [-50, 50], // Fixed scale from -50 to +50
        label: 'Balance Figure (-100 to +100)'
      },
      tooltipConfig: {
        formatter: (value: number) => [value.toFixed(1), 'Sentiment']
      },
      styleConfig: {
        strokeColor: '#A580F2',
        gradientId: 'gradient-barometer-default',
        gradientStartColor: '#A580F2',
        gradientEndColor: '#A580F2',
        gradientStartOpacity: 0.3,
        gradientEndOpacity: 0.05,
        strokeWidth: 2
      },
      onShowTable,
      onFullscreen,
      showTable,
      chartColors,
      windowWidth,
      getXAxisInterval,
      isRevenueValue: false
    }
  }, [barometerData, selectedTab, chartColors, windowWidth, onShowTable, onFullscreen, showTable])

  const hasData = buildBarometerConfig !== null

  // Get tab label
  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'financial':
        return 'Financial situation'
      case 'employees':
        return 'Employees'
      case 'economy':
        return 'Surrounding economy'
    }
  }

  const tabs = [
    { id: 'financial' as TabType, label: getTabLabel('financial'), available: true },
    { id: 'employees' as TabType, label: getTabLabel('employees'), available: true },
    { id: 'economy' as TabType, label: getTabLabel('economy'), available: true }
  ]

  return (
    <div className={styles.barometerExplorer}>
      {/* About the Startup Barometer - Only show on explore page, not in embed mode */}
      {!isEmbedMode && (
        <div className={styles.infoPanel}>
          <h3 className={styles.infoPanelTitle}>About the Startup Barometer</h3>
          <div className={styles.infoPanelContent}>
            <p>
              The Startup Barometer is a quarterly survey conducted among Finnish Startup Community members to measure sentiment in the startup ecosystem.
            </p>
            <p>
              It tracks three key indicators for the past and next three months:
            </p>
            <ul>
              <li>Financial situation of the company</li>
              <li>Surrounding economic conditions</li>
              <li>Changes in number of employees</li>
            </ul>
            <p>
              Results are presented as balance figures (share positive − share negative), ranging from −100 (fully pessimistic) to +100 (fully optimistic).
            </p>
            <p>
              The quarterly average of all balance figures forms an overall sentiment indicator.
            </p>
            <p>
              The survey also collects insights on barriers to business growth.
            </p>
          </div>
        </div>
      )}

      {/* Helper text - Mobile: centered above tabs */}
      <p className={`${styles.helperText} ${styles.helperTextMobile}`}>
        Metrics
      </p>

      {/* Tab Navigation Container - Desktop: inline with "Metrics:" */}
      <div className={styles.tabsContainer}>
        <span className={`${styles.helperText} ${styles.helperTextDesktop}`}>
          Metrics:
        </span>
        <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${selectedTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className={styles.chartContainer}>
        {hasData && buildBarometerConfig ? (
          <GraphTemplate
            key={`barometer-${selectedTab}`}
            config={buildBarometerConfig}
            filterValue="all"
            onFilterChange={() => {}}
            chartId={`barometer-${selectedTab}` as ChartId}
          />
        ) : (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Barometer data coming soon</p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              The Startup Barometer results will be displayed here once data is available.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BarometerExplorer

