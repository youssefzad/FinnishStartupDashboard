import type { GraphTemplateConfig } from '../components/GraphTemplate'

export interface BarometerConfigParams {
  tab?: 'financial' | 'employees' | 'economy'
  windowWidth?: number
  chartColors?: any
  getXAxisInterval?: () => number
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
}

// Helper to find Time column
const findTimeColumn = (data: any[]): string | null => {
  if (data.length === 0) return null
  const headers = Object.keys(data[0])
  return headers.find(h => {
    const hLower = h.toLowerCase()
    return hLower.includes('time') || hLower.includes('date') || hLower.includes('period')
  }) || null
}

// Get column names for a tab
function getTabColumns(data: any[], tab: 'financial' | 'employees' | 'economy'): { past: string | null; next: string | null } {
  if (data.length === 0) return { past: null, next: null }
  
  const headers = Object.keys(data[0])
  
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

// Parse quarter/year string (e.g., "Q2/2022") to a sortable value
function parseQuarterYear(timeStr: string): { year: number; quarter: number } | null {
  const match = String(timeStr).match(/Q(\d)\/(\d{4})/)
  if (match) {
    return {
      quarter: parseInt(match[1], 10),
      year: parseInt(match[2], 10)
    }
  }
  return null
}

// Build barometer config for a specific tab
export function buildBarometerConfig(
  data: any[],
  params: BarometerConfigParams = {}
): GraphTemplateConfig | null {
  if (data.length === 0) return null

  const {
    tab = 'financial',
    windowWidth = 1200,
    chartColors = {
      grid: 'rgba(255, 255, 255, 0.1)',
      axis: 'rgba(255, 255, 255, 0.5)',
      tick: 'rgba(255, 255, 255, 0.7)',
      tooltipBg: 'rgba(17, 17, 17, 0.95)',
      tooltipText: '#ffffff'
    },
    getXAxisInterval = () => 0,
    onShowTable,
    onFullscreen,
    showTable = false
  } = params

  const timeCol = findTimeColumn(data)
  if (!timeCol) return null

  const { past, next } = getTabColumns(data, tab)
  if (!past && !next) return null

  // Prepare chart data
  const chartData = data
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
      
      if (parsedA && parsedB) {
        if (parsedA.year !== parsedB.year) {
          return parsedA.year - parsedB.year
        }
        return parsedA.quarter - parsedB.quarter
      }
      
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
  const getTabTitle = (tabName: 'financial' | 'employees' | 'economy'): string => {
    switch (tabName) {
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
    title: getTabTitle(tab),
    titleNote: 'Balance = % very positive + (0.5*positive) - (0.5*%negative) - % very negative',
    dataLabel: 'Sentiment',
    series: series,
    yAxisConfig: {
      formatter: (value: number) => value.toFixed(1),
      domain: [-50, 50],
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
}
