# How to Connect Your Google Sheet to the Dashboard

## What is a .env file?

A `.env` file is a configuration file that stores environment variables (settings) for your project. It's a simple text file where you can store sensitive information like API keys, database URLs, or in this case, your Google Sheet ID.

**Important:** The `.env` file should NOT be committed to Git (it's usually in `.gitignore`) because it contains project-specific settings.

## Step-by-Step Setup

### Step 1: Get Your Google Sheet ID

1. Open your Google Sheet in a web browser
2. Look at the URL in the address bar. It will look like this:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit#gid=0
   ```
3. The **Sheet ID** is the long string between `/d/` and `/edit`
   - In the example above, it's: `1a2b3c4d5e6f7g8h9i0j`
4. The **GID** (tab ID) is the number after `gid=`
   - In the example above, it's: `0` (0 means the first tab)
   - If you're using a different tab, the number will be different

### Step 2: Make Your Sheet Public

1. In your Google Sheet, click the **"Share"** button (top right)
2. Click **"Change to anyone with the link"**
3. Make sure the permission is set to **"Viewer"** (not Editor)
4. Click **"Done"**

⚠️ **Important:** The sheet MUST be publicly viewable for the dashboard to read it.

### Step 3: Create the .env File

1. In the `web` folder, create a new file named `.env` (note the dot at the beginning)
2. Copy the contents from `.env.example` or create it with this content:

```env
VITE_DATA_SOURCE=google-sheets
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_SHEET_GID=0
```

3. Replace `your_sheet_id_here` with your actual Sheet ID from Step 1
4. Replace `0` with your GID if you're using a different tab

### Step 4: Restart Your Development Server

After creating/updating the `.env` file:

1. **Stop** your current dev server (press `Ctrl+C` in the terminal)
2. **Start** it again: `npm run dev`

The dashboard will now load data from your Google Sheet!

## Example

If your Google Sheet URL is:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
```

Your `.env` file should be:
```env
VITE_DATA_SOURCE=google-sheets
VITE_GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
VITE_GOOGLE_SHEET_GID=0
```

## Troubleshooting

- **"Data not loading"**: 
  - Check that your sheet is publicly shared (Step 2)
  - Verify the Sheet ID is correct
  - Check the browser console for error messages

- **"Wrong data showing"**: 
  - Verify the GID matches the correct tab
  - Make sure your sheet has headers in the first row

- **Still using Excel file**: 
  - Make sure you restarted the dev server after creating `.env`
  - Check that `VITE_DATA_SOURCE=google-sheets` is set
  - Verify the Sheet ID is correct

## Data Format Requirements

Your Google Sheet should have:
- **First row**: Column headers (e.g., "Year", "Firms", "Revenue", "Employees")
- **Subsequent rows**: Data values
- **Year column**: A column that identifies the year/period (can be named "Year", "Period", "Date", etc.)
- **Numeric columns**: Columns with numbers for metrics (will be automatically detected)

