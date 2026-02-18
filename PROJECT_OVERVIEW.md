# Finnish Startup Community Statistics Website

## Project Overview

The Finnish Startup Community Statistics Website is a comprehensive data visualization platform that presents key metrics and insights about the Finnish startup ecosystem. The website provides interactive charts and graphs covering economic impact, workforce demographics, and startup sentiment through quarterly barometer surveys.

**Live Site:** [https://finnish-startup-dashboard.vercel.app](https://finnish-startup-dashboard.vercel.app)

---

## Tech Stack

### Frontend Framework
- **React 19.2.0** - Modern React with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.2** - Fast build tool and dev server

### Routing & State Management
- **React Router DOM 7.9.6** - Client-side routing
- **React Context API** - Theme management and global state

### Data Visualization
- **Recharts 3.4.1** - Charting library for React
  - `AreaChart` for time-series data (revenue, employees, firms, R&D, barometer)
  - `BarChart` for categorical data (gender, immigration)

### Data Processing
- **xlsx 0.18.5** - Excel file parsing (fallback data source)
- **Node.js Fetch API** - Google Sheets data fetching

### Styling
- **CSS Modules** - Component-scoped styles
- **CSS Variables** - Theme-aware styling (light/dark mode)
- **@fontsource/inter** - Typography

### Deployment
- **Vercel** - Hosting and CI/CD
- **GitHub** - Version control

---

## Data Sources

### Primary Data Source: Google Sheets

The website fetches data from publicly accessible Google Sheets:

1. **Main Economic Data Sheet**
   - **Sheet ID:** Configured via `VITE_GOOGLE_SHEET_ID` environment variable
   - **GID:** Configured via `VITE_GOOGLE_SHEET_GID` (default: `0`)
   - **Data:** Revenue, Employees, Firms, R&D investments
   - **Columns:**
     - `Year` - Time period (2005-2023)
     - `Revenue` - Total revenue in billions (€)
     - `RevenueEarlyStage` - Early-stage startup revenue in billions (€)
     - `RevenueLaterStage` - Later-stage (scaleup) revenue in billions (€)
     - `Employees` - Total number of employees
     - `EmployeesEarlyStage` - Early-stage startup employees
     - `EmployeesLaterStage` - Later-stage startup employees
     - `Employees in Finland` - Employees working in Finland
     - `Firms` - Total number of active firms
     - `FirmsEarlyStage` - Number of early-stage startups
     - `FirmsLaterStage` - Number of later-stage scaleups
     - `Share of employees in Finland` - Percentage
     - `Työlliset_Suomi_ennuste` - Forecast indicator

2. **Employees Gender Data**
   - **GID:** Configured via `VITE_EMPLOYEES_GENDER_GID`
   - **Data:** Gender distribution and immigration status
   - **Columns:**
     - `Year` - Time period
     - `Males`, `Females` - Absolute counts
     - `share of females`, `share of males` - Percentages
     - `Finnish background`, `Foreign background` - Immigration data
     - `share of finnish`, `share of foreign` - Immigration percentages

3. **R&D Investments Data**
   - **GID:** Configured via `VITE_RDI_GID`
   - **Data:** Research and development investments over time
   - **Columns:**
     - `Year` - Time period
     - `R&D-investments` - Investment amounts

4. **Startup Barometer Data**
   - **Sheet ID:** Configured via `BAROMETER_SHEET_ID` or `VITE_BAROMETER_SHEET_ID`
   - **GID:** Configured via `BAROMETER_GID` or `VITE_BAROMETER_GID` (default: `0`)
   - **Data:** Quarterly sentiment surveys
   - **Columns:**
     - `Time` - Quarter identifier (e.g., "Q2/2022")
     - `Company financial situation Past 3mo` - Past quarter sentiment
     - `Company financial situation Next 3mo` - Future quarter sentiment
     - `Number of employees Past 3mo` - Employment sentiment (past)
     - `Number of employees Next 3mo` - Employment sentiment (future)
     - `Surrounding economy Past 3mo` - Economic sentiment (past)
     - `Surrounding economy Next 3mo` - Economic sentiment (future)

### Data Update Process

Data is updated using a Node.js script:

```bash
cd web
npm run update-data
```

This script:
1. Fetches CSV exports from Google Sheets
2. Parses and validates the data
3. Saves JSON files to `web/public/data/`:
   - `main-data.json`
   - `employees-gender-data.json`
   - `rdi-data.json`
   - `barometer-data.json`

### Fallback Data Source

If Google Sheets is unavailable, the website falls back to a local Excel file:
- Path: `/Startup_data/WebsiteDataEng.xlsx`
- Used during development or if Google Sheets configuration is missing

---

## Current Features

### 1. Interactive Data Visualization

#### Economic Impact Explorer (`/explore`)
- **Revenue Chart** - Total revenue over time with filters:
  - All revenue
  - Early-stage startups
  - Later-stage scaleups
- **Employees Chart** - Workforce size with filters:
  - All employees
  - Employees in Finland
  - Early-stage startups
  - Later-stage scaleups
- **Active Firms Chart** - Number of companies with filters:
  - All firms
  - Early-stage startups
  - Later-stage scaleups
- **R&D Investments Chart** - Research spending over time

#### Workforce Explorer (`/explore`)
- **Gender Distribution** - Male/Female workforce breakdown
  - Toggle bars (show/hide male/female)
  - View modes: absolute counts or percentage shares
- **Immigration Status** - Finnish vs. foreign background
  - Toggle bars (show/hide Finnish/foreign)
  - View modes: absolute counts or percentage shares

#### Startup Barometer (`/explore`)
- **Financial Situation** - Company financial sentiment
- **Number of Employees** - Employment sentiment
- **Surrounding Economy** - Economic conditions sentiment
- Each chart shows:
  - Past 3 months sentiment
  - Next 3 months sentiment
  - Balance figures calculated as: `% very positive + (0.5 × positive) - (0.5 × negative) - % very negative`
  - Range: -100 (fully pessimistic) to +100 (fully optimistic)

### 2. Chart Embedding

Every chart can be embedded on external websites via iframe:

- **Embed Route:** `/embed/:chartId`
- **Features:**
  - Responsive iframe height (auto-adjusts via `postMessage`)
  - Theme control via URL parameter (`theme=light|dark|system`)
  - Filter preservation in embed URL
  - Optional title/source display (`showTitle=0|1`, `showSource=0|1`)
  - Compact mode (`compact=0|1`)

**Available Chart IDs:**
- `economic-impact-revenue`
- `economic-impact-employees`
- `economic-impact-firms`
- `economic-impact-rdi`
- `workforce-gender`
- `workforce-immigration`
- `barometer-financial`
- `barometer-employees`
- `barometer-economy`

**Example Embed:**
```html
<iframe 
  id="fsc-chart-economic-impact-revenue" 
  src="https://your-domain.com/embed/economic-impact-revenue?filter=early-stage&theme=dark&showTitle=1" 
  style="width:100%;border:0;" 
  height="520" 
  loading="lazy"
  title="Finnish Startup Community chart: economic-impact-revenue">
</iframe>
```

### 3. Theme Support

- **Light Mode** - Bright theme for daytime viewing
- **Dark Mode** - Dark theme (default) for reduced eye strain
- **System Preference** - Automatically matches user's OS theme
- Theme preference is saved in `localStorage`
- Embed pages can override theme via URL parameter

### 4. Responsive Design

- **Desktop** - Full-width charts with sidebar filters and context text
- **Mobile** - Optimized layouts, collapsible sections, hamburger navigation
- **Tablet** - Adaptive grid layouts

### 5. Data Table View

Each chart includes:
- Toggle button to show/hide data table
- Formatted values matching chart tooltips
- Sortable columns
- Export-ready format

### 6. Fullscreen Mode

- Charts can be viewed in fullscreen for presentations
- Maintains interactivity (filters, tooltips)

---

## Architecture

### Component Structure

```
web/src/
├── components/
│   ├── GraphTemplate.tsx          # Reusable area/line chart component
│   ├── BarChartTemplate.tsx       # Reusable bar chart component
│   ├── ChartById.tsx              # Renders chart by ID from registry
│   ├── ChartEmbedPage.tsx         # Embed route page component
│   ├── EmbedModal.tsx             # Embed snippet modal
│   ├── EconomicImpactExplorer.tsx # Economic impact tabbed interface
│   ├── WorkforceExplorer.tsx      # Workforce tabbed interface
│   ├── BarometerExplorer.tsx      # Barometer tabbed interface
│   ├── ExploreData.tsx            # Main explore page
│   ├── LandingPage.tsx            # Homepage
│   ├── Navigation.tsx             # Site navigation
│   ├── PageHero.tsx               # Hero section component
│   └── ...
├── charts/
│   ├── buildEconomicImpactConfigs.ts  # Config builders for economic charts
│   ├── buildWorkforceConfigs.ts       # Config builders for workforce charts
│   └── buildBarometerConfigs.ts       # Config builders for barometer charts
├── config/
│   ├── chartRegistry.ts            # Central chart registry
│   └── dataSource.ts               # Data source configuration
├── contexts/
│   └── ThemeContext.tsx            # Theme provider
├── utils/
│   ├── dataLoader.ts               # Data loading utilities
│   └── dataUpdater.ts              # Data update utilities
└── styles/
    └── fsc-theme.css               # FSC-branded theme variables
```

### Data Flow

1. **Data Loading:**
   ```
   Google Sheets → update-data.js → JSON files → dataLoader.ts → Components
   ```

2. **Chart Rendering:**
   ```
   chartRegistry → ChartById → buildConfig() → GraphTemplate/BarChartTemplate → Recharts
   ```

3. **Embed Flow:**
   ```
   /embed/:chartId → ChartEmbedPage → ChartById → Chart Template → postMessage (height)
   ```

### Chart Registry System

The `chartRegistry.ts` provides a centralized mapping of chart IDs to:
- Chart metadata (title, kind, data source)
- Configuration builder functions
- Filter/view options

This enables:
- Consistent chart definitions
- Easy embedding via stable IDs
- Programmatic chart rendering

---

## Deployment

### Hosting Platform: Vercel

- **Automatic Deployments:** Every push to `main` branch triggers a production deployment
- **Preview Deployments:** Pull requests and other branches get preview URLs
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `web`

### Environment Variables

Required for Google Sheets integration:

```env
VITE_GOOGLE_SHEET_ID=your_sheet_id
VITE_GOOGLE_SHEET_GID=0
VITE_EMPLOYEES_GENDER_GID=your_gid
VITE_RDI_GID=your_gid
BAROMETER_SHEET_ID=your_sheet_id
BAROMETER_GID=0
```

Optional:
```env
VITE_PUBLIC_BASE_URL=https://your-domain.com  # Override for embed snippets
```

### Build Process

1. TypeScript compilation (`tsc`)
2. Vite build (bundling, minification)
3. Static assets copied to `dist/`
4. JSON data files included in `dist/data/`

---

## Current Status

### ✅ Completed Features

- [x] Economic impact charts (Revenue, Employees, Firms, R&D)
- [x] Workforce charts (Gender, Immigration)
- [x] Startup Barometer charts (Financial, Employees, Economy)
- [x] Chart embedding system with responsive iframes
- [x] Filter system for all relevant charts
- [x] Light/dark theme support
- [x] Responsive design (mobile, tablet, desktop)
- [x] Data table views
- [x] Fullscreen mode
- [x] Google Sheets integration
- [x] Data update script
- [x] Chart registry system
- [x] Embed help documentation page

### 🔄 Recent Updates

- **Column Name Updates:** Migrated to new column naming convention:
  - `RevenueEarlyStage`, `RevenueLaterStage` (in billions)
  - `FirmsEarlyStage`, `FirmsLaterStage`
  - `EmployeesEarlyStage`, `EmployeesLaterStage`
- **Filter Enhancements:** Added Early-Stage and Later-Stage filters to Employees chart
- **Theme Default:** Changed default theme to dark mode
- **Hero Section:** Added background image support and improved styling
- **Barometer Formula:** Updated balance calculation formula and labels

### 📊 Data Coverage

- **Time Period:** 2005-2023 (19 years)
- **Economic Metrics:** Revenue, Employees, Firms, R&D
- **Workforce Metrics:** Gender distribution, Immigration status
- **Barometer:** Quarterly surveys (15+ quarters)

### 🎯 Known Limitations

- Data is static JSON (updated via script, not real-time)
- No user authentication or data editing
- No export functionality (charts are view-only)
- Embed snippets require manual copy/paste

---

## Development

### Prerequisites

- Node.js 18+ (for built-in `fetch`)
- npm or yarn

### Setup

```bash
cd web
npm install
npm run dev
```

### Update Data

```bash
cd web
npm run update-data
```

### Build for Production

```bash
cd web
npm run build
```

### Project Structure

- `web/` - Main application directory
- `web/src/` - Source code
- `web/public/` - Static assets and data files
- `web/scripts/` - Node.js scripts (data update)
- `web/dist/` - Build output (generated)

---

## Documentation

Additional documentation files:

- `SETUP_INSTRUCTIONS.md` - Google Sheets setup guide
- `EMBED_FILTER_SYSTEM.md` - How to add filters to charts
- `DEPLOYMENT_ENV_VARS.md` - Environment variables reference
- `CHART_INVENTORY.md` - Complete chart listing
- `VERCEL_DEPLOYMENT.md` - Deployment guide

---

## License

[Add license information if applicable]

---

## Contact

For questions or contributions, please contact the Finnish Startup Community.

