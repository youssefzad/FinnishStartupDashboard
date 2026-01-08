// Diagnostic utility to test Google Sheets connection
import { DATA_SOURCE_CONFIG } from '../config/dataSource'

export async function testGoogleSheetsConnection() {
  if (!DATA_SOURCE_CONFIG.googleSheetId) {
    console.error('Google Sheet ID not configured')
    return { success: false, error: 'Sheet ID not configured' }
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${DATA_SOURCE_CONFIG.googleSheetId}/export?format=csv&gid=${DATA_SOURCE_CONFIG.googleSheetGid}`
  
  console.log('Testing Google Sheets connection...')
  console.log('URL:', sheetUrl)
  
  try {
    const response = await fetch(sheetUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Fetch failed:', response.status, response.statusText)
      console.error('Response preview:', errorText.substring(0, 500))
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText.substring(0, 500)
      }
    }
    
    const csvText = await response.text()
    
    if (csvText.trim().startsWith('<!DOCTYPE') || csvText.includes('<html')) {
      return {
        success: false,
        error: 'Received HTML instead of CSV. Sheet may not be publicly accessible.',
        details: 'Please share the sheet with "Anyone with the link can view"'
      }
    }
    
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0]?.split(',') || []
    
    return {
      success: true,
      rowCount: lines.length - 1,
      headers: headers,
      preview: lines.slice(0, 3).join('\n')
    }
  } catch (error: any) {
    console.error('Connection test failed:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error.toString()
    }
  }
}

