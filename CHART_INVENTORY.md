# Chart Inventory - Finnish Startup Community Statistics Website

## Complete Chart Inventory

| chartId | Human Title | Route/Page | Component(s) | Data Source | Chart Library | Filters | Notes |
|---------|-------------|------------|--------------|-------------|---------------|---------|-------|
| `economic-impact-revenue` | Startup Revenue | `/explore` (Economic Impact Explorer tab) | `EconomicImpactExplorer` → `GraphTemplate` | `main-data.json` (Revenue column) | Recharts `AreaChart` | `all`, `early-stage`, `later-stage` | Filterable, fullscreen support, data table |
| `economic-impact-employees` | Number of Employees | `/explore` (Economic Impact Explorer tab) | `EconomicImpactExplorer` → `GraphTemplate` | `main-data.json` (Employees columns) | Recharts `AreaChart` | `all`, `finland` | Filterable, fullscreen support, data table |
| `economic-impact-firms` | Active firms | `/explore` (Economic Impact Explorer tab) | `EconomicImpactExplorer` → `GraphTemplate` | `main-data.json` (Firms columns) | Recharts `AreaChart` | `all`, `finland`, `early-stage`, `later-stage` | Filterable, fullscreen support, data table |
| `economic-impact-rdi` | R&D investments | `/explore` (Economic Impact Explorer tab) | `EconomicImpactExplorer` → `GraphTemplate` | `rdi-data.json` | Recharts `AreaChart` | None | Single series, fullscreen support, data table |
| `workforce-gender` | Gender distribution of startup workers | `/explore` (Workforce Explorer tab) | `WorkforceExplorer` → `BarChartTemplate` | `employees-gender-data.json` | Recharts `BarChart` | Male/Female toggle, Share view (male-share/female-share) | Multi-series bar chart, fullscreen support, data table |
| `workforce-immigration` | Immigration status | `/explore` (Workforce Explorer tab) | `WorkforceExplorer` → `BarChartTemplate` | `employees-gender-data.json` | Recharts `BarChart` | Finnish/Foreign toggle, Share view (finnish-share/foreign-share) | Multi-series bar chart, fullscreen support, data table |
| `barometer-financial` | Financial situation | `/explore` (Startup Barometer section) | `BarometerExplorer` → `GraphTemplate` | `barometer-data.json` | Recharts `AreaChart` | None | Multi-series (Past 3mo / Next 3mo), Y-axis label, balance explanation, enhanced 0-line |
| `barometer-employees` | Number of employees | `/explore` (Startup Barometer section) | `BarometerExplorer` → `GraphTemplate` | `barometer-data.json` | Recharts `AreaChart` | None | Multi-series (Past 3mo / Next 3mo), Y-axis label, balance explanation, enhanced 0-line |
| `barometer-economy` | Surrounding economy | `/explore` (Startup Barometer section) | `BarometerExplorer` → `GraphTemplate` | `barometer-data.json` | Recharts `AreaChart` | None | Multi-series (Past 3mo / Next 3mo), Y-axis label, balance explanation, enhanced 0-line |
| `rdi-dynamic-*` | R&D investments (per metric) | `/explore` (legacy, if explorer disabled) | `GraphTemplate` (direct) | `rdi-data.json` | Recharts `AreaChart` | None | Dynamic: one chart per RDI metric column. Only renders if `USE_ECON_IMPACT_EXPLORER = false` |

### Legacy Charts (Conditional Rendering)

These charts only render if feature flags are disabled:

| chartId | Human Title | Condition | Component | Notes |
|---------|-------------|-----------|-----------|-------|
| `revenue-legacy` | Startup Revenue | `USE_ECON_IMPACT_EXPLORER = false` | `GraphTemplate` (direct) | Same as `economic-impact-revenue` but standalone |
| `employees-legacy` | Number of Employees | `USE_ECON_IMPACT_EXPLORER = false` | `GraphTemplate` (direct) | Same as `economic-impact-employees` but standalone |
| `firms-legacy` | Active firms | `USE_ECON_IMPACT_EXPLORER = false` | `GraphTemplate` (direct) | Same as `economic-impact-firms` but standalone |
| `gender-legacy` | Gender distribution | `USE_WORKFORCE_EXPLORER = false` | `BarChartTemplate` (direct) | Same as `workforce-gender` but standalone |
| `immigration-legacy` | Immigration status | `USE_WORKFORCE_EXPLORER = false` | `BarChartTemplate` (direct) | Same as `workforce-immigration` but standalone |

### Background/Decorative Charts

| chartId | Human Title | Route/Page | Component | Notes |
|---------|-------------|------------|-----------|-------|
| `landing-hero-bg` | Hero background wave | `/` (Landing page) | Custom SVG in `LandingPage` | Animated exponential growth curve, decorative only |

---

## Chart Registry Proposal

### Recommended Naming Convention for `chartId`

**Format:** `{category}-{metric}-{variant?}`

- **Category:** `economic-impact`, `workforce`, `barometer`, `rdi`
- **Metric:** `revenue`, `employees`, `firms`, `gender`, `immigration`, `financial`, `economy`
- **Variant (optional):** Used for filter states or sub-metrics (e.g., `early-stage`, `finland`)

**Examples:**
- `economic-impact-revenue` ✅
- `economic-impact-revenue-early-stage` ✅ (for filtered view)
- `workforce-gender` ✅
- `barometer-financial` ✅
- `rdi-investments` ✅

**Avoid:**
- Generic names: `chart1`, `revenue-chart` ❌
- Spaces or special chars: `economic impact revenue` ❌
- Abbreviations: `econ-impact-rev` ❌ (unless widely understood)

---

## Chart Registry Implementation Example

### File: `web/src/config/chartRegistry.ts`

```typescript
import type { GraphTemplateConfig } from '../components/GraphTemplate'
import type { BarChartTemplateConfig } from '../components/BarChartTemplate'
import { loadAllTabsData } from '../utils/dataLoader'

export type ChartId = 
  | 'economic-impact-revenue'
  | 'economic-impact-employees'
  | 'economic-impact-firms'
  | 'economic-impact-rdi'
  | 'workforce-gender'
  | 'workforce-immigration'
  | 'barometer-financial'
  | 'barometer-employees'
  | 'barometer-economy'

export interface ChartRegistryEntry {
  chartId: ChartId
  title: string
  category: 'economic-impact' | 'workforce' | 'barometer'
  component: 'GraphTemplate' | 'BarChartTemplate'
  dataSource: 'main-data' | 'employees-gender-data' | 'rdi-data' | 'barometer-data'
  configBuilder: (data: any[], params?: Record<string, any>) => GraphTemplateConfig | BarChartTemplateConfig | null
  defaultParams?: Record<string, any>
  filters?: {
    enabled: boolean
    options?: Array<{ value: string; label: string }>
    defaultFilter?: string
  }
  route?: string // Optional: specific route where chart appears
}

// Example registry entry
export const chartRegistry: Record<ChartId, ChartRegistryEntry> = {
  'economic-impact-revenue': {
    chartId: 'economic-impact-revenue',
    title: 'Startup Revenue',
    category: 'economic-impact',
    component: 'GraphTemplate',
    dataSource: 'main-data',
    filters: {
      enabled: true,
      options: [
        { value: 'all', label: 'All' },
        { value: 'early-stage', label: 'Early Stage' },
        { value: 'later-stage', label: 'Later Stage' }
      ],
      defaultFilter: 'all'
    },
    route: '/explore',
    configBuilder: (data, params = {}) => {
      const filter = params.filter || 'all'
      // Build config from data based on filter
      // ... (extract from buildRevenueChartConfig logic)
      return config
    }
  },
  'barometer-financial': {
    chartId: 'barometer-financial',
    title: 'Financial situation',
    category: 'barometer',
    component: 'GraphTemplate',
    dataSource: 'barometer-data',
    filters: { enabled: false },
    route: '/explore',
    configBuilder: (data, params = {}) => {
      // Build barometer config for financial tab
      // ... (extract from BarometerExplorer logic)
      return config
    }
  },
  // ... more entries
}

// Helper function to get chart config
export async function getChartConfig(
  chartId: ChartId,
  params?: Record<string, any>
): Promise<GraphTemplateConfig | BarChartTemplateConfig | null> {
  const entry = chartRegistry[chartId]
  if (!entry) {
    console.error(`Chart ${chartId} not found in registry`)
    return null
  }

  // Load data based on dataSource
  const { main, employeesGender, rdi, barometer } = await loadAllTabsData()
  
  let data: any[] = []
  switch (entry.dataSource) {
    case 'main-data':
      data = main
      break
    case 'employees-gender-data':
      data = employeesGender
      break
    case 'rdi-data':
      data = rdi
      break
    case 'barometer-data':
      data = barometer
      break
  }

  return entry.configBuilder(data, params)
}
```

### Usage in Pages

```typescript
// In ExploreData.tsx or a new ChartEmbed component
import { getChartConfig, type ChartId } from '../config/chartRegistry'
import GraphTemplate from '../components/GraphTemplate'
import BarChartTemplate from '../components/BarChartTemplate'

function ChartEmbed({ chartId, params }: { chartId: ChartId; params?: Record<string, any> }) {
  const [config, setConfig] = useState(null)
  
  useEffect(() => {
    getChartConfig(chartId, params).then(setConfig)
  }, [chartId, params])
  
  if (!config) return <div>Loading...</div>
  
  const entry = chartRegistry[chartId]
  const Component = entry.component === 'GraphTemplate' ? GraphTemplate : BarChartTemplate
  
  return <Component config={config} filterValue={params?.filter || 'all'} onFilterChange={() => {}} />
}
```

---

## Embedding Readiness Checklist

### ✅ What Works Out-of-the-Box

- [x] Charts are self-contained React components
- [x] Data loading is abstracted (`loadAllTabsData()`)
- [x] Chart configs are pure functions (no side effects)
- [x] Responsive design (mobile-friendly)
- [x] Theme support (light/dark mode)

### ⚠️ What Would Break in Embedding

#### 1. **Navigation Dependency**
- **Issue:** All pages include `<Navigation />` component
- **Impact:** Embed would show full site navigation
- **Fix:** Add `?embed=1` query param, conditionally hide navigation

#### 2. **Fullscreen Modal**
- **Issue:** Fullscreen uses React state (`fullscreenChart` in `ExploreData.tsx`)
- **Impact:** Fullscreen button won't work in isolated embed
- **Fix:** 
  - Option A: Disable fullscreen in embed mode
  - Option B: Use `window.postMessage` to communicate with parent frame

#### 3. **Route-Based State**
- **Issue:** Charts depend on page-level state (filters, tabs)
- **Impact:** Embed can't access parent page state
- **Fix:** Pass state via URL params or props

#### 4. **Explorer Tab State**
- **Issue:** `EconomicImpactExplorer`, `WorkforceExplorer`, `BarometerExplorer` manage internal tab state
- **Impact:** Can't control which tab is shown from outside
- **Fix:** Make tab controlled via props (already partially supported)

#### 5. **Data Table State**
- **Issue:** Table visibility state (`showTable`) is page-level
- **Impact:** Table toggle won't work independently
- **Fix:** Move table state into chart component or pass via props

#### 6. **Theme Context**
- **Issue:** Charts depend on `ThemeContext` from `App.tsx`
- **Impact:** Embed needs its own theme provider
- **Fix:** Wrap embed component with `ThemeProvider` or pass theme via props

#### 7. **Window Width Detection**
- **Issue:** Charts use `windowWidth` state for responsive intervals
- **Impact:** Embed might not detect parent container width correctly
- **Fix:** Use `ResizeObserver` on container instead of `window.innerWidth`

#### 8. **CSS Scope**
- **Issue:** Global CSS classes (`.chart-card`, `.chart-wrapper`) might conflict
- **Impact:** Styles from parent page could leak into embed
- **Fix:** Use CSS modules or scoped styles for embed builds

#### 9. **Data Loading**
- **Issue:** `loadAllTabsData()` loads all datasets
- **Impact:** Embed loads unnecessary data
- **Fix:** Create `loadChartData(chartId)` that loads only required data

#### 10. **Feature Flags**
- **Issue:** Feature flags (`USE_ECON_IMPACT_EXPLORER`, etc.) are compile-time
- **Impact:** Can't toggle explorers in embed
- **Fix:** Move to runtime config or always use explorer components

---

## Minimal Changes for Iframe Embedding

### Step 1: Create Embed Route
```typescript
// In App.tsx
<Route path="/embed/chart/:chartId" element={<ChartEmbed />} />
```

### Step 2: Create ChartEmbed Component
```typescript
// web/src/components/ChartEmbed.tsx
import { useParams, useSearchParams } from 'react-router-dom'
import { getChartConfig, chartRegistry } from '../config/chartRegistry'
import GraphTemplate from './GraphTemplate'
import BarChartTemplate from './BarChartTemplate'
import { ThemeProvider } from '../contexts/ThemeContext'

function ChartEmbed() {
  const { chartId } = useParams<{ chartId: string }>()
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter') || 'all'
  const tab = searchParams.get('tab') // For explorer charts
  
  // ... load config and render
}
```

### Step 3: Hide Navigation in Embed Mode
```typescript
// In App.tsx
const isEmbed = location.pathname.startsWith('/embed')
{!isEmbed && <Navigation />}
```

### Step 4: Adjust Layout for Embed
```css
/* In ChartEmbed.css */
.chart-embed-container {
  padding: 0;
  margin: 0;
  min-height: 400px;
}
```

---

## Minimal Changes for Script Embedding

### Step 1: Create Standalone Bundle
```javascript
// web/src/embed.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChartEmbed } from './components/ChartEmbed'

// Expose global API
window.FSCCharts = {
  render: (containerId, chartId, options = {}) => {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`Container ${containerId} not found`)
      return
    }
    
    const root = ReactDOM.createRoot(container)
    root.render(
      <ChartEmbed chartId={chartId} {...options} />
    )
  }
}
```

### Step 2: Build Script Bundle
```json
// vite.config.ts - add build config
{
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        embed: './src/embed.tsx'
      }
    }
  }
}
```

### Step 3: Usage in HTML
```html
<div id="my-chart"></div>
<script src="https://your-site.com/embed.js"></script>
<script>
  FSCCharts.render('my-chart', 'economic-impact-revenue', {
    filter: 'all',
    theme: 'dark'
  })
</script>
```

---

## Summary

**Total Charts:** 10 unique charts (+ 5 legacy variants + 1 decorative)

**Chart Categories:**
- Economic Impact: 4 charts (Revenue, Employees, Firms, R&D)
- Workforce: 2 charts (Gender, Immigration)
- Barometer: 3 charts (Financial, Employees, Economy)
- R&D: Dynamic (1+ charts based on data columns)

**Registry Benefits:**
- Single source of truth for chart definitions
- Easy to add new charts
- Consistent naming and structure
- Enables programmatic chart rendering (for embeds)

**Embedding Effort:**
- **Iframe:** Low effort (2-3 days) - mostly routing and CSS
- **Script:** Medium effort (5-7 days) - requires build changes and API design

