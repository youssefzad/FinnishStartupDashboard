import type { BarChartTemplateConfig } from '../components/BarChartTemplate'

export interface WorkforceConfigParams {
  view?: string // 'none' | 'male-share' | 'female-share' | 'finnish-share' | 'foreign-share'
  showMaleBar?: boolean
  showFemaleBar?: boolean
  showFinnishBar?: boolean
  showForeignBar?: boolean
  windowWidth?: number
  chartColors?: any
  getXAxisInterval?: () => number
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
  // Callbacks for embed mode URL updates
  onViewChange?: (view: string) => void
  onToggleBar?: (bar: 'male' | 'female' | 'finnish' | 'foreign', visible: boolean) => void
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

// Process gender data from employeesGenderData
function processGenderData(data: any[]): Array<{ name: string; Male: number; Female: number; Total: number }> {
  if (data.length === 0) return []
  
  const yearKey = findYearColumn(data)
  
  const maleCol = Object.keys(data[0] || {}).find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('male') || keyLower.includes('mies') || keyLower.includes('man')) && 
           !keyLower.includes('female') && 
           !keyLower.includes('nainen') &&
           !keyLower.includes('woman')
  })
  
  const femaleCol = Object.keys(data[0] || {}).find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('female') || 
           keyLower.includes('nainen') || 
           keyLower.includes('woman')
  })
  
  if (!maleCol || !femaleCol) return []
  
  return data
    .filter(row => 
      row[maleCol] !== undefined && typeof row[maleCol] === 'number' &&
      row[femaleCol] !== undefined && typeof row[femaleCol] === 'number'
    )
    .map(row => {
      const year = row[yearKey] || 'N/A'
      return {
        name: String(year),
        Male: row[maleCol] as number,
        Female: row[femaleCol] as number,
        Total: (row[maleCol] as number) + (row[femaleCol] as number)
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

// Process immigration data from employeesGenderData
function processImmigrationData(data: any[]): Array<{ name: string; Finnish: number; Foreign: number; Total: number }> {
  if (data.length === 0) return []
  
  const yearKey = findYearColumn(data)
  
  // Check all rows for columns since immigration data may not exist in early years (2005-2009)
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()
  
  const finnishCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('finnish') && keyLower.includes('background')) ||
           keyLower === 'finnish background'
  })
  
  const foreignCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('foreign') && keyLower.includes('background')) ||
           keyLower === 'foreign background'
  })
  
  if (!finnishCol || !foreignCol) return []
  
  return data
    .filter(row => {
      // Ensure both values exist and are valid numbers (including 0)
      const finnish = row[finnishCol]
      const foreign = row[foreignCol]
      return finnish !== undefined && finnish !== null && 
             foreign !== undefined && foreign !== null &&
             typeof finnish === 'number' && !isNaN(finnish) &&
             typeof foreign === 'number' && !isNaN(foreign)
    })
    .map(row => {
      const year = row[yearKey]
      // Ensure year is parsed as number for proper sorting
      const yearNum = typeof year === 'number' ? year : (typeof year === 'string' ? parseInt(year) : null)
      return {
        name: yearNum !== null && !isNaN(yearNum) ? String(yearNum) : String(year || 'N/A'),
        Finnish: row[finnishCol] as number,
        Foreign: row[foreignCol] as number,
        Total: (row[finnishCol] as number) + (row[foreignCol] as number)
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

// Build gender chart config
export function buildGenderConfig(
  data: any[],
  params: WorkforceConfigParams = {}
): BarChartTemplateConfig | null {
  const genderData = processGenderData(data)
  if (genderData.length === 0) return null

  const {
    view = 'none',
    showMaleBar = true,
    showFemaleBar = true,
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
    showTable = false,
    onViewChange,
    onToggleBar
  } = params

  // Find share columns if they exist - check all rows since columns may not exist in first row
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()

  const shareOfFemalesCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('share') && 
           (keyLower.includes('female') || keyLower.includes('women') || keyLower.includes('woman'))
  })

  const shareOfMalesCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('share') && 
           (keyLower.includes('male') || keyLower.includes('men') || keyLower.includes('man')) &&
           !keyLower.includes('female') && !keyLower.includes('women') && !keyLower.includes('woman')
  })

  const yearKey = findYearColumn(data)

  // Process share data if available
  let shareOfFemalesData: Array<{ name: string; value: number }> = []
  let shareOfMalesData: Array<{ name: string; value: number }> = []

  if (shareOfFemalesCol) {
    shareOfFemalesData = data
      .filter(row => row[shareOfFemalesCol] !== undefined && typeof row[shareOfFemalesCol] === 'number')
      .map(row => ({
        name: String(row[yearKey] || 'N/A'),
        value: row[shareOfFemalesCol] as number
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.name)
        const yearB = parseInt(b.name)
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
  }

  if (shareOfMalesCol) {
    shareOfMalesData = data
      .filter(row => row[shareOfMalesCol] !== undefined && typeof row[shareOfMalesCol] === 'number')
      .map(row => ({
        name: String(row[yearKey] || 'N/A'),
        value: row[shareOfMalesCol] as number
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.name)
        const yearB = parseInt(b.name)
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
  }

  const isShareView = view !== 'none'
  let chartData: any[] = []
  let chartTitle = ''
  let currentLabel = ''
  let chartColor = '#E94B7E'

  if (view === 'male-share' && shareOfMalesData.length > 0) {
    chartData = shareOfMalesData
    chartTitle = 'Share of male employees'
    currentLabel = 'Share of Males'
    chartColor = '#4A90E2'
  } else if (view === 'female-share' && shareOfFemalesData.length > 0) {
    chartData = shareOfFemalesData
    chartTitle = 'Share of female employees'
    currentLabel = 'Share of Females'
    chartColor = '#E94B7E'
  } else {
    chartData = genderData.map(row => ({
      name: row.name,
      ...(showMaleBar ? { Male: row.Male } : {}),
      ...(showFemaleBar ? { Female: row.Female } : {})
    }))
    chartTitle = 'Gender distribution of startup workers'
    currentLabel = 'Employees'
  }

  const barSeries = isShareView ? undefined : [
    {
      dataKey: 'Male',
      label: 'Male',
      color: '#4A90E2',
      gradientId: 'gradient-male-bar',
      gradientStartColor: '#4A90E2',
      gradientEndColor: '#4A90E2',
      gradientStartOpacity: 0.9,
      gradientEndOpacity: 0.6,
      visible: showMaleBar,
      onToggle: () => {}
    },
    {
      dataKey: 'Female',
      label: 'Female',
      color: '#E94B7E',
      gradientId: 'gradient-female-bar',
      gradientStartColor: '#E94B7E',
      gradientEndColor: '#E94B7E',
      gradientStartOpacity: 0.9,
      gradientEndOpacity: 0.6,
      visible: showFemaleBar,
      onToggle: () => {}
    }
  ]

  return {
    data: chartData,
    title: chartTitle,
    dataLabel: currentLabel,
    chartType: isShareView ? 'area' : 'bar',
    barSeries,
    areaConfig: isShareView ? {
      dataKey: 'value',
      color: chartColor,
      gradientId: `gradient-${view}`,
      gradientStartColor: chartColor,
      gradientEndColor: chartColor,
      gradientStartOpacity: 0.3,
      gradientEndOpacity: 0.05
    } : undefined,
    filtersConfig: {
      enabled: true,
      toggleButtons: [
        {
          label: 'Male',
          isActive: view === 'none' && showMaleBar,
          onClick: () => {
            if (onToggleBar) {
              onToggleBar('male', !showMaleBar)
            }
          }
        },
        {
          label: 'Female',
          isActive: view === 'none' && showFemaleBar,
          onClick: () => {
            if (onToggleBar) {
              onToggleBar('female', !showFemaleBar)
            }
          }
        }
      ],
      viewModeButtons: [
        ...(shareOfMalesCol ? [{
          label: 'Share of Males',
          value: 'male-share',
          isActive: view === 'male-share',
          onClick: () => {
            if (onViewChange) {
              onViewChange(view === 'male-share' ? 'none' : 'male-share')
            }
          }
        }] : []),
        ...(shareOfFemalesCol ? [{
          label: 'Share of Females',
          value: 'female-share',
          isActive: view === 'female-share',
          onClick: () => {
            if (onViewChange) {
              onViewChange(view === 'female-share' ? 'none' : 'female-share')
            }
          }
        }] : [])
      ]
    },
    yAxisConfig: {
      formatter: (value: number) => isShareView ? `${value.toFixed(1)}%` : value.toLocaleString(),
      width: isShareView ? 35 : undefined
    },
    tooltipConfig: {
      formatter: (value: number, name: string) => {
        if (isShareView) {
          return [`${value.toFixed(2)}%`, currentLabel]
        }
        return [value.toLocaleString(), name]
      }
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

// Build immigration chart config
export function buildImmigrationConfig(
  data: any[],
  params: WorkforceConfigParams = {}
): BarChartTemplateConfig | null {
  const immigrationData = processImmigrationData(data)
  if (immigrationData.length === 0) return null

  const {
    view = 'none',
    showFinnishBar = true,
    showForeignBar = true,
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
    showTable = false,
    onViewChange,
    onToggleBar
  } = params

  const yearKey = findYearColumn(data)

  // Find share columns if they exist - check all rows since columns may not exist in first row
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  
  const allColumns = getAllColumnNames()

  const shareOfFinnishCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('share') && keyLower.includes('finnish')
  })

  const shareOfForeignCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return keyLower.includes('share') && keyLower.includes('foreign')
  })

  // Process share data - use existing columns or compute from counts
  let shareOfFinnishData: Array<{ name: string; value: number }> = []
  let shareOfForeignData: Array<{ name: string; value: number }> = []

  // Find Finnish and Foreign background columns for computing shares
  const finnishCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('finnish') && keyLower.includes('background')) ||
           keyLower === 'finnish background'
  })
  
  const foreignCol = allColumns.find(key => {
    const keyLower = key.toLowerCase()
    return (keyLower.includes('foreign') && keyLower.includes('background')) ||
           keyLower === 'foreign background'
  })

  if (shareOfFinnishCol) {
    // Use existing share column
    shareOfFinnishData = data
      .filter(row => {
        const value = row[shareOfFinnishCol]
        return value !== undefined && value !== null && 
               typeof value === 'number' && !isNaN(value)
      })
      .map(row => {
        const rawValue = row[shareOfFinnishCol] as number
        // Convert to percentage if value is decimal (0-1), otherwise assume it's already percentage
        const percentage = rawValue <= 1 ? rawValue * 100 : rawValue
        const year = row[yearKey]
        const yearNum = typeof year === 'number' ? year : (typeof year === 'string' ? parseInt(year) : null)
        return {
          name: yearNum !== null && !isNaN(yearNum) ? String(yearNum) : String(year || 'N/A'),
          value: percentage
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
  } else if (finnishCol && foreignCol) {
    // Compute share from counts
    shareOfFinnishData = data
      .filter(row => 
        row[finnishCol] !== undefined && typeof row[finnishCol] === 'number' &&
        row[foreignCol] !== undefined && typeof row[foreignCol] === 'number'
      )
      .map(row => {
        const finnish = row[finnishCol] as number
        const foreign = row[foreignCol] as number
        const total = finnish + foreign
        // Handle divide-by-zero safely
        const percentage = total > 0 ? (finnish / total) * 100 : 0
        return {
          name: String(row[yearKey] || 'N/A'),
          value: percentage
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

  if (shareOfForeignCol) {
    // Use existing share column
    shareOfForeignData = data
      .filter(row => {
        const value = row[shareOfForeignCol]
        return value !== undefined && value !== null && 
               typeof value === 'number' && !isNaN(value)
      })
      .map(row => {
        const rawValue = row[shareOfForeignCol] as number
        // Convert to percentage if value is decimal (0-1), otherwise assume it's already percentage
        const percentage = rawValue <= 1 ? rawValue * 100 : rawValue
        const year = row[yearKey]
        const yearNum = typeof year === 'number' ? year : (typeof year === 'string' ? parseInt(year) : null)
        return {
          name: yearNum !== null && !isNaN(yearNum) ? String(yearNum) : String(year || 'N/A'),
          value: percentage
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
  } else if (finnishCol && foreignCol) {
    // Compute share from counts
    shareOfForeignData = data
      .filter(row => 
        row[finnishCol] !== undefined && typeof row[finnishCol] === 'number' &&
        row[foreignCol] !== undefined && typeof row[foreignCol] === 'number'
      )
      .map(row => {
        const finnish = row[finnishCol] as number
        const foreign = row[foreignCol] as number
        const total = finnish + foreign
        // Handle divide-by-zero safely
        const percentage = total > 0 ? (foreign / total) * 100 : 0
        return {
          name: String(row[yearKey] || 'N/A'),
          value: percentage
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

  const isShareView = view !== 'none'
  let chartData: any[] = []
  let chartTitle = ''
  let currentLabel = ''
  let chartColor = '#9B59B6'

  if (view === 'finnish-share' && shareOfFinnishData.length > 0) {
    chartData = shareOfFinnishData
    chartTitle = 'Share of Finnish background employees in startups'
    currentLabel = 'Share of Finnish'
    chartColor = '#3498DB'
  } else if (view === 'foreign-share' && shareOfForeignData.length > 0) {
    chartData = shareOfForeignData
    chartTitle = 'Share of foreign background employees in startups'
    currentLabel = 'Share of Foreign'
    chartColor = '#9B59B6'
  } else {
    chartData = immigrationData.map(row => ({
      name: row.name,
      ...(showFinnishBar ? { Finnish: row.Finnish } : {}),
      ...(showForeignBar ? { Foreign: row.Foreign } : {})
    }))
    chartTitle = 'Immigration status'
    currentLabel = 'Employees'
  }

  const barSeries = isShareView ? undefined : [
    {
      dataKey: 'Finnish',
      label: 'Finnish',
      color: '#3498DB',
      gradientId: 'gradient-finnish-bar-immigration',
      gradientStartColor: '#3498DB',
      gradientEndColor: '#3498DB',
      gradientStartOpacity: 0.9,
      gradientEndOpacity: 0.6,
      visible: showFinnishBar,
      onToggle: () => {}
    },
    {
      dataKey: 'Foreign',
      label: 'Foreign',
      color: '#9B59B6',
      gradientId: 'gradient-foreign-bar-immigration',
      gradientStartColor: '#9B59B6',
      gradientEndColor: '#9B59B6',
      gradientStartOpacity: 0.9,
      gradientEndOpacity: 0.6,
      visible: showForeignBar,
      onToggle: () => {}
    }
  ]

  // Context text explaining the chart
  const getContextText = (): string => {
    return 'The immigration status of employees in startup-based firms shows the distribution between Finnish and foreign background workers over time.'
  }

  return {
    data: chartData,
    title: chartTitle,
    dataLabel: currentLabel,
    chartType: isShareView ? 'area' : 'bar',
    barSeries,
    areaConfig: isShareView ? {
      dataKey: 'value',
      color: chartColor,
      gradientId: `gradient-${view}`,
      gradientStartColor: chartColor,
      gradientEndColor: chartColor,
      gradientStartOpacity: 0.3,
      gradientEndOpacity: 0.05
    } : undefined,
    filtersConfig: {
      enabled: true,
      toggleButtons: [
        {
          label: 'Finnish',
          isActive: view === 'none' && showFinnishBar,
          onClick: () => {
            if (onToggleBar) {
              onToggleBar('finnish', !showFinnishBar)
            }
          }
        },
        {
          label: 'Foreign',
          isActive: view === 'none' && showForeignBar,
          onClick: () => {
            if (onToggleBar) {
              onToggleBar('foreign', !showForeignBar)
            }
          }
        }
      ],
      viewModeButtons: [
        ...(shareOfFinnishData.length > 0 ? [{
          label: 'Share of Finnish',
          value: 'finnish-share',
          isActive: view === 'finnish-share',
          onClick: () => {
            if (onViewChange) {
              onViewChange(view === 'finnish-share' ? 'none' : 'finnish-share')
            }
          }
        }] : []),
        ...(shareOfForeignData.length > 0 ? [{
          label: 'Share of Foreign',
          value: 'foreign-share',
          isActive: view === 'foreign-share',
          onClick: () => {
            if (onViewChange) {
              onViewChange(view === 'foreign-share' ? 'none' : 'foreign-share')
            }
          }
        }] : [])
      ]
    },
    contextText: getContextText(),
    yAxisConfig: {
      formatter: (value: number) => isShareView ? `${value.toFixed(1)}%` : value.toLocaleString(),
      width: isShareView ? 35 : undefined
    },
    tooltipConfig: {
      formatter: (value: number, name: string) => {
        if (isShareView) {
          return [`${value.toFixed(2)}%`, currentLabel]
        }
        return [value.toLocaleString(), name]
      }
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
