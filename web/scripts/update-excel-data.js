// Generate JSON data files from the local Excel workbook.
// Run with: node scripts/update-excel-data.js
// Outputs to: web/public/data/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const excelPath = path.join(__dirname, '../public/Startup_data/WebsiteDataEng.xlsx')
const dataDir = path.join(__dirname, '../public/data')

function parseWorksheetToObjects(worksheet) {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  if (!jsonData || jsonData.length === 0) return []

  const headers = (jsonData[0] || []).map(h => String(h || '').trim())
  const parsed = []

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || !Array.isArray(row) || row.length === 0) continue

    const obj = {}
    headers.forEach((header, idx) => {
      if (!header) return
      const value = row[idx]
      if (value === undefined || value === null || value === '') return
      if (typeof value === 'number') {
        obj[header] = value
      } else {
        const numValue = parseFloat(String(value).replace(/[,\s€$]/g, ''))
        obj[header] = Number.isNaN(numValue) ? String(value) : numValue
      }
    })

    if (Object.keys(obj).length > 0) parsed.push(obj)
  }

  return parsed
}

function getWorksheetByName(workbook, desiredName) {
  if (workbook.Sheets[desiredName]) return workbook.Sheets[desiredName]
  const desiredLower = desiredName.toLowerCase().trim()
  const match = workbook.SheetNames.find(n => n.toLowerCase().trim() === desiredLower)
  if (!match) return null
  return workbook.Sheets[match] || null
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function main() {
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Excel file not found at: ${excelPath}`)
    process.exit(1)
  }

  ensureDir(dataDir)

  const buf = fs.readFileSync(excelPath)
  const workbook = XLSX.read(buf, { type: 'buffer' })

  console.log('📄 Workbook sheets:', workbook.SheetNames.join(', '))

  const wagesWs = getWorksheetByName(workbook, 'Wages')
  if (!wagesWs) {
    console.error('❌ Sheet "Wages" not found in the workbook.')
    process.exit(1)
  }

  const wages = parseWorksheetToObjects(wagesWs)
  const wagesOut = path.join(dataDir, 'wages-data.json')
  fs.writeFileSync(wagesOut, JSON.stringify(wages, null, 2))
  console.log(`✅ Wrote ${wages.length} rows to ${wagesOut}`)
}

main()

