import type { BarChartTemplateConfig } from '../components/BarChartTemplate'

export interface UnicornConfigParams {
  filter?: string // 'all' | 'finnish' | 'finnish-background'
  windowWidth?: number
  chartColors?: {
    grid: string
    axis: string
    tick: string
    tooltipBg: string
    tooltipText: string
  }
  getXAxisInterval?: () => number
  onShowTable?: () => void
  onFullscreen?: () => void
  showTable?: boolean
  onFilterChange?: (filter: string) => void
}

// Normalize unicorns data
interface UnicornRow {
  firm: string
  valuation: number
  isFinnish: boolean
  isFinnishBackground: boolean
}

function normalizeUnicornData(data: any[]): UnicornRow[] {
  return data
    .map(row => {
      const firm = row['Firm'] || row['firm'] || ''
      const valuation = row['Last valuation'] || row['Last valuation'] || row['lastValuation'] || row['valuation'] || null
      const isFinnish = row['Finnish'] === true || row['Finnish'] === 1 || row['finnish'] === true || row['finnish'] === 1
      const isFinnishBackground = row['Finnish background'] === true || row['Finnish background'] === 1 || 
                                   row['Finnish background'] === true || row['Finnish background'] === 1 ||
                                   row['finnishBackground'] === true || row['finnishBackground'] === 1

      // Filter out rows missing firm or valuation
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
    // Billions
    const billions = value / 1000000000
    return `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`
  } else if (value >= 1000000) {
    // Millions
    const millions = value / 1000000
    return `€${millions.toFixed(millions >= 10 ? 1 : 2)}M`
  } else if (value >= 1000) {
    // Thousands
    const thousands = value / 1000
    return `€${thousands.toFixed(1)}K`
  }
  return `€${value.toLocaleString()}`
}

// Build unicorns valuation chart config
export function buildUnicornConfig(
  data: any[],
  params: UnicornConfigParams = {}
): BarChartTemplateConfig | null {
  const normalizedData = normalizeUnicornData(data)
  
  if (normalizedData.length === 0) return null

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
    getXAxisInterval = (() => {
      // For unicorns chart, always show all labels
      return 0
    }),
    onShowTable,
    onFullscreen,
    showTable = false,
    onFilterChange
  } = params

  // Apply filter
  let filteredData = normalizedData
  if (filter === 'finnish') {
    filteredData = normalizedData.filter(row => row.isFinnish === true)
  } else if (filter === 'finnish-background') {
    filteredData = normalizedData.filter(row => row.isFinnishBackground === true)
  }

  // Always show all filtered data (no Top N limit)
  const chartData = filteredData

  // Convert to chart format
  const barChartData = chartData.map(row => ({
    name: row.firm,
    value: row.valuation,
    originalValue: row.valuation, // Keep original for tooltip
    isFinnish: row.isFinnish,
    isFinnishBackground: row.isFinnishBackground
  }))

  // Build filters config (using toggleButtons pattern)
  const filtersConfig = {
    enabled: true,
    toggleButtons: [
      {
        label: 'All',
        isActive: filter === 'all',
        onClick: () => onFilterChange?.('all')
      },
      {
        label: 'Founded in Finland',
        isActive: filter === 'finnish',
        onClick: () => onFilterChange?.('finnish')
      },
      {
        label: 'Finnish background',
        isActive: filter === 'finnish-background',
        onClick: () => onFilterChange?.('finnish-background')
      }
    ]
  }

  // No Top N config - always show all firms

  // Build bar series config
  const barSeries: Array<{
    dataKey: string
    label: string
    color: string
    gradientId: string
    gradientStartColor: string
    gradientEndColor: string
    gradientStartOpacity: number
    gradientEndOpacity: number
    visible: boolean
  }> = [
    {
      dataKey: 'value',
      label: 'Valuation',
      color: '#A580F2', // Purple accent color
      gradientId: 'gradient-unicorn-valuation',
      gradientStartColor: '#A580F2',
      gradientEndColor: '#A580F2',
      gradientStartOpacity: 0.8,
      gradientEndOpacity: 0.3,
      visible: true
    }
  ]

  // Build X-axis config for Unicorns chart
  // Truncate long firm names with ellipsis, show full name in tooltip
  const truncateFirmName = (name: string, maxLength: number = 12): string => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength - 3) + '...'
  }

  // Use horizontal bars on small screens for better readability
  const useHorizontalLayout = windowWidth <= 768

  // Build Y-axis formatter (used for both vertical and horizontal bars)
  const yAxisFormatter = (value: number) => {
    // Value is already in raw units (e.g., 11000000000)
    if (value >= 1000000000) {
      const billions = value / 1000000000
      return `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`
    } else if (value >= 1000000) {
      const millions = value / 1000000
      return `€${millions.toFixed(millions >= 10 ? 1 : 2)}M`
    }
    return formatValuation(value)
  }

  // Build axis configs: Desktop (vertical bars) and Mobile (horizontal bars)
  // Desktop: ALWAYS show all labels regardless of filter/topN (interval=0, sufficient height/angle)
  // Mobile: ALWAYS show all labels on Y-axis (interval=0, sufficient width)
  const xAxisConfig = useHorizontalLayout ? {
    // Horizontal bars: X-axis is numeric (valuation), Y-axis is category (firm names)
    // X-axis config is for the numeric axis (bottom)
    fontSize: windowWidth <= 640 ? 9 : 10,
    tickMargin: 10,
    height: 45
  } : {
    // Vertical bars: X-axis is category (firm names), ALWAYS show all labels
    // For many firms (>=16), use steeper angle, smaller font, more height
    interval: 0, // Force all firm names to show (no skipping)
    ...(filteredData.length >= 16 ? {
      fontSize: 8, // Smaller font for many labels
      angle: -60, // Steeper angle to prevent overlap
      height: 170, // More height for steeper rotated labels
      tickMargin: 12 // Extra spacing between ticks
    } : {
      fontSize: 9, // Standard font for fewer labels
      angle: -45, // Standard rotation
      height: 120, // Standard height
      tickMargin: undefined // Use default
    }),
    tickFormatter: (value: string) => truncateFirmName(value, windowWidth <= 640 ? 10 : 12)
  }

  // Y-axis config: For vertical bars, this is the numeric axis (left)
  // For horizontal bars, this controls the category axis (firm names on left)
  const yAxisConfig = useHorizontalLayout ? {
    formatter: yAxisFormatter, // Keep formatter for numeric axis (used for X-axis in horizontal layout)
    interval: 0, // ALWAYS show all firm names on Y-axis (no skipping)
    width: windowWidth <= 640 ? 150 : 140, // Increased width for long names like "CRF Health"
    tickFormatter: (value: string | number) => {
      // Truncate long firm names with ellipsis, but show every category
      const strValue = String(value)
      const maxLength = windowWidth <= 640 ? 14 : 16
      if (strValue.length <= maxLength) return strValue
      return strValue.substring(0, maxLength - 3) + '...'
    },
    fontSize: windowWidth <= 640 ? 9 : 10
  } : {
    formatter: yAxisFormatter,
    width: 60 // Wider for currency labels (for vertical bars numeric axis)
  }

  // Build tooltip config (shows full firm name)
  const tooltipConfig = {
    formatter: (value: number, name: string) => {
      // value is the chart value (raw valuation number)
      // name is the firm name (full name, not truncated)
      return [formatValuation(value), name] as [string, string]
    }
  }

  // Context text
  const contextText = `Finnish unicorns represent companies valued at over $1 billion. ${filteredData.length} ${filter === 'all' ? 'total' : filter === 'finnish' ? 'Finnish-founded' : 'Finnish background'} unicorn${filteredData.length !== 1 ? 's' : ''}.`

  // Prepare table data (respects filter and topN - uses the same filtered/limited data as chart)
  const tableDataForDisplay = barChartData.map(row => ({
    name: row.name,
    value: row.value,
    isFinnish: row.isFinnish ? 'Yes' : 'No',
    isFinnishBackground: row.isFinnishBackground ? 'Yes' : 'No'
  }))

  return {
    data: barChartData,
    title: 'Unicorn Valuations',
    dataLabel: 'Valuation',
    chartType: 'bar',
    barLayout: useHorizontalLayout ? 'horizontal' : 'vertical',
    barSeries,
    filtersConfig,
    yAxisConfig,
    xAxisConfig,
    tooltipConfig,
    contextText,
    onShowTable,
    onFullscreen,
    showTable,
    chartColors,
    windowWidth,
    getXAxisInterval,
    isRevenueValue: true, // Use revenue formatting
    tableData: tableDataForDisplay,
    tableColumns: [
      { key: 'name', label: 'Firm' },
      { key: 'value', label: 'Valuation' },
      { key: 'isFinnish', label: 'Founded in Finland' },
      { key: 'isFinnishBackground', label: 'Finnish Background' }
    ],
    tableFirstColumnLabel: 'Firm',
    tableHiddenKeys: ['name']
  }
}

