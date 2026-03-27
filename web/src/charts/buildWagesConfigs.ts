import type { GraphTemplateConfig } from '../components/GraphTemplate'

export interface WagesConfigParams {
  view?: 'all-workers' | 'by-gender'
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

function findColumn(data: any[], desired: string): string | null {
  if (!data || data.length === 0) return null
  const desiredLower = desired.toLowerCase().trim()

  // Search across all rows for maximum resilience (columns may appear later)
  const columnSet = new Set<string>()
  data.forEach(row => {
    Object.keys(row || {}).forEach(k => columnSet.add(k))
  })
  const allColumns = Array.from(columnSet)

  // Exact match (case-insensitive)
  const exact = allColumns.find(c => c.toLowerCase().trim() === desiredLower)
  if (exact) return exact

  // Contains match (case-insensitive)
  const contains = allColumns.find(c => c.toLowerCase().includes(desiredLower))
  return contains || null
}

export function buildWagesConfig(
  data: any[],
  params: WagesConfigParams = {}
): GraphTemplateConfig | null {
  if (!data || data.length === 0) return null

  const {
    view = 'all-workers',
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

  const YEAR_MIN = 2010
  const YEAR_MAX = 2022

  const parseNumeric = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null
    if (typeof value === 'number') return isNaN(value) ? null : value
    const cleaned = String(value).replace(/[,\s€$£¥\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '')
    const parsed = Number(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  const parseYear = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null
    const yearNum = typeof value === 'number' ? value : parseInt(String(value), 10)
    if (isNaN(yearNum)) return null
    return yearNum
  }

  const yearKey = findYearColumn(data)

  // Compatibility: prefer legacy female/male series when present.
  const femaleKey = findColumn(data, 'MeanpalkFemale') || findColumn(data, 'female')
  const maleKey = findColumn(data, 'MeanpalkMale') || findColumn(data, 'male')
  const meanAllKey = findColumn(data, 'MeanWageAll')
  const medianAllKey = findColumn(data, 'MedianWageAll')

  const hasGenderSeries = !!femaleKey && !!maleKey
  const hasAllSeries = !!meanAllKey && !!medianAllKey
  if (!hasGenderSeries && !hasAllSeries) return null

  const selectedView: 'all-workers' | 'by-gender' =
    view === 'by-gender'
      ? (hasGenderSeries ? 'by-gender' : 'all-workers')
      : (hasAllSeries ? 'all-workers' : 'by-gender')

  const chartData = data
    .map(row => {
      const year = parseYear(row?.[yearKey])
      if (year === null || year < YEAR_MIN || year > YEAR_MAX) return null

      if (selectedView === 'by-gender' && hasGenderSeries && femaleKey && maleKey) {
        const female = parseNumeric(row?.[femaleKey])
        const male = parseNumeric(row?.[maleKey])
        if (female === null || male === null) return null
        return {
          name: String(year),
          seriesA: female,
          seriesB: male
        }
      }

      if (selectedView === 'all-workers' && meanAllKey && medianAllKey) {
        const meanAll = parseNumeric(row?.[meanAllKey])
        const medianAll = parseNumeric(row?.[medianAllKey])
        if (meanAll === null || medianAll === null) return null
        return {
          name: String(year),
          seriesA: meanAll,
          seriesB: medianAll
        }
      }

      return null
    })
    .filter((row): row is { name: string; seriesA: number; seriesB: number } => row !== null)
    .sort((a, b) => {
      const yearA = parseInt(a.name)
      const yearB = parseInt(b.name)
      if (!isNaN(yearA) && !isNaN(yearB)) return yearA - yearB
      return 0
    })

  if (chartData.length === 0) return null

  return {
    data: chartData,
    title: selectedView === 'all-workers'
      ? 'Annual wages of all workers in startup-based firms'
      : 'Annual wages in startup-based firms by gender',
    titleNote: selectedView === 'all-workers'
      ? 'Mean and median annual wages'
      : 'Mean annual wages by gender',
    dataLabel: 'Wages',
    filtersConfig: {
      enabled: true,
      options: [
        ...(hasAllSeries ? [{ value: 'all-workers', label: 'All Workers' }] : []),
        ...(hasGenderSeries ? [{ value: 'by-gender', label: 'By Gender' }] : [])
      ],
      defaultFilter: hasAllSeries ? 'all-workers' : 'by-gender',
      filterKey: 'wagesView'
    },
    series: [
      {
        key: 'seriesA',
        label: selectedView === 'by-gender' ? 'Female' : 'Mean',
        color: '#E94B7E',
        style: 'solid',
        gradientId: 'gradient-wages-female',
        gradientStartColor: '#E94B7E',
        gradientEndColor: '#E94B7E',
        gradientStartOpacity: 0.25,
        gradientEndOpacity: 0.05
      },
      {
        key: 'seriesB',
        label: selectedView === 'by-gender' ? 'Male' : 'Median',
        color: '#4A90E2',
        style: 'solid',
        gradientId: 'gradient-wages-male',
        gradientStartColor: '#4A90E2',
        gradientEndColor: '#4A90E2',
        gradientStartOpacity: 0.22,
        gradientEndOpacity: 0.05
      }
    ],
    yAxisConfig: {
      formatter: (value: number) => `€${Math.round(value).toLocaleString()}`,
      width: 45,
      label: '€'
    },
    tooltipConfig: {
      formatter: (_value: number, originalValue: number, label: string) => {
        return [`€${Math.round(originalValue).toLocaleString()}`, label]
      }
    },
    styleConfig: {
      // Defaults (unused in multi-series except as fallback)
      strokeColor: '#A580F2',
      gradientId: 'gradient-wages',
      gradientStartColor: '#A580F2',
      gradientEndColor: '#A580F2',
      gradientStartOpacity: 0.2,
      gradientEndOpacity: 0.05,
      strokeWidth: 2
    },
    onShowTable,
    onFullscreen,
    showTable,
    chartColors,
    windowWidth,
    getXAxisInterval,
    _debug: {
      columnUsed: selectedView === 'by-gender'
        ? `${yearKey}, ${femaleKey}, ${maleKey}`
        : `${yearKey}, ${meanAllKey}, ${medianAllKey}`
    }
  }
}

