// Data source configuration
// 
// To use Google Sheets:
// 1. Make your Google Sheet publicly viewable:
//    - Open your Google Sheet
//    - Click "Share" button
//    - Set to "Anyone with the link" can view
// 2. Get the Sheet ID from the URL:
//    https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
// 3. Get the GID (tab ID) if not using the first sheet:
//    - Look at the tab name in the URL or use 0 for the first sheet
// 4. Update the values below or set environment variables:
//    VITE_GOOGLE_SHEET_ID=your_sheet_id
//    VITE_GOOGLE_SHEET_GID=0

export const DATA_SOURCE_CONFIG = {
  // Set to 'google-sheets' to use Google Sheets, or 'excel' to use local Excel file
  source: (import.meta.env.VITE_DATA_SOURCE || 'excel') as 'google-sheets' | 'excel',
  
  // Google Sheets configuration
  googleSheetId: import.meta.env.VITE_GOOGLE_SHEET_ID || '',
  googleSheetGid: import.meta.env.VITE_GOOGLE_SHEET_GID || '0',
  
  // Excel file path (fallback)
  excelPath: '/Startup_data/WebsiteDataEng.xlsx'
}

