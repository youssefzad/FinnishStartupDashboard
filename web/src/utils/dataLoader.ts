import * as XLSX from 'xlsx'
import { DATA_SOURCE_CONFIG } from '../config/dataSource'

export interface MetricData {
  value: number
  growth: number
  year: string | number
  formattedValue: string
}

export interface StartupMetrics {
  firms: MetricData
  revenue: MetricData
  employees: MetricData
  employeesInFinland: MetricData
  rdi: MetricData
  unicorns: MetricData
}

// Load data from localStorage (fast) or Google Sheets (backup)
function loadDataFromLocalStorage(): { main: any[], employeesGender: any[], rdi: any[], barometer: any[], unicorns: any[], lastUpdated?: string } | null {
  try {
    const stored = localStorage.getItem('startupData')
    if (!stored) return null
    
    const data = JSON.parse(stored)
    return {
      main: data.main || [],
      employeesGender: data.employeesGender || [],
      rdi: data.rdi || [],
      barometer: data.barometer || [],
      unicorns: data.unicorns || [],
      lastUpdated: data.lastUpdated
    }
  } catch (error) {
    return null
  }
}

// Load data from local JSON files (primary source)
async function loadDataFromJSONFiles(): Promise<{ main: any[], employeesGender: any[], rdi: any[], barometer: any[], unicorns: any[] }> {
  try {
    // Load main data
    const mainResponse = await fetch('/data/main-data.json')
    if (!mainResponse.ok) {
      console.warn('Main data JSON file not found at /data/main-data.json')
      return { main: [], employeesGender: [], rdi: [], barometer: [], unicorns: [] }
    }
    const main = await mainResponse.json()
    
    // Load employees gender data (optional)
    let employeesGender: any[] = []
    try {
      const genderResponse = await fetch('/data/employees-gender-data.json')
      if (genderResponse.ok) {
        employeesGender = await genderResponse.json()
      }
    } catch (error) {
      // Gender data is optional, so we ignore errors
      console.log('No employees gender data file found (optional)')
    }
    
    // Load RDI data (optional)
    let rdi: any[] = []
    try {
      const rdiResponse = await fetch('/data/rdi-data.json')
      if (rdiResponse.ok) {
        rdi = await rdiResponse.json()
      }
    } catch (error) {
      // RDI data is optional, so we ignore errors
      console.log('No RDI data file found (optional)')
    }
    
    // Load barometer data (optional)
    let barometer: any[] = []
    try {
      const barometerResponse = await fetch('/data/barometer-data.json')
      // DEV-only debug logging
      if (import.meta.env.DEV) {
        console.log(`[DEBUG] Barometer fetch status: ${barometerResponse.status} ${barometerResponse.statusText}`)
        console.log(`[DEBUG] Barometer fetch URL: /data/barometer-data.json`)
      }
      if (barometerResponse.ok) {
        barometer = await barometerResponse.json()
        // DEV-only debug logging
        if (import.meta.env.DEV) {
          console.log(`[DEBUG] Barometer data parsed: ${barometer.length} rows`)
          if (barometer.length > 0) {
            console.log(`[DEBUG] Barometer data sample:`, barometer[0])
            console.log(`[DEBUG] Barometer columns:`, Object.keys(barometer[0]))
          }
        }
      } else {
        // DEV-only debug logging
        if (import.meta.env.DEV) {
          console.warn(`[DEBUG] Barometer fetch failed: ${barometerResponse.status} ${barometerResponse.statusText}`)
        }
      }
    } catch (error) {
      // Barometer data is optional, so we ignore errors
      if (import.meta.env.DEV) {
        console.warn('[DEBUG] Barometer fetch error:', error)
      }
      console.log('No barometer data file found (optional)')
    }
    
    // Load unicorns data (optional)
    let unicorns: any[] = []
    try {
      const unicornsResponse = await fetch('/data/unicorns-data.json')
      if (unicornsResponse.ok) {
        unicorns = await unicornsResponse.json()
      }
    } catch (error) {
      // Unicorns data is optional, so we ignore errors
      console.log('No unicorns data file found (optional)')
    }
    
    console.log('✅ Loaded data from local JSON files')
    console.log(`   Main data: ${main.length} rows`)
    console.log(`   Gender data: ${employeesGender.length} rows`)
    console.log(`   RDI data: ${rdi.length} rows`)
    console.log(`   Barometer data: ${barometer.length} rows`)
    console.log(`   Unicorns data: ${unicorns.length} rows`)
    
    return { main, employeesGender, rdi, barometer, unicorns }
  } catch (error) {
    console.error('Error loading data from JSON files:', error)
    return { main: [], employeesGender: [], rdi: [], barometer: [], unicorns: [] }
  }
}

// Load data from multiple tabs
export async function loadAllTabsData(): Promise<{ main: any[], employeesGender: any[], rdi: any[], barometer: any[], unicorns: any[] }> {
  // Primary: Load from local JSON files (fast, no network requests)
  const jsonData = await loadDataFromJSONFiles()
  if (jsonData.main.length > 0) {
    return jsonData
  }
  
  // Fallback: Try localStorage (for backwards compatibility)
  const localData = loadDataFromLocalStorage()
  if (localData && localData.main.length > 0) {
    console.log('✅ Loaded data from local storage (fallback)')
    return {
      main: localData.main,
      employeesGender: localData.employeesGender || [],
      rdi: localData.rdi || [],
      barometer: localData.barometer || [],
      unicorns: localData.unicorns || []
    }
  }
  
  // Last resort: Try Excel file (if JSON files don't exist)
  console.warn('⚠️ No JSON data files found. Loading from Excel file as last resort...')
  try {
    const main = await loadStartupData()
    return { main, employeesGender: [], rdi: [], barometer: [], unicorns: [] }
  } catch (error) {
    console.error('Failed to load data from any source:', error)
    return { main: [], employeesGender: [], rdi: [], barometer: [], unicorns: [] }
  }
}

// Simple CSV parser
function parseCSV(csvText: string): string[][] {
  const lines: string[] = csvText.split('\n')
  const result: string[][] = []
  
  for (const line of lines) {
    if (line.trim() === '') continue
    
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    row.push(current.trim())
    result.push(row)
  }
  
  return result
}

// Load and parse data from Google Sheets or Excel (fallback)
export async function loadStartupData(): Promise<any[]> {
  // Use Google Sheets if configured
  if (DATA_SOURCE_CONFIG.source === 'google-sheets' && DATA_SOURCE_CONFIG.googleSheetId) {
    try {
      // Google Sheets CSV export URL
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${DATA_SOURCE_CONFIG.googleSheetId}/export?format=csv&gid=${DATA_SOURCE_CONFIG.googleSheetGid}`
      
      console.log('Attempting to fetch Google Sheet from:', sheetUrl)
      const response = await fetch(sheetUrl)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Sheets fetch failed:', response.status, response.statusText)
        console.error('Response:', errorText.substring(0, 500))
        throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}. Make sure the sheet is publicly shared (Anyone with the link can view).`)
      }
      
      const csvText = await response.text()
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Google Sheet is empty')
      }
      
      // Check if we got an HTML error page instead of CSV
      if (csvText.trim().startsWith('<!DOCTYPE') || csvText.includes('<html')) {
        console.error('Received HTML instead of CSV. Sheet may not be publicly accessible.')
        throw new Error('Google Sheet is not publicly accessible. Please share it with "Anyone with the link can view".')
      }
      
      const csvData = parseCSV(csvText)
      
      if (csvData.length === 0) {
        return []
      }
      
      const headers = (csvData[0] || []).map((h: string) => String(h || '').trim())
      
      // Parse all data rows
      const parsedData: any[] = []
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i]
        if (row && row.length > 0) {
          const rowData: any = {}
          headers.forEach((header, index) => {
            if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
              const value = row[index]
              // Try to parse as number if possible
              if (typeof value === 'number') {
                rowData[header] = value
              } else {
                const numValue = parseFloat(String(value).replace(/[,\s€$]/g, ''))
                rowData[header] = isNaN(numValue) ? String(value) : numValue
              }
            }
          })
          if (Object.keys(rowData).length > 0) {
            parsedData.push(rowData)
          }
        }
      }
      
      console.log('Data loaded from Google Sheets:', parsedData.length, 'rows')
      if (parsedData.length > 0) {
        console.log('Sample data row:', parsedData[0])
        console.log('Available columns:', Object.keys(parsedData[0]))
      }
      return parsedData
    } catch (error) {
      console.error('Failed to load from Google Sheets:', error)
      console.warn('Falling back to Excel file...')
      // Fall through to Excel loading
    }
  }
  
  // Fallback to Excel file
  try {
    const response = await fetch(DATA_SOURCE_CONFIG.excelPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Excel file is empty')
    }
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length === 0) {
      return []
    }
    
    const headers = (jsonData[0] || []).map((h: any) => String(h || '').trim())
    
    // Parse all data rows
    const parsedData: any[] = []
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && Array.isArray(row) && row.length > 0) {
        const rowData: any = {}
        headers.forEach((header, index) => {
          if (row[index] !== undefined && row[index] !== null) {
            const value = row[index]
            // Try to parse as number if possible
            if (typeof value === 'number') {
              rowData[header] = value
            } else {
              const numValue = parseFloat(String(value).replace(/[,\s€$]/g, ''))
              rowData[header] = isNaN(numValue) ? String(value) : numValue
            }
          }
        })
        if (Object.keys(rowData).length > 0) {
          parsedData.push(rowData)
        }
      }
    }
    
    console.log('Data loaded from Excel file:', parsedData.length, 'rows')
    return parsedData
  } catch (error) {
    console.error('Error loading data:', error)
    return []
  }
}

// Find metric column by keyword matching
function findMetricColumn(data: any[], keywords: string[]): string | null {
  if (data.length === 0) return null
  
  const columns = Object.keys(data[0])
  for (const keyword of keywords) {
    const found = columns.find(col => 
      col.toLowerCase().includes(keyword.toLowerCase())
    )
    if (found) return found
  }
  return null
}

// Find metric column that contains all keywords (for multi-keyword searches)
function findMetricColumnWithAllKeywords(data: any[], keywords: string[]): string | null {
  if (data.length === 0) return null
  
  const columns = Object.keys(data[0])
  return columns.find(col => {
    const colLower = col.toLowerCase()
    return keywords.every(keyword => colLower.includes(keyword.toLowerCase()))
  }) || null
}

// Find year column
function findYearColumn(data: any[]): string | null {
  if (data.length === 0) return null
  
  const columns = Object.keys(data[0])
  const yearCol = columns.find(col => {
    const colLower = col.toLowerCase()
    return colLower.includes('year') || 
           colLower.includes('period') ||
           colLower.includes('date') ||
           colLower.includes('vuosi') // Finnish for year
  })
  return yearCol || null
}

// Calculate growth rate between two values
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0 || isNaN(previous) || isNaN(current)) return 0
  return ((current - previous) / previous) * 100
}

// Format value based on its magnitude
function formatValue(value: number, isRevenue: boolean = false, showAbsolute: boolean = false, roundToHundreds: boolean = false, roundToMillions: boolean = false): string {
  // If roundToMillions is true, round to nearest million and show as €XM (no decimals)
  if (roundToMillions) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    // Round to nearest million and explicitly convert to integer (no decimals)
    const rounded = Math.round(numValue / 1000000)
    // Convert to integer explicitly to remove any decimal representation
    const integerValue = parseInt(String(rounded), 10)
    return `€${integerValue}M`
  }
  
  // If roundToHundreds is true, round to nearest hundred and show full number with commas
  // Use explicit 'en-US' locale to ensure consistent formatting across browsers
  if (roundToHundreds) {
    const rounded = Math.round(value / 100) * 100
    return rounded.toLocaleString('en-US')
  }
  
  // If showAbsolute is true, always show the full number with comma formatting
  // Use explicit 'en-US' locale to ensure consistent formatting across browsers
  if (showAbsolute) {
    return Math.round(value).toLocaleString('en-US')
  }
  
  if (isRevenue) {
    if (value >= 1000000000) {
      // Value is in raw units (e.g., 12201000000), convert to billions
      const billions = value / 1000000000
      // Always show 2 decimal places for billions (e.g., €12.20B)
      const formatted = billions.toFixed(2)
      return `€${formatted}B`
    } else if (value >= 1000000) {
      const millions = value / 1000000
      const formatted = parseFloat(millions.toFixed(2))
      return `€${formatted}M`
    } else if (value >= 1000) {
      const thousands = value / 1000
      const formatted = parseFloat(thousands.toFixed(2))
      return `€${formatted}K`
    } else {
      // Value is already in billions (e.g., 12.201), format with B suffix
      // Always show 2 decimal places for billions (e.g., €12.20B)
      const formatted = value.toFixed(2)
      return `€${formatted}B`
    }
  } else {
    if (value >= 1000000) {
      const millions = value / 1000000
      const formatted = parseFloat(millions.toFixed(1))
      return `${formatted}M`
    } else if (value >= 1000) {
      const thousands = value / 1000
      return `${Math.round(thousands)}K`
    }
    // For numbers less than 1000, use comma formatting
    // Use explicit 'en-US' locale to ensure consistent formatting across browsers
    return Math.round(value).toLocaleString('en-US')
  }
}

// Extract metrics from data
export async function getStartupMetrics(): Promise<StartupMetrics | null> {
  // Load all data including RDI and Unicorns
  const { main: allData, rdi: rdiData, unicorns: unicornsData } = await loadAllTabsData()
  
  if (allData.length === 0) {
    return null
  }
  
  // Find relevant columns (prioritizing English names, with Finnish as fallback)
  const yearCol = findYearColumn(allData)
  // Try English names first, then Finnish - expanded keyword lists for better matching
  const firmsCol = findMetricColumn(allData, [
    'firms', 'firm', 'companies', 'company', 'startups', 'startup', 
    'number of firms', 'number of companies', 'number of startups',
    'yritykset', 'yritys', 'yritysten määrä', 'yritysten lukumäärä'
  ])
  const revenueCol = findMetricColumn(allData, [
    'revenue', 'turnover', 'sales', 'total revenue', 'total turnover',
    'liikevaihto', 'kokonaisliikevaihto'
  ])
  const employeesCol = findMetricColumn(allData, [
    'employees', 'employee', 'employment', 'jobs', 'workers', 'workforce',
    'total employees', 'total employment', 'number of employees',
    'työlliset', 'työllisyys', 'työntekijät', 'työllisten määrä'
  ])
  // Try to find employees in Finland column - prioritize English, then Finnish
  const employeesInFinlandCol = findMetricColumnWithAllKeywords(allData, ['employees', 'finland']) ||
                                 findMetricColumnWithAllKeywords(allData, ['employee', 'finland']) ||
                                 findMetricColumn(allData, [
                                   'employees in finland', 'employees finland', 'employee finland',
                                   'employment finland', 'jobs finland', 'workers finland',
                                   'finland employee', 'finland employees', 'finland employment'
                                 ]) ||
                                 findMetricColumn(allData, [
                                   'työlliset_suomessa', 'työlliset suomessa',
                                   'työntekijät suomessa', 'työllisyys suomessa'
                                 ]) ||
                                 findMetricColumnWithAllKeywords(allData, ['työlliset', 'suomessa']) ||
                                 findMetricColumnWithAllKeywords(allData, ['työlliset', 'suomi'])
  
  // Debug logging with more detail
  console.log('=== Column Detection Results ===')
  console.log('Year column:', yearCol)
  console.log('Firms column:', firmsCol)
  console.log('Revenue column:', revenueCol)
  console.log('Employees column:', employeesCol)
  console.log('Employees in Finland column:', employeesInFinlandCol)
  if (allData.length > 0) {
    console.log('All available columns:', Object.keys(allData[0]))
    console.log('Sample data row:', allData[0])
  } else {
    console.warn('No data available for column detection')
  }
  console.log('================================')
  
  if (!yearCol) {
    console.error('❌ Year column not found. Cannot extract metrics.')
    console.error('Available columns:', allData.length > 0 ? Object.keys(allData[0]) : 'No data')
    if (allData.length > 0) {
      console.error('Sample row:', allData[0])
    }
    return null
  }
  
  // Warn if critical columns are missing
  if (!firmsCol) {
    console.warn('⚠️ Firms column not found. Firms metric will be 0.')
  }
  if (!employeesCol) {
    console.warn('⚠️ Employees column not found. Employees metric will be 0.')
  }
  if (!revenueCol) {
    console.warn('⚠️ Revenue column not found. Revenue metric will be 0.')
  }
  
  // Helper function to convert value to number (handles strings with commas, currency symbols, etc.)
  // This function is browser-agnostic and handles Edge-specific parsing issues
  const parseNumericValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') {
      return null
    }
    
    // If already a number, validate and return
    if (typeof value === 'number') {
      // Check for valid finite number (Edge might have different NaN handling)
      if (isNaN(value) || !isFinite(value)) {
        return null
      }
      return value
    }
    
    // Convert to string and clean it
    const strValue = String(value).trim()
    if (strValue === '' || strValue === 'N/A' || strValue === 'n/a' || strValue === '-') {
      return null
    }
    
    // Remove common formatting: commas (thousand separators), currency symbols, spaces
    // Also handle non-breaking spaces and other Unicode whitespace (Edge compatibility)
    const cleaned = strValue.replace(/[,\s€$£¥\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '')
    
    // Edge-specific: Handle cases where the string might have been parsed incorrectly
    // Try Number() first (more strict), then fall back to parseFloat if needed
    let num = Number(cleaned)
    
    // If Number() fails, try parseFloat as fallback (Edge compatibility)
    if (isNaN(num) || !isFinite(num)) {
      // Remove any remaining non-numeric characters except decimal point and minus sign
      const furtherCleaned = cleaned.replace(/[^\d.-]/g, '')
      num = parseFloat(furtherCleaned)
    }
    
    // Return null if still NaN or invalid
    if (isNaN(num) || !isFinite(num)) {
      console.warn('Failed to parse numeric value:', value, 'cleaned:', cleaned)
      return null
    }
    
    return num
  }
  
  // Helper function to get latest and previous values for a metric
  const getMetricData = (column: string | null, isRevenue: boolean = false, showAbsolute: boolean = false, roundToHundreds: boolean = false, roundToMillions: boolean = false): MetricData | null => {
    if (!column) {
      console.warn(`Column not found for metric. Available columns:`, allData.length > 0 ? Object.keys(allData[0]) : 'No data')
      return null
    }
    
    // Verify column exists in data
    if (allData.length > 0 && !(column in allData[0])) {
      console.warn(`Column "${column}" not found in data. Available columns:`, Object.keys(allData[0]))
      return null
    }
    
    // Filter and sort data by year, with robust value parsing
    const validData = allData
      .map(row => {
        const year = row[yearCol]
        const rawValue = row[column]
        const value = parseNumericValue(rawValue)
        
        // Validate year
        if (year === undefined || year === null || year === '') {
          return null
        }
        
        // Validate value
        if (value === null || value <= 0) {
          return null
        }
        
        return {
          year,
          value
        }
      })
      .filter((item): item is { year: any; value: number } => item !== null)
      .sort((a, b) => {
        // Sort by year (handle both string and number years)
        const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year))
        const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year))
        if (!isNaN(yearA) && !isNaN(yearB)) {
          return yearA - yearB
        }
        return 0
      })
    
    if (validData.length === 0) {
      console.warn(`No valid data found for column "${column}". Check data format and values.`)
      // Log sample rows for debugging
      if (allData.length > 0) {
        console.warn('Sample rows for debugging:', allData.slice(0, 3).map(row => ({
          year: row[yearCol],
          [column]: row[column]
        })))
      }
      return null
    }
    
    const latest = validData[validData.length - 1]
    const previous = validData.length > 1 ? validData[validData.length - 2] : null
    
    const growth = previous ? calculateGrowth(latest.value, previous.value) : 0
    
    console.log(`Metric extracted for "${column}":`, {
      value: latest.value,
      year: latest.year,
      growth: growth.toFixed(2) + '%',
      formattedValue: formatValue(latest.value, isRevenue, showAbsolute, roundToHundreds, roundToMillions)
    })
    
    return {
      value: latest.value,
      growth,
      year: latest.year,
      formattedValue: formatValue(latest.value, isRevenue, showAbsolute, roundToHundreds, roundToMillions)
    }
  }
  
  const firms = getMetricData(firmsCol, false, true) // Show absolute number for firms
  const revenue = getMetricData(revenueCol, true, false)
  const employees = getMetricData(employeesCol, false, false, true) // Round to hundreds and show full number
  const employeesInFinland = getMetricData(employeesInFinlandCol, false, false)
  
  // Calculate RDI metric from RDI data
  let rdi: MetricData | null = null
  if (rdiData && rdiData.length > 0) {
    console.log('RDI data found:', rdiData.length, 'rows')
    console.log('RDI data columns:', rdiData.length > 0 ? Object.keys(rdiData[0]) : 'No data')
    
    // Find RDI column - try common names
    const rdiYearCol = findYearColumn(rdiData)
    const rdiCol = findMetricColumn(rdiData, ['r&d-investments', 'rdi', 'r&d', 'r and d', 'investments', 'research', 'development', 'research and development', 'tutkimus', 'kehitys', 'tutkimus ja kehitys'])
    
    console.log('RDI year column:', rdiYearCol)
    console.log('RDI value column:', rdiCol)
    
    if (rdiYearCol && rdiCol) {
      // Use the same helper function but with RDI data
      const rdiValidData = rdiData
        .filter(row => {
          const year = row[rdiYearCol]
          const value = row[rdiCol]
          return year !== undefined && 
                 value !== undefined && 
                 typeof value === 'number' && 
                 !isNaN(value) &&
                 value > 0
        })
        .map(row => ({
          year: row[rdiYearCol],
          value: row[rdiCol] as number
        }))
        .sort((a, b) => {
          const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year))
          const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year))
          if (!isNaN(yearA) && !isNaN(yearB)) {
            return yearA - yearB
          }
          return 0
        })
      
      if (rdiValidData.length > 0) {
        const latest = rdiValidData[rdiValidData.length - 1]
        const previous = rdiValidData.length > 1 ? rdiValidData[rdiValidData.length - 2] : null
        const growth = previous ? calculateGrowth(latest.value, previous.value) : 0
        
        rdi = {
          value: latest.value,
          growth,
          year: latest.year,
          formattedValue: formatValue(latest.value, false, false, false, true) // Round to nearest million, no decimals
        }
      } else {
        console.warn('RDI column detection failed. Year column:', rdiYearCol, 'Value column:', rdiCol)
        console.warn('Available RDI columns:', rdiData.length > 0 ? Object.keys(rdiData[0]) : 'No data')
      }
    } else {
      console.warn('RDI data is empty or not loaded')
    }
  }
  
  // Calculate Unicorns metric from Unicorns data
  let unicorns: MetricData | null = null
  if (unicornsData && unicornsData.length > 0) {
    console.log('Unicorns data found:', unicornsData.length, 'companies')
    
    // Normalize and count unicorns
    const normalizeUnicornData = (data: any[]) => {
      return data
        .map(row => {
          const firm = row['Firm'] || row['firm'] || ''
          const valuation = row['Last valuation'] || row['Last valuation'] || row['lastValuation'] || row['valuation'] || null
          
          if (!firm || valuation === null || valuation === undefined || isNaN(Number(valuation))) {
            return null
          }
          
          return {
            firm: String(firm).trim(),
            valuation: Number(valuation)
          }
        })
        .filter((row): row is { firm: string; valuation: number } => row !== null)
    }
    
    const normalizedUnicorns = normalizeUnicornData(unicornsData)
    const unicornCount = normalizedUnicorns.length
    
    if (unicornCount > 0) {
      unicorns = {
        value: unicornCount,
        growth: 0, // Unicorns don't have year-based growth, it's a count
        year: 'Total',
        formattedValue: unicornCount.toString()
      }
    }
  }
  
  // Return null if we couldn't find at least one metric
  if (!firms && !revenue && !employees && !employeesInFinland && !rdi && !unicorns) {
    return null
  }
  
  return {
    firms: firms || { value: 0, growth: 0, year: 'N/A', formattedValue: '0' },
    revenue: revenue || { value: 0, growth: 0, year: 'N/A', formattedValue: '€0' },
    employees: employees || { value: 0, growth: 0, year: 'N/A', formattedValue: '0' },
    employeesInFinland: employeesInFinland || { value: 0, growth: 0, year: 'N/A', formattedValue: '0' },
    rdi: rdi || { value: 0, growth: 0, year: 'N/A', formattedValue: '€0' },
    unicorns: unicorns || { value: 0, growth: 0, year: 'N/A', formattedValue: '0' }
  }
}

