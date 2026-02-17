import type { GraphTemplateConfig } from '../components/GraphTemplate'

export interface EconomicImpactConfigParams {
  filter?: string
  windowWidth?: number
  chartColors?: any
  getXAxisInterval?: () => number
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
}

// Helper to find year column
const findYearColumn = (data: any[]): string => {
  if (data.length === 0) return 'Year'
  return Object.keys(data[0] || {}).find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('year') || 
           keyLower.includes('period') ||
           keyLower.includes('date') ||
           keyLower.includes('vuosi')
  }) || 'Year'
}

// Build revenue chart config
export function buildRevenueConfig(
  data: any[],
  params: EconomicImpactConfigParams = {}
): GraphTemplateConfig | null {
  if (!data || data.length === 0) return null

  const {
    filter = 'all',
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

  // Find revenue columns - check all rows since columns may not exist in first row
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()

  const revenueCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('revenue') || 
            keyLower.includes('liikevaihto') ||
            keyLower.includes('turnover') ||
            keyLower.includes('sales')) &&
            !keyLower.includes('early') &&
            !keyLower.includes('stage') &&
            !keyLower.includes('scaleup') &&
            !keyLower.includes('scale-up')
  })

  const earlyStageRevenueCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('revenue') || keyLower.includes('turnover') || keyLower.includes('liikevaihto')) &&
           (keyLower.includes('early') && keyLower.includes('stage'))
  })

  const scaleupRevenueCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('revenue') || keyLower.includes('turnover')) &&
           (keyLower.includes('scaleup') || keyLower.includes('scale-up'))
  })

  if (!revenueCol) return null

  const yearKey = findYearColumn(data)
  
  // Prepare chart data based on filter
  const getChartData = () => {
    let selectedColumn = revenueCol
    if (filter === 'early-stage' && earlyStageRevenueCol) {
      selectedColumn = earlyStageRevenueCol
    } else if (filter === 'later-stage' && scaleupRevenueCol) {
      selectedColumn = scaleupRevenueCol
    }

    return {
      column: selectedColumn,
      data: data
        .filter(row => {
          const value = row[selectedColumn]
          return value !== undefined && typeof value === 'number' && value >= 0
        })
        .map(row => {
          const year = row[yearKey] || 'N/A'
          const value = row[selectedColumn]
          return {
            name: String(year),
            value: value / 1000000000, // Convert to billions
            originalValue: value
          }
        })
        .sort((a, b) => {
          const yearA = parseInt(a.name)
          const yearB = parseInt(b.name)
          if (!isNaN(yearA) && !isNaN(yearB)) {
            return yearA - yearB
          }
          return 0
        })
    }
  }

  const { column: selectedColumn, data: chartData } = getChartData()
  let currentLabel = 'Total Revenue'
  if (filter === 'early-stage') {
    currentLabel = 'Early Stage Revenue'
  } else if (filter === 'later-stage') {
    currentLabel = 'Later-Stage Revenue'
  }

  const chartTitle = 'Startup Revenue'

  // Build filter options
  const filterOptions = [
    { value: 'all', label: 'All Revenue' }
  ]
  if (earlyStageRevenueCol) {
    filterOptions.push({ value: 'early-stage', label: 'Early-Stage' })
  }
  if (scaleupRevenueCol) {
    filterOptions.push({ value: 'later-stage', label: 'Later-Stage' })
  }

  return {
    data: chartData,
    title: chartTitle,
    dataLabel: currentLabel,
    filtersConfig: {
      enabled: true,
      options: filterOptions,
      defaultFilter: 'all',
      filterKey: 'revenueFilter'
    },
    // Debug info (only populated when needed)
    _debug: {
      filter,
      columnUsed: selectedColumn || 'unknown'
    },
    yAxisConfig: {
      formatter: (value: number) => `€${value.toFixed(1)}B`,
      width: 35
    },
    tooltipConfig: {
      formatter: (_value: number, originalValue: number, label: string) => {
        const billions = originalValue / 1000000000
        return [`€${billions.toFixed(2)}B`, label]
      }
    },
    styleConfig: {
      strokeColor: '#A580F2',
      gradientId: 'gradient-filterable-revenue',
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
    isRevenueValue: true
  }
}

// Build employees chart config
export function buildEmployeesConfig(
  data: any[],
  params: EconomicImpactConfigParams = {}
): GraphTemplateConfig | null {
  if (!data || data.length === 0) return null

  const {
    filter = 'all',
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

  // Find employees columns - check all rows since columns may not exist in first row
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()

  const employeesCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('employees') || 
            keyLower.includes('employee') ||
            keyLower.includes('employment') ||
            keyLower.includes('jobs') ||
            keyLower.includes('workers') ||
            keyLower.includes('työlliset')) &&
            !keyLower.includes('finland') &&
            !keyLower.includes('suomi') &&
            !keyLower.includes('share')
  })

  const employeesInFinlandCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('employees') || 
            keyLower.includes('employee') ||
            keyLower.includes('employment') ||
            keyLower.includes('jobs') ||
            keyLower.includes('workers') ||
            keyLower.includes('työlliset')) &&
            (keyLower.includes('finland') || keyLower.includes('suomi'))
  })

  if (!employeesCol && !employeesInFinlandCol) return null

  const yearKey = findYearColumn(data)

  const getChartData = () => {
    const selectedColumn = filter === 'finland' && employeesInFinlandCol 
      ? employeesInFinlandCol 
      : employeesCol

    if (!selectedColumn) return []

    return data
      .filter(row => {
        const value = row[selectedColumn]
        return value !== undefined && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[selectedColumn]
        return {
          name: String(year),
          value: value,
          originalValue: value
        }
      })
      .sort((a, b) => {
        const yearA = parseInt(a.name)
        const yearB = parseInt(b.name)
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
  }

  const chartData = getChartData()
  if (chartData.length === 0) return null

  const currentLabel = filter === 'finland' ? 'Employees in Finland' : 'Total Employees'

  const filterOptions = [
    { value: 'all', label: 'All Employees' }
  ]
  if (employeesInFinlandCol) {
    filterOptions.push({ value: 'finland', label: 'Finland Only' })
  }

  return {
    data: chartData,
    title: 'Number of Employees',
    dataLabel: currentLabel,
    filtersConfig: {
      enabled: true,
      options: filterOptions,
      defaultFilter: 'all',
      filterKey: 'employeesFilter'
    },
    yAxisConfig: {
      formatter: (value: number) => value.toLocaleString(),
      width: 35
    },
    tooltipConfig: {
      formatter: (_value: number, originalValue: number, label: string) => {
        return [originalValue.toLocaleString(), label]
      }
    },
    styleConfig: {
      strokeColor: '#A580F2',
      gradientId: 'gradient-filterable-employees',
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

// Build firms chart config
export function buildFirmsConfig(
  data: any[],
  params: EconomicImpactConfigParams = {}
): GraphTemplateConfig | null {
  if (!data || data.length === 0) return null

  const {
    filter = 'all',
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

  // Find firms columns - check all rows since columns may not exist in first row
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()

  const firmsCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('firms') || 
            keyLower.includes('firm') ||
            keyLower.includes('companies') ||
            keyLower.includes('company') ||
            keyLower.includes('startups') ||
            keyLower.includes('startup') ||
            keyLower.includes('yritykset') ||
            keyLower.includes('yritys')) &&
            !keyLower.includes('number') &&
            !keyLower.includes('finland') &&
            !keyLower.includes('suomi') &&
            !keyLower.includes('early') &&
            !keyLower.includes('stage') &&
            !keyLower.includes('scaleup')
  })

  const firmsInFinlandCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('firms') || 
            keyLower.includes('firm') ||
            keyLower.includes('companies') ||
            keyLower.includes('company') ||
            keyLower.includes('startups') ||
            keyLower.includes('startup') ||
            keyLower.includes('yritykset') ||
            keyLower.includes('yritys')) &&
            (keyLower.includes('finland') || keyLower.includes('suomi'))
  })

  const numberStartupsCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower === 'number startups' || 
           keyLower === 'number of startups'
  })

  const numberScaleupsCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower === 'number scaleups' || 
           keyLower === 'number of scaleups'
  })

  if (!firmsCol && !numberStartupsCol && !numberScaleupsCol) return null

  const yearKey = findYearColumn(data)

  const getChartData = () => {
    let selectedColumn = firmsCol || numberStartupsCol
    
    if (filter === 'finland' && firmsInFinlandCol) {
      selectedColumn = firmsInFinlandCol
    } else if (filter === 'early-stage' && numberStartupsCol) {
      selectedColumn = numberStartupsCol
    } else if (filter === 'later-stage' && numberScaleupsCol) {
      selectedColumn = numberScaleupsCol
    }

    if (!selectedColumn) return []

    return data
      .filter(row => {
        const value = row[selectedColumn!]
        return value !== undefined && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[selectedColumn!]
        return {
          name: String(year),
          value: value,
          originalValue: value
        }
      })
      .sort((a, b) => {
        const yearA = parseInt(a.name)
        const yearB = parseInt(b.name)
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
  }

  const chartData = getChartData()
  if (chartData.length === 0) return null

  let currentLabel = 'Active firms'
  if (filter === 'finland') {
    currentLabel = 'Firms in Finland'
  } else if (filter === 'early-stage') {
    currentLabel = 'Number of Startups'
  } else if (filter === 'later-stage') {
    currentLabel = 'Number of Scaleups'
  }

  const filterOptions = [
    { value: 'all', label: 'All Firms' }
  ]
  if (firmsInFinlandCol) {
    filterOptions.push({ value: 'finland', label: 'Finland Only' })
  }
  if (numberStartupsCol) {
    filterOptions.push({ value: 'early-stage', label: 'Early-Stage' })
  }
  if (numberScaleupsCol) {
    filterOptions.push({ value: 'later-stage', label: 'Later-Stage' })
  }

  return {
    data: chartData,
    title: 'Active firms',
    dataLabel: currentLabel,
    filtersConfig: {
      enabled: true,
      options: filterOptions,
      defaultFilter: 'all',
      filterKey: 'firmsFilter'
    },
    yAxisConfig: {
      formatter: (value: number) => value.toLocaleString(),
      width: 35
    },
    tooltipConfig: {
      formatter: (_value: number, originalValue: number, label: string) => {
        return [originalValue.toLocaleString(), label]
      }
    },
    styleConfig: {
      strokeColor: '#A580F2',
      gradientId: 'gradient-filterable-firms',
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

// Build RDI chart config
export function buildRdiConfig(
  data: any[],
  params: EconomicImpactConfigParams = {}
): GraphTemplateConfig | null {
  if (!data || data.length === 0) return null

  const {
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

  // Find RDI columns
  const rdiColumns = Object.keys(data[0] || {}).filter(col => {
    const colLower = col.toLowerCase()
    return !colLower.includes('year') && 
           !colLower.includes('period') && 
           !colLower.includes('date') &&
           !colLower.includes('vuosi') &&
           (colLower.includes('rdi') || 
            colLower.includes('r&d') || 
            colLower.includes('investments') ||
            colLower.includes('research') ||
            colLower.includes('development'))
  })
  
  if (rdiColumns.length === 0) return null
  
  // Use first RDI metric
  const metric = rdiColumns[0]
  const metricLower = metric.toLowerCase()
  const isRevenue = metricLower.includes('investment') || 
                   metricLower.includes('rdi') || 
                   metricLower.includes('r&d')
  
  const yearKey = findYearColumn(data)
  
  // Prepare chart data
  const chartData = data
    .filter(row => row[metric] !== undefined && typeof row[metric] === 'number')
    .map(row => {
      const year = row[yearKey] || 
                  row['vuosi'] || 
                  row['Vuosi'] ||
                  row['Period'] || 
                  row['Date'] || 
                  'N/A'
      const value = row[metric]
      return {
        name: String(year),
        value: isRevenue ? value / 1000000000 : value,
        originalValue: value
      }
    })
    .sort((a, b) => {
      const yearA = parseInt(a.name)
      const yearB = parseInt(b.name)
      if (!isNaN(yearA) && !isNaN(yearB)) {
        return yearA - yearB
      }
      return 0
    })
  
  if (chartData.length === 0) return null
  
  const formatColumnName = (name: string): string => {
    let formatted = name.replace(/r&d/gi, 'R&D')
    return formatted
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => {
        if (word === 'R&D') {
          return 'R&D'
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }
  
  const formattedName = formatColumnName(metric)
  const chartTitle = 'R&D investments'
  
  return {
    data: chartData,
    title: chartTitle,
    dataLabel: formattedName,
    filtersConfig: {
      enabled: false,
      options: [],
      defaultFilter: 'all',
      filterKey: 'rdiFilter'
    },
    yAxisConfig: {
      formatter: (value: number) => {
        if (isRevenue) {
          return `€${value.toFixed(1)}B`
        }
        return value.toLocaleString()
      },
      width: 35
    },
    tooltipConfig: {
      formatter: (_value: number, originalValue: number, label: string) => {
        if (isRevenue) {
          const billions = originalValue / 1000000000
          return [`€${billions.toFixed(2)}B`, label]
        }
        return [originalValue.toLocaleString(), label]
      }
    },
    styleConfig: {
      strokeColor: '#A580F2',
      gradientId: 'gradient-rdi',
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
    isRevenueValue: isRevenue
  }
}
