// Script to update data files from Google Sheets
// Run with: node scripts/update-data.js
// Requires Node.js 18+ (for built-in fetch)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env')
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found')
    return {}
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim()
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        env[key.trim()] = value
      }
    }
  })
  return env
}

const env = loadEnv()
const GOOGLE_SHEET_ID = env.VITE_GOOGLE_SHEET_ID
const GOOGLE_SHEET_GID = env.VITE_GOOGLE_SHEET_GID || '0'
const EMPLOYEES_GENDER_GID = env.VITE_EMPLOYEES_GENDER_GID
const RDI_GID = env.VITE_RDI_GID

if (!GOOGLE_SHEET_ID) {
  console.error('❌ Error: VITE_GOOGLE_SHEET_ID not found in .env file')
  process.exit(1)
}

// Debug: Show what we loaded from .env
console.log('📋 Configuration loaded:')
console.log(`   Google Sheet ID: ${GOOGLE_SHEET_ID}`)
console.log(`   Main data GID: ${GOOGLE_SHEET_GID}`)
console.log(`   Employees gender GID: ${EMPLOYEES_GENDER_GID || 'NOT SET'}`)
console.log(`   RDI GID: ${RDI_GID || 'NOT SET'}\n`)

function parseCSV(csvText) {
  const lines = csvText.split('\n')
  const result = []
  
  for (const line of lines) {
    if (line.trim() === '') continue
    
    const row = []
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

async function loadDataFromTab(gid) {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${gid}`
  
  console.log(`📥 Fetching data from GID ${gid}...`)
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
  
  const headers = (csvData[0] || []).map(h => String(h || '').trim())
  console.log(`   📋 Headers found (${headers.length} columns):`, headers.join(', '))
  const parsedData = []
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i]
    if (row && row.length > 0) {
      const rowData = {}
      headers.forEach((header, index) => {
        // Include all columns, even if empty (to preserve structure)
        if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
          const value = row[index]
          if (typeof value === 'number') {
            rowData[header] = value
          } else {
            const numValue = parseFloat(String(value).replace(/[,\s€$]/g, ''))
            rowData[header] = isNaN(numValue) ? String(value) : numValue
          }
        } else {
          // Include empty cells as undefined/null to preserve column structure
          // This ensures columns with all empty values still appear in the data
          rowData[header] = undefined
        }
      })
      if (Object.keys(rowData).length > 0) {
        parsedData.push(rowData)
      }
    }
  }
  
  return parsedData
}

async function updateData() {
  try {
    console.log('🔄 Starting data update from Google Sheets...\n')
    
    // Load main data
    const mainData = await loadDataFromTab(GOOGLE_SHEET_GID)
    console.log(`✅ Main data loaded: ${mainData.length} rows`)
    if (mainData.length > 0) {
      const headers = Object.keys(mainData[0])
      console.log(`   Columns found: ${headers.join(', ')}\n`)
    } else {
      console.log(`   ⚠️  Warning: No data rows found\n`)
    }
    
    // Load employees gender data
    let employeesGenderData = []
    if (EMPLOYEES_GENDER_GID) {
      // Use configured GID
      try {
        console.log(`📥 Loading employees gender data from GID: ${EMPLOYEES_GENDER_GID}\n`)
        employeesGenderData = await loadDataFromTab(EMPLOYEES_GENDER_GID)
        console.log(`✅ Gender data loaded: ${employeesGenderData.length} rows`)
        if (employeesGenderData.length > 0) {
          const headers = Object.keys(employeesGenderData[0])
          console.log(`   Columns found: ${headers.join(', ')}\n`)
        } else {
          console.log(`   ⚠️  Warning: Tab exists but contains no data rows\n`)
        }
      } catch (error) {
        console.error(`❌ Error loading gender data from GID ${EMPLOYEES_GENDER_GID}:`, error.message)
        console.log(`   Make sure the GID is correct and the tab is accessible\n`)
      }
    } else {
      // Try to find the tab automatically
      console.log('🔍 Employees gender GID not configured, attempting to find tab automatically...\n')
      let foundGid = null
      
      // Try common GIDs (0-20)
      for (let gid = 0; gid <= 20; gid++) {
        try {
          const testData = await loadDataFromTab(gid.toString())
          if (testData.length > 0) {
            const headers = Object.keys(testData[0])
            const headersLower = headers.map(h => h.toLowerCase())
            
            // Check if this looks like gender data
            const hasGenderData = headersLower.some(h => 
              h.includes('gender') || 
              h.includes('male') || 
              h.includes('female') ||
              h.includes('sukupuoli') ||
              h.includes('employees_gender') ||
              h.includes('employees gender')
            )
            
            // Make sure it's not the main data tab
            const isMainTab = headersLower.some(h => 
              h.includes('revenue') || 
              h.includes('liikevaihto') ||
              h.includes('firms') ||
              h.includes('yritykset')
            )
            
            if (hasGenderData && !isMainTab) {
              employeesGenderData = testData
              foundGid = gid
              console.log(`✅ Found employees_gender tab at GID: ${gid}`)
              console.log(`✅ Gender data loaded: ${employeesGenderData.length} rows\n`)
              console.log(`💡 Add this to your .env file to skip auto-discovery next time:`)
              console.log(`   VITE_EMPLOYEES_GENDER_GID=${gid}\n`)
              break
            }
          }
        } catch (error) {
          // Continue to next GID
          continue
        }
      }
      
      if (!foundGid) {
        console.log('⚠️  Employees gender tab not found automatically.\n')
        console.log('📝 To add it manually:')
        console.log('   1. Open your Google Sheet and click on the "employees_gender" tab')
        console.log('   2. Look at the URL - it will have #gid=XXXXX at the end')
        console.log('   3. Add this line to your .env file: VITE_EMPLOYEES_GENDER_GID=XXXXX\n')
      }
    }
    
    // Ensure public/data directory exists
    const dataDir = path.join(__dirname, '../public/data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Save main data
    const mainDataPath = path.join(dataDir, 'main-data.json')
    fs.writeFileSync(mainDataPath, JSON.stringify(mainData, null, 2))
    console.log(`💾 Saved main data to ${mainDataPath}`)
    
    // Save gender data
    const genderDataPath = path.join(dataDir, 'employees-gender-data.json')
    fs.writeFileSync(genderDataPath, JSON.stringify(employeesGenderData, null, 2))
    console.log(`💾 Saved gender data to ${genderDataPath}`)
    
    // Load RDI data if configured
    let rdiData = []
    if (RDI_GID) {
      try {
        console.log(`\n📥 Loading RDI data from GID: ${RDI_GID}`)
        rdiData = await loadDataFromTab(RDI_GID)
        console.log(`✅ RDI data loaded: ${rdiData.length} rows`)
        if (rdiData.length > 0) {
          const headers = Object.keys(rdiData[0])
          console.log(`   Columns found: ${headers.join(', ')}`)
          
          // Save RDI data
          const rdiDataPath = path.join(dataDir, 'rdi-data.json')
          fs.writeFileSync(rdiDataPath, JSON.stringify(rdiData, null, 2))
          console.log(`💾 Saved RDI data to ${rdiDataPath}`)
        } else {
          console.log(`   ⚠️  Warning: Tab exists but contains no data rows`)
        }
      } catch (error) {
        console.error(`❌ Error loading RDI data from GID ${RDI_GID}:`, error.message)
        console.log(`   Make sure the GID is correct and the tab is accessible`)
      }
    } else {
      console.log('\n⚠️  RDI GID not configured, skipping RDI data...')
    }
    
    console.log('\n✅ Data update complete!')
    console.log('📝 The website will now use these local JSON files for fast loading.')
    
  } catch (error) {
    console.error('❌ Error updating data:', error.message)
    process.exit(1)
  }
}

updateData()

