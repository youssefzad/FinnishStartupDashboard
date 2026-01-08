// Manual Data Updater
// This script fetches data from Google Sheets and saves it to local JSON files
// Run this when you want to update the website data from Google Sheets

import { DATA_SOURCE_CONFIG } from '../config/dataSource'

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

// Load data from a specific Google Sheet tab by GID
async function loadDataFromTab(gid: string): Promise<any[]> {
  if (!DATA_SOURCE_CONFIG.googleSheetId) {
    throw new Error('Google Sheet ID not configured')
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${DATA_SOURCE_CONFIG.googleSheetId}/export?format=csv&gid=${gid}`
  
  console.log(`Fetching data from GID ${gid}...`)
  const response = await fetch(sheetUrl)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tab GID ${gid}: ${response.status} ${response.statusText}`)
  }
  
  const csvText = await response.text()
  if (!csvText || csvText.trim().length === 0 || csvText.trim().startsWith('<!DOCTYPE')) {
    throw new Error(`Tab GID ${gid} is empty or not accessible`)
  }
  
  const csvData = parseCSV(csvText)
  if (csvData.length === 0) {
    return []
  }
  
  const headers = (csvData[0] || []).map((h: string) => String(h || '').trim())
  const parsedData: any[] = []
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i]
    if (row && row.length > 0) {
      const rowData: any = {}
      headers.forEach((header, index) => {
        if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
          const value = row[index]
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
  
  return parsedData
}

// Save data to local JSON file (for use in browser - we'll use localStorage or download)
export async function updateDataFromGoogleSheets(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log('🔄 Starting data update from Google Sheets...')
    
    if (!DATA_SOURCE_CONFIG.googleSheetId) {
      return { success: false, message: 'Google Sheet ID not configured in .env file' }
    }

    // Load main data
    console.log('📥 Loading main data tab...')
    const mainData = await loadDataFromTab(DATA_SOURCE_CONFIG.googleSheetGid)
    console.log(`✅ Main data loaded: ${mainData.length} rows`)

    // Load employees gender data if GID is configured
    let employeesGenderData: any[] = []
    const employeesGenderGid = import.meta.env.VITE_EMPLOYEES_GENDER_GID || ''
    
    if (employeesGenderGid) {
      console.log('📥 Loading employees gender data...')
      employeesGenderData = await loadDataFromTab(employeesGenderGid)
      console.log(`✅ Gender data loaded: ${employeesGenderData.length} rows`)
    } else {
      console.log('⚠️ Employees gender GID not configured, skipping...')
    }

    // Combine data
    const allData = {
      main: mainData,
      employeesGender: employeesGenderData,
      lastUpdated: new Date().toISOString(),
      source: 'google-sheets'
    }

    // Save to localStorage (fast access)
    localStorage.setItem('startupData', JSON.stringify(allData))
    console.log('💾 Data saved to browser localStorage')

    // Download main data file
    const mainDataStr = JSON.stringify(mainData, null, 2)
    const mainDataBlob = new Blob([mainDataStr], { type: 'application/json' })
    const mainUrl = URL.createObjectURL(mainDataBlob)
    const mainLink = document.createElement('a')
    mainLink.href = mainUrl
    mainLink.download = 'main-data.json'
    document.body.appendChild(mainLink)
    mainLink.click()
    document.body.removeChild(mainLink)
    URL.revokeObjectURL(mainUrl)
    
    // Download gender data file if available
    if (employeesGenderData.length > 0) {
      const genderDataStr = JSON.stringify(employeesGenderData, null, 2)
      const genderDataBlob = new Blob([genderDataStr], { type: 'application/json' })
      const genderUrl = URL.createObjectURL(genderDataBlob)
      const genderLink = document.createElement('a')
      genderLink.href = genderUrl
      genderLink.download = 'employees-gender-data.json'
      document.body.appendChild(genderLink)
      genderLink.click()
      document.body.removeChild(genderLink)
      URL.revokeObjectURL(genderUrl)
    }
    
    console.log('📥 JSON files downloaded')

    return {
      success: true,
      message: `Successfully updated! Main: ${mainData.length} rows, Gender: ${employeesGenderData.length} rows`,
      data: allData
    }
  } catch (error: any) {
    console.error('❌ Error updating data:', error)
    return {
      success: false,
      message: `Error: ${error.message || 'Unknown error'}`
    }
  }
}

// Load data from localStorage (fast)
export function loadDataFromLocalStorage(): { main: any[], employeesGender: any[], lastUpdated?: string } | null {
  try {
    const stored = localStorage.getItem('startupData')
    if (!stored) return null
    
    const data = JSON.parse(stored)
    return {
      main: data.main || [],
      employeesGender: data.employeesGender || [],
      lastUpdated: data.lastUpdated
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return null
  }
}

