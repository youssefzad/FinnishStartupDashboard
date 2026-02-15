import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import GraphTemplate from './GraphTemplate'
import type { GraphTemplateConfig } from './GraphTemplate'
import BarChartTemplate from './BarChartTemplate'
import type { BarChartTemplateConfig } from './BarChartTemplate'
import './ExploreData.css'

// Chart contextual text configuration
const getChartContext = (chartName: string): string | null => {
  const contextMap: Record<string, string> = {
    'r&d-investments': 'R&D-investments in the startup sector have been increasing rapidly. In 2005 we only had € 63M of total domestic R&D in the sector. By 2023 the number was almost € 800M. Today\'s R&D-investments will dictate how much the economy can grow in the next decade.',
    'r&d investments': 'R&D-investments in the startup sector have been increasing rapidly. In 2005 we only had € 63M of total domestic R&D in the sector. By 2023 the number was almost € 800M. Today\'s R&D-investments will dictate how much the economy can grow in the next decade.',
    'revenue': 'The total revenue of startup-based firms was approximately €0.52 billion in 2005. With a compound annual growth rate (CAGR) exceeding 19 percent, these firms generated around €12.5 billion in 2023. According to our data, the ecosystem expands roughly fivefold each decade. Based on this trajectory, the Finnish startup ecosystem could exceed €60 billion in total revenue by 2033.',
  }
  
  // Normalize the chart name for matching (lowercase, handle variations)
  const normalized = chartName.toLowerCase().trim()
  
  // Try exact match first
  if (contextMap[normalized]) {
    return contextMap[normalized]
  }
  
  // Try partial match (contains key phrases)
  for (const [key, value] of Object.entries(contextMap)) {
    if (normalized.includes(key) || key.includes(normalized.replace(/[^a-z0-9&]/g, ''))) {
      return value
    }
  }
  
  // Try matching key parts
  if (normalized.includes('r&d') || normalized.includes('rdi') || (normalized.includes('research') && normalized.includes('development'))) {
    return contextMap['r&d-investments'] // Default R&D text
  }
  
  if (normalized.includes('revenue') || normalized.includes('liikevaihto') || normalized.includes('turnover') || normalized.includes('sales')) {
    return contextMap['revenue'] // Revenue text
  }
  
  return null
}

const ExploreData = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [allData, setAllData] = useState<any[]>([])
  const [employeesGenderData, setEmployeesGenderData] = useState<any[]>([])
  const [rdiData, setRdiData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revenueFilter, setRevenueFilter] = useState<'all' | 'early-stage' | 'later-stage'>('all')
  const [employeesFilter, setEmployeesFilter] = useState<'all' | 'finland'>('all')
  const [firmsFilter, setFirmsFilter] = useState<'all' | 'finland' | 'early-stage' | 'later-stage'>('all')
  const [showMaleBar, setShowMaleBar] = useState<boolean>(true)
  const [showFemaleBar, setShowFemaleBar] = useState<boolean>(true)
  const [genderShareView, setGenderShareView] = useState<'none' | 'male-share' | 'female-share'>('none')
  const [showRevenueTable, setShowRevenueTable] = useState(false)
  const [showEmployeesTable, setShowEmployeesTable] = useState(false)
  const [showFirmsTable, setShowFirmsTable] = useState(false)
  const [showGenderTable, setShowGenderTable] = useState(false)
  const [showImmigrationTable, setShowImmigrationTable] = useState(false)
  const [showFinnishBar, setShowFinnishBar] = useState<boolean>(true)
  const [showForeignBar, setShowForeignBar] = useState<boolean>(true)
  const [immigrationShareView, setImmigrationShareView] = useState<'none' | 'finnish-share' | 'foreign-share'>('none')
  const [showRdiTable, setShowRdiTable] = useState<Record<string, boolean>>({})
  const [fullscreenChart, setFullscreenChart] = useState<'revenue' | 'employees' | 'firms' | 'rdi' | 'gender' | 'immigration' | null>(null)
  const [fullscreenRdiMetric, setFullscreenRdiMetric] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    loadAllData()
  }, [])

  // Track window width for responsive x-axis intervals
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  async function loadAllData() {
    try {
      const { loadAllTabsData } = await import('../utils/dataLoader')
      const { main, employeesGender, rdi } = await loadAllTabsData()
      setAllData(main)
      setEmployeesGenderData(employeesGender)
      setRdiData(rdi)
      
      // Get last modified date from the main data file
      try {
        const response = await fetch('/data/main-data.json', { method: 'HEAD' })
        const lastModified = response.headers.get('last-modified')
        if (lastModified) {
          setLastUpdated(new Date(lastModified).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }))
        } else {
          // Fallback to current date if last-modified header is not available
          setLastUpdated(new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }))
        }
      } catch (error) {
        // If we can't get the date, use current date
        setLastUpdated(new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }))
      }
      
      if (main.length > 0) {
        const headers = Object.keys(main[0])
        console.log('Main data headers found:', headers)
        console.log('Main data loaded:', main.length, 'rows')
        console.log('Sample row:', main[0])
        // Check for early-stage revenue column
        const earlyStageCols = headers.filter(h => {
          const hLower = h.toLowerCase()
          return (hLower.includes('early') || hLower.includes('stage')) && 
                 (hLower.includes('revenue') || hLower.includes('turnover') || hLower.includes('sales'))
        })
        if (earlyStageCols.length > 0) {
          console.log('✅ Early-stage revenue column(s) detected:', earlyStageCols)
        } else {
          console.log('ℹ️ No early-stage revenue column detected. Available columns:', headers)
        }
        // Specifically check for "Early Stage Startup Revenue"
        const earlyStageStartupRevenue = headers.find(h => 
          h.toLowerCase().includes('early stage startup revenue') || 
          h === 'Early Stage Startup Revenue'
        )
        if (earlyStageStartupRevenue) {
          console.log('✅ Found "Early Stage Startup Revenue" column:', earlyStageStartupRevenue)
        } else {
          console.log('⚠️ "Early Stage Startup Revenue" column not found. Check column name spelling.')
        }
        // Check if we still have Finnish column names
        const finnishColumns = headers.filter(h => 
          h.toLowerCase().includes('liikevaihto') || 
          h.toLowerCase().includes('työlliset') || 
          h.toLowerCase().includes('yritykset') ||
          h.toLowerCase().includes('vuosi')
        )
        if (finnishColumns.length > 0) {
          console.warn('⚠️ Finnish column names detected:', finnishColumns)
          console.warn('Please update your Google Sheet column names to English:')
          console.warn('  - "Liikevaihto" → "Revenue"')
          console.warn('  - "Työlliset" → "Employees"')
          console.warn('  - "Yritykset" → "Firms"')
          console.warn('  - "Vuosi" → "Year"')
        }
      }
      
      if (employeesGender.length > 0) {
        const headers = Object.keys(employeesGender[0])
        console.log('Employees gender headers found:', headers)
        console.log('Employees gender data loaded:', employeesGender.length, 'rows')
      }
      
      if (rdi.length > 0) {
        const headers = Object.keys(rdi[0])
        console.log('RDI headers found:', headers)
        console.log('RDI data loaded:', rdi.length, 'rows')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setAllData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get available metrics from headers
  // Check all rows to find columns that might not be in the first row
  const getAvailableMetrics = () => {
    if (allData.length === 0) return []
    // Collect all unique keys from all rows
    const allKeys = new Set<string>()
    allData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key))
    })
    
    return Array.from(allKeys).filter(key => {
      const keyLower = key.toLowerCase()
      // Check if this column has at least one numeric value in any row
      const hasNumericValue = allData.some(row => {
        const value = row[key]
        return value !== undefined && value !== null && typeof value === 'number'
      })
      return hasNumericValue && 
             !keyLower.includes('year') && 
             !keyLower.includes('period') && 
             !keyLower.includes('date') &&
             !keyLower.includes('vuosi') // Exclude Finnish year column
    })
  }

  const availableMetrics = getAvailableMetrics()
  console.log('📊 All available metrics:', availableMetrics)
  
  // Find early-stage startup revenue column (exclude it from regular metrics to show separately)
  // Look for exact match first, then partial matches
  const earlyStageRevenueMetric = availableMetrics.find(metric => {
    const metricLower = metric.toLowerCase().trim()
    console.log(`   Checking metric: "${metric}" (lowercase: "${metricLower}")`)
    
    // Exact match for "Early Stage Startup Revenue"
    if (metricLower === 'early stage startup revenue' || 
        metricLower === 'early-stage startup revenue' ||
        metric === 'Early Stage Startup Revenue') {
      console.log('✅ Found early-stage revenue metric (exact match):', metric)
      return true
    }
    // Partial match: must have both "early" and "stage", and "revenue"
    const hasEarly = metricLower.includes('early')
    const hasStage = metricLower.includes('stage')
    const hasRevenue = metricLower.includes('revenue') || metricLower.includes('turnover') || metricLower.includes('sales')
    const isEarlyStage = (hasEarly && hasStage) && hasRevenue
    
    console.log(`     - Has "early": ${hasEarly}, Has "stage": ${hasStage}, Has "revenue": ${hasRevenue}, Is early-stage: ${isEarlyStage}`)
    
    if (isEarlyStage) {
      console.log('✅ Found early-stage revenue metric (partial match):', metric)
    }
    return isEarlyStage
  })
  
  // Find scaleup revenue column (exclude it from regular metrics to show separately)
  const scaleupRevenueMetric = availableMetrics.find(metric => {
    const metricLower = metric.toLowerCase().trim()
    
    // Exact match for "Scaleup Revenue"
    if (metricLower === 'scaleup revenue' || 
        metricLower === 'scale-up revenue' ||
        metric === 'Scaleup Revenue') {
      console.log('✅ Found scaleup revenue metric (exact match):', metric)
      return true
    }
    // Partial match: must have "scaleup" or "scale-up" and "revenue"
    const hasScaleup = metricLower.includes('scaleup') || metricLower.includes('scale-up')
    const hasRevenue = metricLower.includes('revenue') || metricLower.includes('turnover') || metricLower.includes('sales')
    const isScaleup = hasScaleup && hasRevenue
    
    if (isScaleup) {
      console.log('✅ Found scaleup revenue metric (partial match):', metric)
    }
    return isScaleup
  })
  
  if (earlyStageRevenueMetric) {
    console.log('✅ Early-stage revenue column detected:', earlyStageRevenueMetric)
  } else {
    console.log('⚠️ Early-stage revenue column NOT found.')
  }
  
  if (scaleupRevenueMetric) {
    console.log('✅ Scaleup revenue column detected:', scaleupRevenueMetric)
  } else {
    console.log('⚠️ Scaleup revenue column NOT found.')
  }
  
  // Find Number Startups and Number Scaleups columns (exclude from regular metrics)
  const numberStartupsMetric = availableMetrics.find(metric => {
    const metricLower = metric.toLowerCase().trim()
    return metricLower === 'number startups' || 
           metricLower === 'number of startups' ||
           metric === 'Number Startups'
  })
  
  const numberScaleupsMetric = availableMetrics.find(metric => {
    const metricLower = metric.toLowerCase().trim()
    return metricLower === 'number scaleups' || 
           metricLower === 'number of scaleups' ||
           metric === 'Number Scaleups'
  })
  
  if (numberStartupsMetric) {
    console.log('✅ Number Startups column detected:', numberStartupsMetric)
  }
  if (numberScaleupsMetric) {
    console.log('✅ Number Scaleups column detected:', numberScaleupsMetric)
  }
  
  // Filter out early-stage, scaleup revenue, number startups, and number scaleups from regular metrics
  const metricsToExclude = [
    earlyStageRevenueMetric, 
    scaleupRevenueMetric,
    numberStartupsMetric,
    numberScaleupsMetric
  ].filter(Boolean)
  const regularMetrics = metricsToExclude.length > 0
    ? availableMetrics.filter(m => !metricsToExclude.includes(m))
    : availableMetrics
  
  console.log('📊 Regular metrics (after filtering):', regularMetrics)
  console.log('📊 Early-stage revenue metric:', earlyStageRevenueMetric)
  
  
  // Create combined male/female chart data
  const getGenderComparisonData = () => {
    if (employeesGenderData.length === 0) {
      console.log('No employees gender data available')
      return []
    }
    
    console.log('Processing gender data, rows:', employeesGenderData.length)
    console.log('Gender data columns:', Object.keys(employeesGenderData[0] || {}))
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    console.log('Year column found:', yearKey)
    
    // Find male and female columns
    const allColumns = Object.keys(employeesGenderData[0] || {})
    const maleCol = allColumns.find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('male') || keyLower.includes('mies') || keyLower.includes('man')) && 
             !keyLower.includes('female') && 
             !keyLower.includes('nainen') &&
             !keyLower.includes('woman')
    })
    const femaleCol = allColumns.find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('female') || 
             keyLower.includes('nainen') || 
             keyLower.includes('woman')
    })
    
    console.log('Male column found:', maleCol)
    console.log('Female column found:', femaleCol)
    
    if (!maleCol || !femaleCol) {
      console.warn('⚠️ Could not find both male and female columns')
      console.warn('Available columns:', allColumns)
      return []
    }
    
    return employeesGenderData
      .filter(row => 
        row[maleCol] !== undefined && typeof row[maleCol] === 'number' &&
        row[femaleCol] !== undefined && typeof row[femaleCol] === 'number'
      )
      .map(row => {
        const year = row[yearKey] || 
                    row['vuosi'] || 
                    row['Vuosi'] ||
                    row['Period'] || 
                    row['Date'] || 
                    'N/A'
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
  
  const genderComparisonData = getGenderComparisonData()
  
  // Get immigration comparison data from employeesGenderData
  const getImmigrationComparisonData = () => {
    if (employeesGenderData.length === 0) return []
    
    const finnishCol = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('finnish') && keyLower.includes('background')) ||
             keyLower === 'finnish background'
    })
    
    const foreignCol = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('foreign') && keyLower.includes('background')) ||
             keyLower === 'foreign background'
    })
    
    if (!finnishCol || !foreignCol) {
      console.warn('⚠️ Could not find Finnish/Foreign background columns')
      return []
    }
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    return employeesGenderData
      .filter(row => 
        row[finnishCol] !== undefined && typeof row[finnishCol] === 'number' &&
        row[foreignCol] !== undefined && typeof row[foreignCol] === 'number'
      )
      .map(row => {
        const year = row[yearKey] || 'N/A'
        return {
          name: String(year),
          Finnish: row[finnishCol] as number,
          'Foreign': row[foreignCol] as number,
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
  
  const immigrationComparisonData = getImmigrationComparisonData()
  
  // Get share of Finnish data
  const getShareOfFinnishData = () => {
    if (employeesGenderData.length === 0) return []
    
    const shareOfFinnishCol = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase().trim()
      return keyLower === 'share of finnish' || 
             (keyLower.includes('share') && keyLower.includes('finnish') && !keyLower.includes('foreign'))
    })
    
    if (!shareOfFinnishCol) return []
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    return employeesGenderData
      .filter(row => {
        const value = row[shareOfFinnishCol]
        return value !== undefined && value !== null && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[shareOfFinnishCol]
        const percentage = value <= 1 ? value * 100 : value
        return {
          name: String(year),
          value: percentage,
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
  
  const shareOfFinnishData = getShareOfFinnishData()
  
  // Get share of Foreign data
  const getShareOfForeignData = () => {
    if (employeesGenderData.length === 0) return []
    
    const shareOfForeignCol = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase().trim()
      return keyLower === 'share of foreign' || 
             (keyLower.includes('share') && keyLower.includes('foreign') && !keyLower.includes('finnish'))
    })
    
    if (!shareOfForeignCol) return []
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    return employeesGenderData
      .filter(row => {
        const value = row[shareOfForeignCol]
        return value !== undefined && value !== null && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[shareOfForeignCol]
        const percentage = value <= 1 ? value * 100 : value
        return {
          name: String(year),
          value: percentage,
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
  
  const shareOfForeignData = getShareOfForeignData()

  // Get share of females chart data
  const getShareOfFemalesData = () => {
    if (employeesGenderData.length === 0) return []
    
    const shareOfFemalesCol = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('share') && 
             (keyLower.includes('female') || keyLower.includes('women') || keyLower.includes('woman'))
    })
    
    if (!shareOfFemalesCol) return []
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    return employeesGenderData
      .filter(row => {
        const value = row[shareOfFemalesCol]
        return value !== undefined && value !== null && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[shareOfFemalesCol]
        // Convert to percentage if it's a decimal (0-1), otherwise assume it's already a percentage
        const percentage = value <= 1 ? value * 100 : value
        return {
          name: String(year),
          value: percentage,
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
  
  const shareOfFemalesData = getShareOfFemalesData()

  // Get share of males chart data
  const getShareOfMalesData = () => {
    if (employeesGenderData.length === 0) return []
    
    // Try to find the exact column name first, then fall back to pattern matching
    const allKeys = Object.keys(employeesGenderData[0] || {})
    let shareOfMalesCol = allKeys.find(key => {
      const keyLower = key.toLowerCase().trim()
      return keyLower === 'share of males' || keyLower === 'shareofmales'
    })
    
    // If exact match not found, try pattern matching
    if (!shareOfMalesCol) {
      shareOfMalesCol = allKeys.find(key => {
        const keyLower = key.toLowerCase().trim()
        return keyLower.includes('share') && 
               (keyLower.includes('male') || keyLower.includes('men') || keyLower.includes('man')) &&
               !keyLower.includes('female') && !keyLower.includes('women') && !keyLower.includes('woman')
      })
    }
    
    if (!shareOfMalesCol) {
      console.warn('⚠️ Share of males column not found. Available columns:', allKeys)
      return []
    }
    
    console.log('✅ Found share of males column:', shareOfMalesCol)
    
    const yearKey = Object.keys(employeesGenderData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    return employeesGenderData
      .filter(row => {
        const value = row[shareOfMalesCol]
        return value !== undefined && value !== null && typeof value === 'number' && value >= 0
      })
      .map(row => {
        const year = row[yearKey] || 'N/A'
        const value = row[shareOfMalesCol]
        // Verify we're not accidentally getting female data
        if (shareOfMalesCol.toLowerCase().includes('female')) {
          console.error('❌ ERROR: shareOfMalesCol contains "female"! Column:', shareOfMalesCol)
          return null
        }
        // Convert to percentage if it's a decimal (0-1), otherwise assume it's already a percentage
        const percentage = value <= 1 ? value * 100 : value
        return {
          name: String(year),
          value: percentage,
          originalValue: value
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => {
        const yearA = parseInt(a.name)
        const yearB = parseInt(b.name)
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
  }

  const shareOfMalesData = getShareOfMalesData()

  // Get theme-aware colors for charts
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

  // Helper function to get year range from chart data
  const getYearRange = (chartData: any[]): string => {
    if (chartData.length === 0) return ''
    const years = chartData.map(d => parseInt(d.name)).filter(y => !isNaN(y))
    if (years.length === 0) return ''
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    return `${minYear}-${maxYear}`
  }

  // Helper function to determine x-axis interval based on screen size
  const getXAxisInterval = () => {
    if (windowWidth >= 1024) {
      return 0 // Show all years on large screens
    } else if (windowWidth >= 768) {
      return 1 // Show every 2nd year on medium screens
    } else {
      return 2 // Show every 3rd year on small screens
    }
  }


  // Build revenue chart config for GraphTemplate
  const buildRevenueChartConfig = (): GraphTemplateConfig | null => {
    if (!allData || allData.length === 0) return null

    // Find revenue and early stage revenue columns
    const revenueCol = Object.keys(allData[0]).find(key => {
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

    const earlyStageRevenueCol = earlyStageRevenueMetric || null
    const scaleupRevenueCol = scaleupRevenueMetric || null

    if (!revenueCol) return null

    // Find year column
    const yearKey = Object.keys(allData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'
    
    // Prepare chart data based on selected filter
    const getChartData = () => {
      let selectedColumn = revenueCol
      if (revenueFilter === 'early-stage' && earlyStageRevenueCol) {
        selectedColumn = earlyStageRevenueCol
      } else if (revenueFilter === 'later-stage' && scaleupRevenueCol) {
        selectedColumn = scaleupRevenueCol
      }

      return allData
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

    const chartData = getChartData()
    let currentLabel = 'Total Revenue'
    if (revenueFilter === 'early-stage') {
      currentLabel = 'Early Stage Revenue'
    } else if (revenueFilter === 'later-stage') {
      currentLabel = 'Later-Stage Revenue'
    }

    // Get contextual text based on filter
    const getContextText = (filter: string) => {
      if (filter === 'early-stage') {
        const latestData = chartData[chartData.length - 1]
        const earliestData = chartData.find(d => d.originalValue > 0) || chartData[0]
        const latestValue = latestData?.originalValue || 0
        const earliestValue = earliestData?.originalValue || 0
        const latestYear = latestData?.name || '2023'
        const earliestYear = earliestData?.name || '2010'
        
        const latestBillions = (latestValue / 1000000000).toFixed(2)
        const earliestBillions = earliestValue > 0 ? (earliestValue / 1000000000).toFixed(2) : '0.01'
        
        return `Early stage startup revenue represents a significant and growing portion of the Finnish startup ecosystem. Starting from approximately €${earliestBillions} billion in ${earliestYear}, early stage startups have shown remarkable growth, reaching around €${latestBillions} billion in ${latestYear}. This segment demonstrates the vitality and potential of new ventures in Finland's innovation landscape.`
      } else if (filter === 'later-stage') {
        const latestData = chartData[chartData.length - 1]
        const earliestData = chartData.find(d => d.originalValue > 0) || chartData[0]
        const latestValue = latestData?.originalValue || 0
        const earliestValue = earliestData?.originalValue || 0
        const latestYear = latestData?.name || '2023'
        const earliestYear = earliestData?.name || '2010'
        
        const latestBillions = (latestValue / 1000000000).toFixed(2)
        const earliestBillions = earliestValue > 0 ? (earliestValue / 1000000000).toFixed(2) : '0.01'
        
        return `Later-stage revenue represents a substantial portion of the Finnish startup ecosystem. Starting from approximately €${earliestBillions} billion in ${earliestYear}, later-stage firms have demonstrated strong growth, reaching around €${latestBillions} billion in ${latestYear}. These companies represent the maturing segment of the ecosystem, contributing significantly to Finland's economic growth and innovation capacity.`
      } else {
        return 'The total revenue of startup-based firms was approximately €0.52 billion in 2005. With a compound annual growth rate (CAGR) exceeding 19 percent, these firms generated around €12.5 billion in 2023. According to our data, the ecosystem expands roughly fivefold each decade. Based on this trajectory, the Finnish startup ecosystem could exceed €60 billion in total revenue by 2033.'
      }
    }

    let chartTitle = 'Startup Revenue'
    if (revenueFilter === 'early-stage') {
      chartTitle = 'Startup Revenue'
    } else if (revenueFilter === 'later-stage') {
      chartTitle = 'Startup Revenue'
    }
    
    const chartColors = getChartColors()

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
      contextText: getContextText,
      onShowTable: () => {
        const newValue = !showRevenueTable
        setShowRevenueTable(newValue)
      },
      onFullscreen: () => setFullscreenChart('revenue'),
      showTable: showRevenueTable,
      chartColors,
      windowWidth,
      getXAxisInterval,
      isRevenueValue: true
    }
  }

  // Render filterable revenue chart using GraphTemplate
  const renderFilterableRevenueChart = () => {
    const config = buildRevenueChartConfig()
    if (!config) return null

    return (
      <GraphTemplate
        config={config}
        filterValue={revenueFilter}
        onFilterChange={(value) => setRevenueFilter(value as 'all' | 'early-stage' | 'later-stage')}
      />
    )
  }

  // Build employees chart config for GraphTemplate
  const buildEmployeesChartConfig = (): GraphTemplateConfig | null => {
    if (!allData || allData.length === 0) return null

    // Find employees columns
    const employeesCol = Object.keys(allData[0]).find(key => {
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

    const employeesInFinlandCol = Object.keys(allData[0]).find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('employees') || 
              keyLower.includes('employee') ||
              keyLower.includes('työlliset')) &&
              (keyLower.includes('finland') ||
               keyLower.includes('suomi'))
    })

    if (!employeesCol) return null

    // Find year column
    const yearKey = Object.keys(allData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'

    // Prepare chart data based on selected filter
    const getChartData = () => {
      const selectedColumn = employeesFilter === 'finland' && employeesInFinlandCol 
        ? employeesInFinlandCol 
        : employeesCol

      return allData
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
    const currentLabel = employeesFilter === 'finland' ? 'Employees in Finland' : 'Total Employees'
    const yearRange = getYearRange(chartData)
    const chartTitle = employeesFilter === 'finland'
      ? `Employees in Finland ${yearRange}`
      : 'Number of Employees'
    
    const chartColors = getChartColors()

    // Get contextual text based on filter
    const getContextText = (filter: string) => {
      if (filter === 'finland') {
        return 'The number of employees working in Finland within startup-based firms has shown significant growth over the years. This metric reflects the local employment impact of the Finnish startup ecosystem and demonstrates how these companies contribute to job creation within the country.'
      } else {
        return 'The total number of employees in startup-based firms has grown substantially over the past two decades. This growth reflects the expanding scale and impact of the Finnish startup ecosystem, contributing to employment opportunities both domestically and internationally.'
      }
    }

    // Build filter options
    const filterOptions = [
      { value: 'all', label: 'All Employees' }
    ]
    if (employeesInFinlandCol) {
      filterOptions.push({ value: 'finland', label: 'In Finland' })
    }

    return {
      data: chartData,
      title: chartTitle,
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
      contextText: getContextText,
      onShowTable: () => {
        const newValue = !showEmployeesTable
        setShowEmployeesTable(newValue)
      },
      onFullscreen: () => setFullscreenChart('employees'),
      showTable: showEmployeesTable,
      chartColors,
      windowWidth,
      getXAxisInterval,
      isRevenueValue: false
    }
  }

  // Render filterable employees chart using GraphTemplate
  const renderFilterableEmployeesChart = () => {
    const config = buildEmployeesChartConfig()
    if (!config) return null

    return (
      <GraphTemplate
        config={config}
        filterValue={employeesFilter}
        onFilterChange={(value) => setEmployeesFilter(value as 'all' | 'finland')}
      />
    )
  }

  // Build firms chart config for GraphTemplate
  const buildFirmsChartConfig = (): GraphTemplateConfig | null => {
    if (!allData || allData.length === 0) return null

    // Find firms columns
    const firmsCol = Object.keys(allData[0]).find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('firms') || 
              keyLower.includes('firm') ||
              keyLower.includes('companies') ||
              keyLower.includes('company') ||
              keyLower.includes('yritykset') ||
              keyLower.includes('yritys')) &&
              !keyLower.includes('finland') &&
              !keyLower.includes('suomi') &&
              !keyLower.includes('share') &&
              !keyLower.includes('number') &&
              !keyLower.includes('startups') &&
              !keyLower.includes('scaleups')
    })

    const firmsInFinlandCol = Object.keys(allData[0]).find(key => {
      const keyLower = key.toLowerCase()
      return (keyLower.includes('firms') || 
              keyLower.includes('firm') ||
              keyLower.includes('companies') ||
              keyLower.includes('company') ||
              keyLower.includes('yritykset')) &&
              (keyLower.includes('finland') ||
               keyLower.includes('suomi'))
    })

    const numberStartupsCol = numberStartupsMetric || null
    const numberScaleupsCol = numberScaleupsMetric || null

    if (!firmsCol) return null

    // Find year column
    const yearKey = Object.keys(allData[0] || {}).find(key => {
      const keyLower = key.toLowerCase()
      return keyLower.includes('year') || 
             keyLower.includes('period') ||
             keyLower.includes('date') ||
             keyLower.includes('vuosi')
    }) || 'Year'

    // Prepare chart data based on selected filter
    const getChartData = () => {
      let selectedColumn = firmsCol
      if (firmsFilter === 'finland' && firmsInFinlandCol) {
        selectedColumn = firmsInFinlandCol
      } else if (firmsFilter === 'early-stage' && numberStartupsCol) {
        selectedColumn = numberStartupsCol
      } else if (firmsFilter === 'later-stage' && numberScaleupsCol) {
        selectedColumn = numberScaleupsCol
      }

      return allData
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
    let currentLabel = 'Total Firms'
    if (firmsFilter === 'finland') {
      currentLabel = 'Firms in Finland'
    } else if (firmsFilter === 'early-stage') {
      currentLabel = 'Number of Early-Stage Firms'
    } else if (firmsFilter === 'later-stage') {
      currentLabel = 'Number of Later-Stage Firms'
    }
    
    const yearRange = getYearRange(chartData)
    let chartTitle = 'Active firms'
    if (firmsFilter === 'finland') {
      chartTitle = `Firms in Finland ${yearRange}`
    } else if (firmsFilter === 'early-stage') {
      chartTitle = 'Active firms'
    } else if (firmsFilter === 'later-stage') {
      chartTitle = 'Active firms'
    }
    
    const chartColors = getChartColors()

    // Get contextual text based on filter
    const getContextText = (filter: string) => {
      if (filter === 'finland') {
        return 'The number of firms operating in Finland within the startup ecosystem has experienced steady growth. This metric highlights the increasing presence of startup companies within the Finnish market and their contribution to the local economy.'
      } else if (filter === 'early-stage') {
        return 'The number of early-stage firms in the Finnish ecosystem represents the early-stage companies that are driving innovation and growth. These companies are in their formative years, developing products and services that contribute to Finland\'s position as a leading innovation hub.'
      } else if (filter === 'later-stage') {
        return 'The number of later-stage firms reflects the maturing segment of the Finnish startup ecosystem. These companies have successfully navigated their early stages and are now experiencing rapid growth, contributing significantly to job creation and economic development in Finland.'
      } else {
        return 'The total number of firms in the Finnish startup ecosystem has grown significantly over the years. This growth reflects the expanding entrepreneurial activity and the increasing number of companies contributing to Finland\'s innovation landscape. The ecosystem continues to attract new ventures and support their development.'
      }
    }

    // Build filter options
    const filterOptions = [
      { value: 'all', label: 'All Firms' }
    ]
    if (firmsInFinlandCol) {
      filterOptions.push({ value: 'finland', label: 'In Finland' })
    }
    if (numberStartupsCol) {
      filterOptions.push({ value: 'early-stage', label: 'Early-Stage' })
    }
    if (numberScaleupsCol) {
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
      contextText: getContextText,
      onShowTable: () => {
        const newValue = !showFirmsTable
        setShowFirmsTable(newValue)
      },
      onFullscreen: () => setFullscreenChart('firms'),
      showTable: showFirmsTable,
      chartColors,
      windowWidth,
      getXAxisInterval,
      isRevenueValue: false
    }
  }

  // Render filterable firms chart using GraphTemplate
  const renderFilterableFirmsChart = () => {
    const config = buildFirmsChartConfig()
    if (!config) return null

    return (
      <GraphTemplate
        config={config}
        filterValue={firmsFilter}
        onFilterChange={(value) => setFirmsFilter(value as 'all' | 'finland' | 'early-stage' | 'later-stage')}
      />
    )
  }

  // Render fullscreen chart modal
  const renderFullscreenModal = () => {
    if (!fullscreenChart) return null

    const chartColors = getChartColors()
    let chartData: any[] = []
    let currentLabel = ''
    let isRevenueValue = false
    let chartTitle = ''

    if (fullscreenChart === 'revenue') {
      const revenueCol = Object.keys(allData[0] || {}).find(key => {
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
      const earlyStageRevenueCol = earlyStageRevenueMetric || null
      const scaleupRevenueCol = scaleupRevenueMetric || null
      
      let selectedColumn = revenueCol
      if (revenueFilter === 'early-stage' && earlyStageRevenueCol) {
        selectedColumn = earlyStageRevenueCol
      } else if (revenueFilter === 'later-stage' && scaleupRevenueCol) {
        selectedColumn = scaleupRevenueCol
      }
      
      const yearKey = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return keyLower.includes('year') || 
               keyLower.includes('period') ||
               keyLower.includes('date') ||
               keyLower.includes('vuosi')
      }) || 'Year'
      
      chartData = allData
        .filter(row => {
          const value = row[selectedColumn || '']
          return value !== undefined && typeof value === 'number' && value >= 0
        })
        .map(row => {
          const year = row[yearKey] || 'N/A'
          const value = row[selectedColumn || '']
          return {
            name: String(year),
            value: value / 1000000000,
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
      
      if (revenueFilter === 'early-stage') {
        currentLabel = 'Early Stage Revenue'
      } else if (revenueFilter === 'later-stage') {
        currentLabel = 'Later-Stage Revenue'
      } else {
        currentLabel = 'Total Revenue'
      }
      
      isRevenueValue = true
      
      if (revenueFilter === 'early-stage') {
        chartTitle = 'Startup Revenue'
      } else if (revenueFilter === 'later-stage') {
        chartTitle = 'Startup Revenue'
      } else {
        chartTitle = 'Startup Revenue'
      }
    } else if (fullscreenChart === 'employees') {
      const employeesCol = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return (keyLower.includes('employees') || 
                keyLower.includes('employee') ||
                keyLower.includes('employment') ||
                keyLower.includes('työlliset')) &&
                !keyLower.includes('finland') &&
                !keyLower.includes('suomi') &&
                !keyLower.includes('share')
      })
      const employeesInFinlandCol = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return (keyLower.includes('employees') || 
                keyLower.includes('employee') ||
                keyLower.includes('työlliset')) &&
                (keyLower.includes('finland') ||
                 keyLower.includes('suomi'))
      })
      const selectedColumn = employeesFilter === 'finland' && employeesInFinlandCol 
        ? employeesInFinlandCol 
        : employeesCol
      const yearKey = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return keyLower.includes('year') || 
               keyLower.includes('period') ||
               keyLower.includes('date') ||
               keyLower.includes('vuosi')
      }) || 'Year'
      
      chartData = allData
        .filter(row => {
          const value = row[selectedColumn || '']
          return value !== undefined && typeof value === 'number' && value >= 0
        })
        .map(row => {
          const year = row[yearKey] || 'N/A'
          const value = row[selectedColumn || '']
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
      currentLabel = employeesFilter === 'finland' ? 'Employees in Finland' : 'Total Employees'
      const employeesYearRange = getYearRange(chartData)
      chartTitle = employeesFilter === 'finland'
        ? `Employees in Finland ${employeesYearRange}`
        : 'Number of Employees'
    } else if (fullscreenChart === 'firms') {
      const firmsCol = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return (keyLower.includes('firms') || 
                keyLower.includes('firm') ||
                keyLower.includes('companies') ||
                keyLower.includes('yritykset')) &&
                !keyLower.includes('finland') &&
                !keyLower.includes('suomi') &&
                !keyLower.includes('share') &&
                !keyLower.includes('number') &&
                !keyLower.includes('startups') &&
                !keyLower.includes('scaleups')
      })
      const firmsInFinlandCol = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return (keyLower.includes('firms') || 
                keyLower.includes('firm') ||
                keyLower.includes('yritykset')) &&
                (keyLower.includes('finland') ||
                 keyLower.includes('suomi'))
      })
      const numberStartupsCol = numberStartupsMetric || null
      const numberScaleupsCol = numberScaleupsMetric || null
      
      let selectedColumn = firmsCol
      if (firmsFilter === 'finland' && firmsInFinlandCol) {
        selectedColumn = firmsInFinlandCol
      } else if (firmsFilter === 'early-stage' && numberStartupsCol) {
        selectedColumn = numberStartupsCol
      } else if (firmsFilter === 'later-stage' && numberScaleupsCol) {
        selectedColumn = numberScaleupsCol
      }
      
      const yearKey = Object.keys(allData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return keyLower.includes('year') || 
               keyLower.includes('period') ||
               keyLower.includes('date') ||
               keyLower.includes('vuosi')
      }) || 'Year'
      
      chartData = allData
        .filter(row => {
          const value = row[selectedColumn || '']
          return value !== undefined && typeof value === 'number' && value >= 0
        })
        .map(row => {
          const year = row[yearKey] || 'N/A'
          const value = row[selectedColumn || '']
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
      
      if (firmsFilter === 'finland') {
        currentLabel = 'Firms in Finland'
      } else if (firmsFilter === 'early-stage') {
        currentLabel = 'Number of Early-Stage Firms'
      } else if (firmsFilter === 'later-stage') {
        currentLabel = 'Number of Later-Stage Firms'
      } else {
        currentLabel = 'Total Firms'
      }
      
      const firmsYearRange = getYearRange(chartData)
      
      if (firmsFilter === 'finland') {
        chartTitle = `Firms in Finland ${firmsYearRange}`
      } else if (firmsFilter === 'early-stage') {
        chartTitle = 'Active firms'
      } else if (firmsFilter === 'later-stage') {
        chartTitle = 'Active firms'
      } else {
        chartTitle = 'Active firms'
      }
    } else if (fullscreenChart === 'gender') {
      if (genderShareView === 'male-share' && shareOfMalesData.length > 0) {
        chartData = shareOfMalesData
        currentLabel = 'Share of Males'
        isRevenueValue = false
        const yearRange = getYearRange(chartData)
        chartTitle = `Share of male employees in startups founded after 2010 (${yearRange})`
      } else if (genderShareView === 'female-share' && shareOfFemalesData.length > 0) {
        chartData = shareOfFemalesData
        currentLabel = 'Share of Females'
        isRevenueValue = false
        const yearRange = getYearRange(chartData)
        chartTitle = `Share of female employees in startups founded after 2010 (${yearRange})`
      } else if (genderComparisonData.length > 0) {
        // Bar chart view with toggles
        chartData = genderComparisonData
        currentLabel = 'Employees'
        isRevenueValue = false
        chartTitle = 'Gender distribution of startup workers'
      }
    } else if (fullscreenChart === 'immigration') {
      if (immigrationShareView === 'finnish-share' && shareOfFinnishData.length > 0) {
        chartData = shareOfFinnishData
        currentLabel = 'Share of Finnish'
        isRevenueValue = false
        const yearRange = getYearRange(chartData)
        chartTitle = `Share of Finnish background employees in startups founded after 2010 (${yearRange})`
      } else if (immigrationShareView === 'foreign-share' && shareOfForeignData.length > 0) {
        chartData = shareOfForeignData
        currentLabel = 'Share of Foreign'
        isRevenueValue = false
        const yearRange = getYearRange(chartData)
        chartTitle = `Share of foreign background employees in startups founded after 2010 (${yearRange})`
      } else if (immigrationComparisonData.length > 0) {
        // Bar chart view with toggles
        chartData = immigrationComparisonData.map(row => ({
          name: row.name,
          ...(showFinnishBar ? { Finnish: row.Finnish } : {}),
          ...(showForeignBar ? { Foreign: row['Foreign'] } : {})
        }))
        currentLabel = 'Employees'
        isRevenueValue = false
        chartTitle = 'Immigration status'
      }
    } else if (fullscreenChart === 'rdi' && fullscreenRdiMetric) {
      const metric = fullscreenRdiMetric
      const metricLower = metric.toLowerCase()
      const isRdiRevenue = metricLower.includes('investment') || 
                          metricLower.includes('rdi') || 
                          metricLower.includes('r&d')
      
      const yearKey = Object.keys(rdiData[0] || {}).find(key => {
        const keyLower = key.toLowerCase()
        return keyLower.includes('year') || 
               keyLower.includes('period') ||
               keyLower.includes('date') ||
               keyLower.includes('vuosi')
      }) || 'Year'
      
      chartData = rdiData
        .filter(row => row[metric] !== undefined && typeof row[metric] === 'number')
        .map(row => {
          const year = row[yearKey] || 'N/A'
          const value = row[metric]
          return {
            name: String(year),
            value: isRdiRevenue ? value / 1000000000 : value,
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
      currentLabel = formattedName
      isRevenueValue = isRdiRevenue
      chartTitle = 'R&D investments'
    }

    // Use the same interval function for fullscreen (can be adjusted if needed)
    const getFullscreenXAxisInterval = getXAxisInterval

    // Don't render if no chart data
    if (chartData.length === 0) {
      return (
        <div className="fullscreen-modal-overlay" onClick={() => {
          setFullscreenChart(null)
          setFullscreenRdiMetric(null)
        }}>
          <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-modal-header">
              <h2>{chartTitle || 'Chart'}</h2>
              <button
                className="fullscreen-close-button"
                onClick={() => {
                  setFullscreenChart(null)
                  setFullscreenRdiMetric(null)
                }}
                title="Close fullscreen"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="fullscreen-chart-wrapper" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>No data available for this chart.</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fullscreen-modal-overlay" onClick={() => {
        setFullscreenChart(null)
        setFullscreenRdiMetric(null)
      }}>
        <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="fullscreen-modal-header">
            <h2>{chartTitle}</h2>
            <button
              className="fullscreen-close-button"
              onClick={() => {
                setFullscreenChart(null)
                setFullscreenRdiMetric(null)
              }}
              title="Close fullscreen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="fullscreen-chart-wrapper">
            <ResponsiveContainer width="100%" height={600}>
              {fullscreenChart === 'immigration' && immigrationShareView === 'none' && immigrationComparisonData.length > 0 ? (
                <BarChart data={immigrationComparisonData.filter(row => {
                  const result: any = { name: row.name }
                  if (showFinnishBar) result.Finnish = row.Finnish
                  if (showForeignBar) result.Foreign = row['Foreign']
                  return Object.keys(result).length > 1
                }).map(row => ({
                  name: row.name,
                  ...(showFinnishBar ? { Finnish: row.Finnish } : {}),
                  ...(showForeignBar ? { Foreign: row['Foreign'] } : {})
                }))} margin={windowWidth <= 640 ? { bottom: 60, top: 20, right: 5, left: 15 } : { bottom: 60, top: 20, right: 30, left: 30 }}>
                  <defs>
                    <linearGradient id="gradient-finnish-fullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3498DB" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradient-foreign-fullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9B59B6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#9B59B6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={getFullscreenXAxisInterval()}
                  />
                  <YAxis 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: windowWidth <= 640 ? 9 : 12 }}
                    width={windowWidth <= 640 ? 35 : undefined}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: 'none', 
                      borderRadius: '8px',
                      color: chartColors.tooltipText
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  {showFinnishBar && (
                    <Bar 
                      dataKey="Finnish" 
                      fill="url(#gradient-finnish-fullscreen)"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {showForeignBar && (
                    <Bar 
                      dataKey="Foreign" 
                      fill="url(#gradient-foreign-fullscreen)"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              ) : fullscreenChart === 'gender' && genderShareView === 'none' && genderComparisonData.length > 0 ? (
                <BarChart data={genderComparisonData.filter(row => {
                  const result: any = { name: row.name }
                  if (showMaleBar) result.Male = row.Male
                  if (showFemaleBar) result.Female = row.Female
                  return Object.keys(result).length > 1 // Has at least one data key
                }).map(row => ({
                  name: row.name,
                  ...(showMaleBar ? { Male: row.Male } : {}),
                  ...(showFemaleBar ? { Female: row.Female } : {})
                }))} margin={windowWidth <= 640 ? { bottom: 60, top: 20, right: 5, left: 15 } : { bottom: 60, top: 20, right: 30, left: 30 }}>
                  <defs>
                    <linearGradient id="gradient-male-fullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A90E2" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradient-female-fullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E94B7E" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#E94B7E" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={getFullscreenXAxisInterval()}
                  />
                  <YAxis 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: windowWidth <= 640 ? 9 : 12 }}
                    width={windowWidth <= 640 ? 35 : undefined}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      border: 'none', 
                      borderRadius: '8px',
                      color: chartColors.tooltipText
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  {showMaleBar && (
                    <Bar 
                      dataKey="Male" 
                      fill="url(#gradient-male-fullscreen)"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {showFemaleBar && (
                    <Bar 
                      dataKey="Female" 
                      fill="url(#gradient-female-fullscreen)"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={windowWidth <= 640 ? { bottom: 60, top: 20, right: 5, left: 15 } : { bottom: 60, top: 20, right: 30, left: 30 }}>
                  <defs>
                    <linearGradient id="gradient-fullscreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={
                        fullscreenChart === 'gender' ? (genderShareView === 'male-share' ? "#4A90E2" : "#E94B7E") : 
                        fullscreenChart === 'immigration' ? (immigrationShareView === 'finnish-share' ? "#3498DB" : "#9B59B6") : 
                        "#A580F2"
                      } stopOpacity={0.3} />
                      <stop offset="100%" stopColor={
                        fullscreenChart === 'gender' ? (genderShareView === 'male-share' ? "#4A90E2" : "#E94B7E") : 
                        fullscreenChart === 'immigration' ? (immigrationShareView === 'finnish-share' ? "#3498DB" : "#9B59B6") : 
                        "#A580F2"
                      } stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={getFullscreenXAxisInterval()}
                  />
                  <YAxis 
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.tick, fontSize: 12 }}
                  tickFormatter={(value) => {
                      if (isRevenueValue) {
                      return `€${value.toFixed(1)}B`
                    }
                      if ((fullscreenChart === 'gender' && genderShareView !== 'none') ||
                          (fullscreenChart === 'immigration' && immigrationShareView !== 'none')) {
                        return `${value.toFixed(1)}%`
                    }
                    return value.toLocaleString()
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                    border: 'none', 
                    borderRadius: '8px',
                      color: chartColors.tooltipText
                  }}
                  formatter={(value: number, _name: string, props: any) => {
                      if (isRevenueValue) {
                      const billions = props.payload.originalValue / 1000000000
                        return [`€${billions.toFixed(2)}B`, currentLabel]
                    }
                      if ((fullscreenChart === 'gender' && genderShareView !== 'none') ||
                          (fullscreenChart === 'immigration' && immigrationShareView !== 'none')) {
                        return [`${value.toFixed(2)}%`, currentLabel]
                      }
                      return [value.toLocaleString(), currentLabel]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                    stroke={
                      fullscreenChart === 'gender' ? (genderShareView === 'male-share' ? "#4A90E2" : "#E94B7E") : 
                      fullscreenChart === 'immigration' ? (immigrationShareView === 'finnish-share' ? "#3498DB" : "#9B59B6") : 
                      "#A580F2"
                    } 
                    fill="url(#gradient-fullscreen)"
                  strokeWidth={2}
                />
              </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="explore-data-page">
      {renderFullscreenModal()}
      {/* Header */}
      <header className="explore-header">
        <div className="explore-header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1 className="explore-title">Explore Startup Data</h1>
          <p className="explore-subtitle">Dive deep into the Finnish startup ecosystem statistics</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="explore-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner">Loading data...</div>
          </div>
        ) : allData.length === 0 ? (
          <div className="error-container">
            <p>No data available. Please check the data source.</p>
          </div>
        ) : (
          <div className="explore-content">
            {/* Charts Section */}
            {(regularMetrics.length > 0 || earlyStageRevenueMetric || scaleupRevenueMetric) && (
              <div className="charts-section">
                <div className="section-header">
                <h2 className="section-title">Economic impact of startups</h2>
                  {lastUpdated && (
                    <p className="data-updated">Data updated: {lastUpdated}</p>
                  )}
                </div>
                
                {/* Filterable Revenue Chart */}
                {(() => {
                  const hasRevenue = regularMetrics.some(metric => {
                    const metricLower = metric.toLowerCase()
                    return (metricLower.includes('revenue') || 
                                          metricLower.includes('liikevaihto') ||
                                          metricLower.includes('turnover') ||
                                          metricLower.includes('sales')) &&
                                          !metricLower.includes('early') &&
                                          !metricLower.includes('stage')
                  })
                  
                  // Show revenue chart if we have revenue data, even without early stage filter
                  if (hasRevenue) {
                    return renderFilterableRevenueChart()
                  }
                  return null
                })()}
                
                {/* Filterable Employees Chart */}
                {(() => {
                  const hasEmployees = regularMetrics.some(metric => {
                      const metricLower = metric.toLowerCase()
                    return (metricLower.includes('employees') || 
                            metricLower.includes('employee') ||
                            metricLower.includes('employment') ||
                            metricLower.includes('työlliset')) &&
                            !metricLower.includes('finland') &&
                            !metricLower.includes('suomi') &&
                            !metricLower.includes('share')
                  })
                  
                  const hasEmployeesInFinland = Object.keys(allData[0] || {}).some(key => {
                    const keyLower = key.toLowerCase()
                    return (keyLower.includes('employees') || 
                            keyLower.includes('employee') ||
                            keyLower.includes('työlliset')) &&
                            (keyLower.includes('finland') ||
                             keyLower.includes('suomi'))
                  })
                  
                  if (hasEmployees && hasEmployeesInFinland) {
                    return renderFilterableEmployeesChart()
                  }
                  return null
                })()}
                
                {/* Filterable Firms Chart */}
                {(() => {
                  const hasFirms = regularMetrics.some(metric => {
                    const metricLower = metric.toLowerCase()
                    return (metricLower.includes('firms') || 
                            metricLower.includes('firm') ||
                            metricLower.includes('companies') ||
                            metricLower.includes('company') ||
                            metricLower.includes('yritykset')) &&
                            !metricLower.includes('finland') &&
                            !metricLower.includes('suomi') &&
                            !metricLower.includes('share') &&
                            !metricLower.includes('number')
                  })
                  
                  // Show chart if firms column exists OR if we have Number Startups/Scaleups
                  if (hasFirms || numberStartupsMetric || numberScaleupsMetric) {
                    return renderFilterableFirmsChart()
                    }
                    return null
                  })()}
              </div>
            )}
            
            {/* R&D Charts Section */}
            {rdiData.length > 0 && (() => {
              // Find RDI column
              const rdiColumns = Object.keys(rdiData[0] || {}).filter(col => {
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
              
              return (
                <div className="charts-section">
                  <div className="charts-grid">
                    {rdiColumns.map(metric => {
                      const metricLower = metric.toLowerCase()
                      const isRevenue = metricLower.includes('investment') || 
                                       metricLower.includes('rdi') || 
                                       metricLower.includes('r&d')
                      
                      // Find year column
                      const yearKey = Object.keys(rdiData[0] || {}).find(key => {
                        const keyLower = key.toLowerCase()
                        return keyLower.includes('year') || 
                               keyLower.includes('period') ||
                               keyLower.includes('date') ||
                               keyLower.includes('vuosi')
                      }) || 'Year'
                      
                      // Prepare chart data
                      const chartData = rdiData
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
                            value: isRevenue ? value / 1000000000 : value, // Convert to billions for currency
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
                        // First, replace R&d or r&d with R&D (case-insensitive)
                        let formatted = name.replace(/r&d/gi, 'R&D')
                        
                        return formatted
                          .replace(/_/g, ' ')
                          .replace(/-/g, ' ')
                          .split(' ')
                          .map(word => {
                            // If it's already R&D, keep it as is
                            if (word === 'R&D') {
                              return 'R&D'
                            }
                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          })
                          .join(' ')
                      }
                      
                      const chartContext = getChartContext(metric)
                      const formattedName = formatColumnName(metric)
                      const chartColors = getChartColors()
                      const chartTitle = 'R&D investments'
                      
                      // Build R&D chart config
                      const rdiConfig: GraphTemplateConfig = {
                        data: chartData,
                        title: chartTitle,
                        dataLabel: formattedName,
                        filtersConfig: {
                          enabled: false, // R&D charts have filters disabled
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
                          gradientId: `gradient-rdi-${metric}`,
                          gradientStartColor: '#A580F2',
                          gradientEndColor: '#A580F2',
                          gradientStartOpacity: 0.3,
                          gradientEndOpacity: 0.05,
                          strokeWidth: 2
                        },
                        contextText: chartContext || undefined,
                        onShowTable: () => {
                          setShowRdiTable(prev => ({ ...prev, [metric]: !prev[metric] }))
                        },
                        onFullscreen: () => {
                          setFullscreenChart('rdi')
                          setFullscreenRdiMetric(metric)
                        },
                        showTable: showRdiTable[metric] || false,
                        chartColors,
                        windowWidth,
                        getXAxisInterval,
                        isRevenueValue: isRevenue
                      }
                      
                      return (
                        <GraphTemplate
                          key={`rdi-${metric}`}
                          config={rdiConfig}
                          filterValue="all"
                          onFilterChange={() => {}}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            
            {/* Employees Gender Charts Section */}
            {genderComparisonData.length > 0 && (
              <div className="charts-section charts-section-employees">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">What kind of workers are employed by Finnish startups?</h2>
                    <p className="section-description">Discover the composition of employees in startup-based firms in Finland</p>
                  </div>
                </div>
                
                {/* Combined Male/Female Comparison Chart */}
                {(() => {
                  const chartColors = getChartColors()
                  
                  // Find share of females and males columns
                  const shareOfFemalesCol = employeesGenderData.length > 0 
                    ? Object.keys(employeesGenderData[0]).find(key => {
                        const keyLower = key.toLowerCase()
                        return keyLower.includes('share') && 
                               (keyLower.includes('female') || keyLower.includes('women') || keyLower.includes('woman'))
                      })
                    : null
                  
                  const shareOfMalesCol = employeesGenderData.length > 0 
                    ? Object.keys(employeesGenderData[0]).find(key => {
                        const keyLower = key.toLowerCase()
                        return keyLower.includes('share') && 
                               (keyLower.includes('male') || keyLower.includes('men') || keyLower.includes('man')) &&
                               !keyLower.includes('female') && !keyLower.includes('women') && !keyLower.includes('woman')
                      })
                    : null
                  
                  // Build gender chart config
                  const buildGenderChartConfig = (): BarChartTemplateConfig | null => {
                    // Calculate gender statistics for contextual text
                    const getGenderAnalysis = (): string => {
                    if (genderShareView === 'female-share' && shareOfFemalesData.length > 0) {
                      const latest = shareOfFemalesData[shareOfFemalesData.length - 1]
                      const earliest = shareOfFemalesData[0]
                      
                      const latestShare = latest.value
                      const earliestShare = earliest.value
                      const shareChange = latestShare - earliestShare
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      
                      let trendText = ''
                      if (shareChange > 2) {
                        trendText = `The share has increased significantly, rising from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}, representing a ${shareChange.toFixed(1)} percentage point increase.`
                      } else if (shareChange > 0) {
                        trendText = `The share has shown a modest increase, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else if (shareChange < -2) {
                        trendText = `The share has decreased, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share has remained relatively stable, at around ${latestShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The share of female employees in Finnish startup-based firms was ${latestShare.toFixed(1)}% in ${latestYear}. ${trendText} While the sector remains male-dominated, tracking the evolution of female representation provides important insights into the changing composition of the startup workforce.`
                    }
                    
                    if (genderShareView === 'male-share' && shareOfMalesData.length > 0) {
                      const latest = shareOfMalesData[shareOfMalesData.length - 1]
                      const earliest = shareOfMalesData[0]
                      
                      const latestShare = latest.value
                      const earliestShare = earliest.value
                      const shareChange = latestShare - earliestShare
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      
                      let trendText = ''
                      if (shareChange > 2) {
                        trendText = `The share has increased significantly, rising from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}, representing a ${shareChange.toFixed(1)} percentage point increase.`
                      } else if (shareChange > 0) {
                        trendText = `The share has shown a modest increase, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else if (shareChange < -2) {
                        trendText = `The share has decreased, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share has remained relatively stable, at around ${latestShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The share of male employees in Finnish startup-based firms was ${latestShare.toFixed(1)}% in ${latestYear}. ${trendText}`
                    }
                    
                    if (genderShareView === 'none' && genderComparisonData.length > 0) {
                      const latest = genderComparisonData[genderComparisonData.length - 1]
                      const earliest = genderComparisonData[0]
                      
                      const latestTotal = (latest.Male || 0) + (latest.Female || 0)
                      const earliestTotal = (earliest.Male || 0) + (earliest.Female || 0)
                      
                      const latestFemaleShare = latestTotal > 0 ? ((latest.Female || 0) / latestTotal) * 100 : 0
                      const earliestFemaleShare = earliestTotal > 0 ? ((earliest.Female || 0) / earliestTotal) * 100 : 0
                      
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      const femaleShareChange = latestFemaleShare - earliestFemaleShare
                      
                      let trendText = ''
                      if (femaleShareChange > 2) {
                        trendText = `The share of female employees has increased significantly, rising from ${earliestFemaleShare.toFixed(1)}% in ${earliestYear} to ${latestFemaleShare.toFixed(1)}% in ${latestYear}, representing a ${femaleShareChange.toFixed(1)} percentage point increase.`
                      } else if (femaleShareChange > 0) {
                        trendText = `The share of female employees has shown a modest increase, from ${earliestFemaleShare.toFixed(1)}% in ${earliestYear} to ${latestFemaleShare.toFixed(1)}% in ${latestYear}.`
                      } else if (femaleShareChange < -2) {
                        trendText = `The share of female employees has decreased, from ${earliestFemaleShare.toFixed(1)}% in ${earliestYear} to ${latestFemaleShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share of female employees has remained relatively stable, at around ${latestFemaleShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The Finnish startup sector remains male-dominated, with female employees representing ${latestFemaleShare.toFixed(1)}% of the workforce in ${latestYear}. ${trendText} While progress has been made, there is still significant room for improvement in achieving gender balance within the startup ecosystem.`
                    }
                    
                    return ''
                  }
                  
                    const genderAnalysisText = getGenderAnalysis()
                    
                    // Determine year range and chart title based on view
                    let yearRange = ''
                    let chartTitle = ''
                    let chartData: any[] = []
                    let currentLabel = ''
                    let isShareView = genderShareView !== 'none'
                    
                    // Prepare bar chart data with toggles
                    const barChartData = genderComparisonData.map(row => ({
                      name: row.name,
                      ...(showMaleBar ? { Male: row.Male } : {}),
                      ...(showFemaleBar ? { Female: row.Female } : {})
                    }))
                    
                    if (genderShareView === 'male-share' && shareOfMalesData.length > 0) {
                      chartData = shareOfMalesData
                      yearRange = getYearRange(shareOfMalesData)
                      chartTitle = `Share of male employees in startups founded after 2010 (${yearRange})`
                      currentLabel = 'Share of Males'
                    } else if (genderShareView === 'female-share' && shareOfFemalesData.length > 0) {
                      chartData = shareOfFemalesData
                      yearRange = getYearRange(shareOfFemalesData)
                      chartTitle = `Share of female employees in startups founded after 2010 (${yearRange})`
                      currentLabel = 'Share of Females'
                    } else if (genderComparisonData.length > 0) {
                      // Bar chart view
                      chartData = barChartData
                      yearRange = getYearRange(genderComparisonData)
                      chartTitle = 'Gender distribution of startup workers'
                      currentLabel = 'Employees'
                    } else {
                      return null
                    }
                    
                    // Determine chart color based on share view
                    const getChartColor = () => {
                      if (genderShareView === 'male-share') {
                        return '#4A90E2' // Blue for male
                      }
                      return '#E94B7E' // Pink for female
                    }
                    
                    const chartColor = getChartColor()
                    
                    // Build toggle buttons
                    const toggleButtons = [
                      {
                        label: 'Male',
                        isActive: genderShareView === 'none' && showMaleBar,
                        onClick: () => {
                          setGenderShareView('none')
                          setShowMaleBar(!showMaleBar)
                        }
                      },
                      {
                        label: 'Female',
                        isActive: genderShareView === 'none' && showFemaleBar,
                        onClick: () => {
                          setGenderShareView('none')
                          setShowFemaleBar(!showFemaleBar)
                        }
                      }
                    ]
                    
                    // Build view mode buttons
                    const viewModeButtons = []
                    if (shareOfMalesCol) {
                      viewModeButtons.push({
                        label: 'Share of Males',
                        value: 'male-share',
                        isActive: genderShareView === 'male-share',
                        onClick: () => {
                          setGenderShareView(genderShareView === 'male-share' ? 'none' : 'male-share')
                        }
                      })
                    }
                    if (shareOfFemalesCol) {
                      viewModeButtons.push({
                        label: 'Share of Females',
                        value: 'female-share',
                        isActive: genderShareView === 'female-share',
                        onClick: () => {
                          setGenderShareView(genderShareView === 'female-share' ? 'none' : 'female-share')
                        }
                      })
                    }
                    
                    // Build table columns
                    const tableColumns = isShareView 
                      ? [{ key: 'value', label: currentLabel }]
                      : [
                          ...(showMaleBar ? [{ key: 'Male', label: 'Male' }] : []),
                          ...(showFemaleBar ? [{ key: 'Female', label: 'Female' }] : [])
                        ]
                    
                    // Build table data
                    const tableData = isShareView
                      ? chartData.map(row => ({ name: row.name, value: row.value }))
                      : chartData
                    
                    const config: BarChartTemplateConfig = {
                      data: chartData,
                      title: chartTitle,
                      dataLabel: currentLabel,
                      chartType: isShareView ? 'area' : 'bar',
                      barSeries: isShareView ? undefined : [
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
                          onToggle: () => setShowMaleBar(!showMaleBar)
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
                          onToggle: () => setShowFemaleBar(!showFemaleBar)
                        }
                      ],
                      areaConfig: isShareView ? {
                        dataKey: 'value',
                        color: chartColor,
                        gradientId: `gradient-${genderShareView}`,
                        gradientStartColor: chartColor,
                        gradientEndColor: chartColor,
                        gradientStartOpacity: 0.3,
                        gradientEndOpacity: 0.05
                      } : undefined,
                      filtersConfig: {
                        enabled: true,
                        toggleButtons,
                        viewModeButtons
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
                      contextText: genderAnalysisText,
                      onShowTable: () => {
                        const newValue = !showGenderTable
                        setShowGenderTable(newValue)
                      },
                      onFullscreen: () => setFullscreenChart('gender'),
                      showTable: showGenderTable,
                      chartColors,
                      windowWidth,
                      getXAxisInterval,
                      isRevenueValue: false,
                      tableData,
                      tableColumns,
                      renderTable: () => {
                        if (!tableData || tableData.length === 0) return null
                        return (
                          <div className="chart-data-table-container">
                            <table className="chart-data-table">
                              <thead>
                                <tr>
                                  <th>Year</th>
                                  {tableColumns.map(col => (
                                    <th key={col.key}>{col.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.name}</td>
                                    {isShareView ? (
                                      <td>{row.value.toFixed(2)}%</td>
                                    ) : (
                                      <>
                                        {showMaleBar && <td>{row.Male?.toLocaleString() || '-'}</td>}
                                        {showFemaleBar && <td>{row.Female?.toLocaleString() || '-'}</td>}
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                    }
                    
                    return config
                  }
                  
                  const genderConfig = buildGenderChartConfig()
                  
                  if (!genderConfig) {
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                        <p>Gender data not available.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Make sure your employees_gender tab has the required columns.
                        </p>
                      </div>
                    )
                  }
                  
                  return <BarChartTemplate config={genderConfig} />
                })()}
              </div>
            )}
            
            {/* Employees Immigration Status Charts Section */}
            {immigrationComparisonData.length > 0 && (
              <div className="charts-section charts-section-employees">
                {/* Immigration Status Comparison Chart */}
                {(() => {
                  const chartColors = getChartColors()
                  
                  // Find share columns
                  const shareOfFinnishCol = employeesGenderData.length > 0 
                    ? Object.keys(employeesGenderData[0]).find(key => {
                        const keyLower = key.toLowerCase().trim()
                        return keyLower === 'share of finnish' || 
                               (keyLower.includes('share') && keyLower.includes('finnish') && !keyLower.includes('foreign'))
                      })
                    : null
                  
                  const shareOfForeignCol = employeesGenderData.length > 0 
                    ? Object.keys(employeesGenderData[0]).find(key => {
                        const keyLower = key.toLowerCase().trim()
                        return keyLower === 'share of foreign' || 
                               (keyLower.includes('share') && keyLower.includes('foreign') && !keyLower.includes('finnish'))
                      })
                    : null
                  
                  // Build immigration chart config
                  const buildImmigrationChartConfig = (): BarChartTemplateConfig | null => {
                    const getImmigrationAnalysis = (): string => {
                    if (immigrationShareView === 'finnish-share' && shareOfFinnishData.length > 0) {
                      const latest = shareOfFinnishData[shareOfFinnishData.length - 1]
                      const earliest = shareOfFinnishData[0]
                      
                      const latestShare = latest.value
                      const earliestShare = earliest.value
                      const shareChange = latestShare - earliestShare
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      
                      let trendText = ''
                      if (shareChange > 2) {
                        trendText = `The share has increased significantly, rising from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}, representing a ${shareChange.toFixed(1)} percentage point increase.`
                      } else if (shareChange > 0) {
                        trendText = `The share has shown a modest increase, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else if (shareChange < -2) {
                        trendText = `The share has decreased, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share has remained relatively stable, at around ${latestShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The share of Finnish background employees in Finnish startup-based firms was ${latestShare.toFixed(1)}% in ${latestYear}. ${trendText}`
                    }
                    
                    if (immigrationShareView === 'foreign-share' && shareOfForeignData.length > 0) {
                      const latest = shareOfForeignData[shareOfForeignData.length - 1]
                      const earliest = shareOfForeignData[0]
                      
                      const latestShare = latest.value
                      const earliestShare = earliest.value
                      const shareChange = latestShare - earliestShare
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      
                      let trendText = ''
                      if (shareChange > 2) {
                        trendText = `The share has increased significantly, rising from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}, representing a ${shareChange.toFixed(1)} percentage point increase.`
                      } else if (shareChange > 0) {
                        trendText = `The share has shown a modest increase, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else if (shareChange < -2) {
                        trendText = `The share has decreased, from ${earliestShare.toFixed(1)}% in ${earliestYear} to ${latestShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share has remained relatively stable, at around ${latestShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The share of foreign background employees in Finnish startup-based firms was ${latestShare.toFixed(1)}% in ${latestYear}. ${trendText} This diversity reflects the international nature of Finland's startup ecosystem and its ability to attract talent from around the world.`
                    }
                    
                    if (immigrationShareView === 'none' && immigrationComparisonData.length > 0) {
                      const latest = immigrationComparisonData[immigrationComparisonData.length - 1]
                      const earliest = immigrationComparisonData[0]
                      
                      const latestTotal = latest.Total
                      const earliestTotal = earliest.Total
                      
                      const latestForeignShare = latestTotal > 0 ? (latest['Foreign'] / latestTotal) * 100 : 0
                      const earliestForeignShare = earliestTotal > 0 ? (earliest['Foreign'] / earliestTotal) * 100 : 0
                      
                      const latestYear = latest.name
                      const earliestYear = earliest.name
                      const foreignShareChange = latestForeignShare - earliestForeignShare
                      
                      let trendText = ''
                      if (foreignShareChange > 2) {
                        trendText = `The share of foreign background employees has increased significantly, rising from ${earliestForeignShare.toFixed(1)}% in ${earliestYear} to ${latestForeignShare.toFixed(1)}% in ${latestYear}, representing a ${foreignShareChange.toFixed(1)} percentage point increase.`
                      } else if (foreignShareChange > 0) {
                        trendText = `The share of foreign background employees has shown a modest increase, from ${earliestForeignShare.toFixed(1)}% in ${earliestYear} to ${latestForeignShare.toFixed(1)}% in ${latestYear}.`
                      } else if (foreignShareChange < -2) {
                        trendText = `The share of foreign background employees has decreased, from ${earliestForeignShare.toFixed(1)}% in ${earliestYear} to ${latestForeignShare.toFixed(1)}% in ${latestYear}.`
                      } else {
                        trendText = `The share of foreign background employees has remained relatively stable, at around ${latestForeignShare.toFixed(1)}% in ${latestYear}.`
                      }
                      
                      return `The Finnish startup sector workforce includes both Finnish and foreign background employees. In ${latestYear}, foreign background employees represented ${latestForeignShare.toFixed(1)}% of the total workforce in startup-based firms. ${trendText} This diversity reflects the international nature of Finland's startup ecosystem and its ability to attract talent from around the world.`
                    }
                    
                    return ''
                  }
                  
                    const immigrationAnalysisText = getImmigrationAnalysis()
                    
                    // Prepare bar chart data with toggles
                    const barChartData = immigrationComparisonData.map(row => ({
                      name: row.name,
                      ...(showFinnishBar ? { Finnish: row.Finnish } : {}),
                      ...(showForeignBar ? { Foreign: row['Foreign'] } : {})
                    }))
                    
                    // Determine year range and chart title based on view
                    let yearRange = ''
                    let chartTitle = ''
                    let chartData: any[] = []
                    let currentLabel = ''
                    let isShareView = immigrationShareView !== 'none'
                    
                    if (immigrationShareView === 'finnish-share' && shareOfFinnishData.length > 0) {
                      chartData = shareOfFinnishData
                      yearRange = getYearRange(shareOfFinnishData)
                      chartTitle = `Share of Finnish background employees in startups founded after 2010 (${yearRange})`
                      currentLabel = 'Share of Finnish'
                    } else if (immigrationShareView === 'foreign-share' && shareOfForeignData.length > 0) {
                      chartData = shareOfForeignData
                      yearRange = getYearRange(shareOfForeignData)
                      chartTitle = `Share of foreign background employees in startups founded after 2010 (${yearRange})`
                      currentLabel = 'Share of Foreign'
                    } else if (immigrationComparisonData.length > 0) {
                      // Bar chart view
                      chartData = barChartData
                      yearRange = getYearRange(immigrationComparisonData)
                      chartTitle = 'Immigration status'
                      currentLabel = 'Employees'
                    } else {
                      return null
                    }
                    
                    // Determine chart color based on share view
                    const getChartColor = () => {
                      if (immigrationShareView === 'finnish-share') {
                        return '#3498DB' // Blue for Finnish
                      }
                      return '#9B59B6' // Purple for Foreign
                    }
                    
                    const chartColor = getChartColor()
                    
                    // Build toggle buttons
                    const toggleButtons = [
                      {
                        label: 'Finnish',
                        isActive: immigrationShareView === 'none' && showFinnishBar,
                        onClick: () => {
                          setImmigrationShareView('none')
                          setShowFinnishBar(!showFinnishBar)
                        }
                      },
                      {
                        label: 'Foreign',
                        isActive: immigrationShareView === 'none' && showForeignBar,
                        onClick: () => {
                          setImmigrationShareView('none')
                          setShowForeignBar(!showForeignBar)
                        }
                      }
                    ]
                    
                    // Build view mode buttons
                    const viewModeButtons = []
                    if (shareOfFinnishCol) {
                      viewModeButtons.push({
                        label: 'Share of Finnish',
                        value: 'finnish-share',
                        isActive: immigrationShareView === 'finnish-share',
                        onClick: () => {
                          setImmigrationShareView(immigrationShareView === 'finnish-share' ? 'none' : 'finnish-share')
                          setShowFinnishBar(true)
                          setShowForeignBar(true)
                        }
                      })
                    }
                    if (shareOfForeignCol) {
                      viewModeButtons.push({
                        label: 'Share of Foreign',
                        value: 'foreign-share',
                        isActive: immigrationShareView === 'foreign-share',
                        onClick: () => {
                          setImmigrationShareView(immigrationShareView === 'foreign-share' ? 'none' : 'foreign-share')
                          setShowFinnishBar(true)
                          setShowForeignBar(true)
                        }
                      })
                    }
                    
                    // Build table columns
                    const tableColumns = isShareView 
                      ? [{ key: 'value', label: currentLabel }]
                      : [
                          ...(showFinnishBar ? [{ key: 'Finnish', label: 'Finnish' }] : []),
                          ...(showForeignBar ? [{ key: 'Foreign', label: 'Foreign' }] : [])
                        ]
                    
                    // Build table data
                    const tableData = isShareView
                      ? chartData.map(row => ({ name: row.name, value: row.value }))
                      : chartData
                    
                    const config: BarChartTemplateConfig = {
                      data: chartData,
                      title: chartTitle,
                      dataLabel: currentLabel,
                      chartType: isShareView ? 'area' : 'bar',
                      barSeries: isShareView ? undefined : [
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
                          onToggle: () => setShowFinnishBar(!showFinnishBar)
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
                          onToggle: () => setShowForeignBar(!showForeignBar)
                        }
                      ],
                      areaConfig: isShareView ? {
                        dataKey: 'value',
                        color: chartColor,
                        gradientId: `gradient-${immigrationShareView}`,
                        gradientStartColor: chartColor,
                        gradientEndColor: chartColor,
                        gradientStartOpacity: 0.3,
                        gradientEndOpacity: 0.05
                      } : undefined,
                      filtersConfig: {
                        enabled: true,
                        toggleButtons,
                        viewModeButtons
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
                      contextText: immigrationAnalysisText,
                      onShowTable: () => {
                        const newValue = !showImmigrationTable
                        setShowImmigrationTable(newValue)
                      },
                      onFullscreen: () => setFullscreenChart('immigration'),
                      showTable: showImmigrationTable,
                      chartColors,
                      windowWidth,
                      getXAxisInterval,
                      isRevenueValue: false,
                      tableData,
                      tableColumns,
                      renderTable: () => {
                        if (!tableData || tableData.length === 0) return null
                        return (
                          <div className="chart-data-table-container">
                            <table className="chart-data-table">
                              <thead>
                                <tr>
                                  <th>Year</th>
                                  {tableColumns.map(col => (
                                    <th key={col.key}>{col.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.name}</td>
                                    {isShareView ? (
                                      <td>{row.value.toFixed(2)}%</td>
                                    ) : (
                                      <>
                                        {showFinnishBar && <td>{row.Finnish?.toLocaleString() || '-'}</td>}
                                        {showForeignBar && <td>{row.Foreign?.toLocaleString() || '-'}</td>}
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                    }
                    
                    return config
                  }
                  
                  const immigrationConfig = buildImmigrationChartConfig()
                  
                  if (!immigrationConfig) {
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                        <p>Immigration data not available.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Make sure your employees_gender tab has the required columns.
                        </p>
                      </div>
                    )
                  }
                  
                  return <BarChartTemplate config={immigrationConfig} />
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default ExploreData

