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
const UNICORNS_GID = env.VITE_UNICORNS_GID
// Use BAROMETER_SHEET_ID and BAROMETER_GID (without VITE_ prefix) for Node script
// Fallback to VITE_ prefixed vars for backwards compatibility, then to known values
const BAROMETER_SHEET_ID = env.BAROMETER_SHEET_ID || env.VITE_BAROMETER_SHEET_ID || '110mKqlfwoKFeM87tTNX22UFbXmZ2h2V4t936tbXBiD0'
const BAROMETER_GID = env.BAROMETER_GID || env.VITE_BAROMETER_GID || '0'

if (!GOOGLE_SHEET_ID) {
  console.error('❌ Error: VITE_GOOGLE_SHEET_ID not found in .env file')
  process.exit(1)
}

// Debug: Show what we loaded from .env
console.log('📋 Configuration loaded:')
console.log(`   Google Sheet ID: ${GOOGLE_SHEET_ID}`)
console.log(`   Main data GID: ${GOOGLE_SHEET_GID}`)
console.log(`   Employees gender GID: ${EMPLOYEES_GENDER_GID || 'NOT SET'}`)
console.log(`   RDI GID: ${RDI_GID || 'NOT SET'}`)
console.log(`   Unicorns GID: ${UNICORNS_GID || 'NOT SET'}`)
console.log(`   Barometer Sheet ID: ${BAROMETER_SHEET_ID}`)
console.log(`   Barometer GID: ${BAROMETER_GID}\n`)

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
    
    // Load Unicorns data if configured
    let unicornsData = []
    if (UNICORNS_GID) {
      try {
        console.log(`\n📥 Loading Unicorns data from GID: ${UNICORNS_GID}`)
        const unicornsRawData = await loadDataFromTab(UNICORNS_GID)
        console.log(`✅ Unicorns CSV data loaded: ${unicornsRawData.length} rows`)
        
        if (unicornsRawData.length > 0) {
          const headers = Object.keys(unicornsRawData[0])
          console.log(`   Columns found: ${headers.join(', ')}`)
          
          // Parse and transform data with proper types
          for (const row of unicornsRawData) {
            const parsedRow = {}
            
            // Parse each column
            for (const header of headers) {
              const value = row[header]
              const headerLower = header.toLowerCase().trim()
              
              // Firm: string
              if (headerLower === 'firm') {
                parsedRow[header] = value !== undefined && value !== null ? String(value).trim() : ''
              }
              // Last valuation: number (handle commas, currency symbols)
              else if (headerLower === 'last valuation' || headerLower === 'lastvaluation') {
                if (value === undefined || value === null || value === '') {
                  parsedRow[header] = null
                } else {
                  // Handle both string and number types from loadDataFromTab
                  const strValue = String(value).replace(/[,\s€$£¥]/g, '')
                  const numValue = parseFloat(strValue)
                  parsedRow[header] = isNaN(numValue) ? null : numValue
                }
              }
              // Finnish: boolean (1/0 -> true/false)
              else if (headerLower === 'finnish') {
                if (value === undefined || value === null || value === '') {
                  parsedRow[header] = false
                } else {
                  // Handle both number (1/0) and string ("1"/"0"/"true"/"false")
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                  const strValue = String(value).toLowerCase().trim()
                  parsedRow[header] = numValue === 1 || strValue === 'true' || strValue === '1'
                }
              }
              // Finnish background: boolean (1/0 -> true/false)
              else if (headerLower === 'finnish background' || headerLower === 'finnishbackground') {
                if (value === undefined || value === null || value === '') {
                  parsedRow[header] = false
                } else {
                  // Handle both number (1/0) and string ("1"/"0"/"true"/"false")
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                  const strValue = String(value).toLowerCase().trim()
                  parsedRow[header] = numValue === 1 || strValue === 'true' || strValue === '1'
                }
              }
              // Default: keep original value (already parsed by loadDataFromTab)
              else {
                parsedRow[header] = value
              }
            }
            
            if (Object.keys(parsedRow).length > 0) {
              unicornsData.push(parsedRow)
            }
          }
          
          // Save Unicorns data
          const unicornsDataPath = path.join(dataDir, 'unicorns-data.json')
          fs.writeFileSync(unicornsDataPath, JSON.stringify(unicornsData, null, 2))
          console.log(`💾 Saved Unicorns data to ${unicornsDataPath}`)
          console.log(`   ✅ Parsed ${unicornsData.length} rows`)
          if (unicornsData.length > 0) {
            console.log(`   📋 Sample row:`, JSON.stringify(unicornsData[0], null, 2))
          }
        } else {
          console.log(`   ⚠️  Warning: Tab exists but contains no data rows`)
        }
      } catch (error) {
        console.error(`❌ Error loading Unicorns data from GID ${UNICORNS_GID}:`, error.message)
        console.log(`   Make sure the GID is correct and the tab is accessible`)
      }
    } else {
      console.log('\n⚠️  Unicorns GID not configured, skipping Unicorns data...')
    }
    
    // Load barometer data (different sheet)
    let barometerData = []
    try {
      console.log(`\n📥 Loading barometer data...`)
      const barometerUrl = `https://docs.google.com/spreadsheets/d/${BAROMETER_SHEET_ID}/export?format=csv&gid=${BAROMETER_GID}`
      console.log(`   🔗 Fetch URL: ${barometerUrl}`)
      
      const barometerResponse = await fetch(barometerUrl)
      console.log(`   📊 HTTP Status: ${barometerResponse.status} ${barometerResponse.statusText}`)
      
      if (!barometerResponse.ok) {
        console.error(`   ❌ HTTP Error: ${barometerResponse.status} ${barometerResponse.statusText}`)
        console.error(`   💡 Possible causes:`)
        console.error(`      - Sheet ID or GID is incorrect`)
        console.error(`      - Sheet is not publicly accessible`)
        console.error(`      - Network error`)
        process.exit(1)
      }
      
      const barometerCsvText = await barometerResponse.text()
      
      // Validate response is CSV, not HTML error page
      if (!barometerCsvText || barometerCsvText.trim().length === 0) {
        console.error(`   ❌ Error: Barometer sheet response is empty`)
        console.error(`   💡 Possible causes:`)
        console.error(`      - Sheet is empty`)
        console.error(`      - GID points to an empty tab`)
        console.error(`      - Sheet access denied`)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.error(`   📄 Response preview (first 200 chars): ${barometerCsvText.substring(0, 200)}`)
        }
        process.exit(1)
      }
      
      // Check for HTML error pages
      if (barometerCsvText.trim().startsWith('<!DOCTYPE') || 
          barometerCsvText.includes('<html') || 
          barometerCsvText.includes('accounts.google.com')) {
        console.error(`   ❌ Error: Received HTML page instead of CSV`)
        console.error(`   💡 This means the sheet is not publicly accessible`)
        console.error(`   📝 To fix:`)
        console.error(`      1. Open the Google Sheet`)
        console.error(`      2. Click "Share" button`)
        console.error(`      3. Set access to "Anyone with the link can view"`)
        console.error(`      4. Verify Sheet ID: ${BAROMETER_SHEET_ID}`)
        console.error(`      5. Verify GID: ${BAROMETER_GID}`)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.error(`   📄 Response preview (first 200 chars): ${barometerCsvText.substring(0, 200)}`)
        }
        process.exit(1)
      }
      
      const barometerCsvData = parseCSV(barometerCsvText)
      
      if (barometerCsvData.length === 0) {
        console.error(`   ❌ Error: Parsed CSV contains no rows`)
        console.error(`   💡 Possible causes:`)
        console.error(`      - Sheet is completely empty`)
        console.error(`      - GID points to wrong tab`)
        console.error(`      - CSV parsing failed`)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.error(`   📄 Response preview (first 200 chars): ${barometerCsvText.substring(0, 200)}`)
        }
        process.exit(1)
      }
      
      const headers = (barometerCsvData[0] || []).map(h => String(h || '').trim())
      console.log(`   📋 Columns found (${headers.length}):`, headers.join(', '))
      
      for (let i = 1; i < barometerCsvData.length; i++) {
        const row = barometerCsvData[i]
        if (row && row.length > 0) {
          const rowData = {}
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
            barometerData.push(rowData)
          }
        }
      }
      
      // Validate we have data rows
      if (barometerData.length === 0) {
        console.error(`   ❌ Error: No valid data rows parsed (parsed ${barometerCsvData.length - 1} CSV rows, but all were empty/invalid)`)
        console.error(`   💡 Possible causes:`)
        console.error(`      - All rows in the sheet are empty`)
        console.error(`      - Data format is incorrect`)
        console.error(`      - Headers don't match expected format`)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.error(`   📄 Response preview (first 200 chars): ${barometerCsvText.substring(0, 200)}`)
        }
        process.exit(1)
      }
      
      // Save barometer data
      const barometerDataPath = path.join(dataDir, 'barometer-data.json')
      fs.writeFileSync(barometerDataPath, JSON.stringify(barometerData, null, 2))
      console.log(`   ✅ Success: Parsed ${barometerData.length} data rows`)
      console.log(`   💾 Output file: ${barometerDataPath}`)
      console.log(`   ✅ Barometer data saved successfully`)
    } catch (error) {
      console.error(`   ❌ Error loading barometer data:`, error.message)
      console.error(`   💡 Troubleshooting:`)
      console.error(`      - Verify BAROMETER_SHEET_ID and BAROMETER_GID in .env`)
      console.error(`      - Ensure the sheet is publicly shared ("Anyone with the link can view")`)
      console.error(`      - Check that the Sheet ID and GID are correct`)
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.error(`   📄 Error details:`, error)
      }
      process.exit(1)
    }
    
    console.log('\n✅ Data update complete!')
    console.log('📝 The website will now use these local JSON files for fast loading.')
    
  } catch (error) {
    console.error('❌ Error updating data:', error.message)
    process.exit(1)
  }
}

updateData()

