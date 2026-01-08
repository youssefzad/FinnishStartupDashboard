# Google Sheets Setup Guide

This dashboard can now fetch data from Google Sheets instead of a local Excel file.

## Setup Instructions

### Step 1: Prepare Your Google Sheet

1. Create or open your Google Sheet with the startup data
2. Make sure the first row contains headers (column names)
3. Ensure the data structure matches what the dashboard expects:
   - A column for "Year" (or similar)
   - Columns for metrics like: Firms, Revenue, Employees, Employees in Finland

### Step 2: Make the Sheet Publicly Accessible

1. Click the **"Share"** button in the top right corner of your Google Sheet
2. Click **"Change to anyone with the link"**
3. Set permission to **"Viewer"**
4. Click **"Done"**

### Step 3: Get Your Sheet ID

1. Look at the URL of your Google Sheet:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
   ```
2. Copy the `SHEET_ID` (the long string between `/d/` and `/edit`)
3. If you're using a specific tab (not the first one), note the `gid` value from the URL

### Step 4: Configure the Dashboard

Create a `.env` file in the root of the `web` directory with:

```env
VITE_DATA_SOURCE=google-sheets
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_SHEET_GID=0
```

Replace:
- `your_sheet_id_here` with your actual Sheet ID
- `0` with your GID if using a different tab (0 = first tab)

### Step 5: Restart the Development Server

After creating/updating the `.env` file:
1. Stop the current dev server (Ctrl+C)
2. Start it again: `npm run dev`

## Example

If your Google Sheet URL is:
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit#gid=123456789
```

Your `.env` file should contain:
```env
VITE_DATA_SOURCE=google-sheets
VITE_GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j
VITE_GOOGLE_SHEET_GID=123456789
```

## Fallback to Excel

If Google Sheets is not configured or fails to load, the dashboard will automatically fall back to the local Excel file (`/Startup_data/WebsiteDataEng.xlsx`).

## Troubleshooting

- **Data not loading**: Check that the sheet is publicly accessible (Step 2)
- **Wrong data**: Verify the Sheet ID and GID are correct
- **CORS errors**: Make sure the sheet is set to "Anyone with the link can view"
- **Empty data**: Check that your sheet has data and the first row contains headers

