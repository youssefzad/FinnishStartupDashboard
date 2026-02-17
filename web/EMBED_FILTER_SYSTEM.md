# Embed Filter System Documentation

## Overview

This document describes the systematic approach for ensuring all embeddable charts have the same filtering options as the main statistics website.

## Architecture

### 1. Chart Registry (`web/src/config/chartRegistry.ts`)

The chart registry defines all embeddable charts and their configuration. Each entry includes:
- `chartId`: Unique identifier
- `title`: Display title
- `kind`: 'graph' or 'bar'
- `dataKey`: Which dataset to use ('main', 'employeesGender', 'rdi', 'barometer')
- `buildConfig`: Function that builds the chart configuration

### 2. Config Builders

Each chart type has a config builder function in:
- `web/src/charts/buildEconomicImpactConfigs.ts` - Economic impact charts
- `web/src/charts/buildWorkforceConfigs.ts` - Workforce charts
- `web/src/charts/buildBarometerConfigs.ts` - Barometer charts

### 3. Filter Types

#### Graph Charts (Economic Impact)
- **Filter-based**: Single value filter (e.g., 'all', 'early-stage', 'finland')
- Examples:
  - Revenue: `filter=all|early-stage|later-stage`
  - Employees: `filter=all|finland`
  - Firms: `filter=all|finland|early-stage|later-stage`

#### Bar Charts (Workforce)
- **Toggle buttons**: Show/hide bars (e.g., `showMaleBar=true|false`)
- **View mode buttons**: Switch between share views (e.g., `view=male-share|female-share|none`)
- Examples:
  - Gender: `view=male-share|female-share|none`, `showMaleBar=true|false`, `showFemaleBar=true|false`
  - Immigration: `view=finnish-share|foreign-share|none`, `showFinnishBar=true|false`, `showForeignBar=true|false`

## Implementation Checklist for New Charts

When adding a new chart to the embed system:

### Step 1: Add to Chart Registry
```typescript
'new-chart-id': {
  chartId: 'new-chart-id',
  title: 'Chart Title',
  kind: 'graph' | 'bar',
  dataKey: 'main' | 'employeesGender' | 'rdi' | 'barometer',
  buildConfig: (data, params) => {
    // Build and return config
  }
}
```

### Step 2: Create Config Builder Function

#### For Graph Charts:
```typescript
export function buildNewChartConfig(
  data: any[],
  params: EconomicImpactConfigParams = {}
): GraphTemplateConfig | null {
  // 1. Use getAllColumnNames() helper (not data[0])
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  const allColumns = getAllColumnNames()

  // 2. Find columns using allColumns.find()
  const mainCol = allColumns.find(key => { /* ... */ })
  const filteredCol = allColumns.find(key => { /* ... */ })

  // 3. Build filterOptions array
  const filterOptions = [
    { value: 'all', label: 'All' }
  ]
  if (filteredCol) {
    filterOptions.push({ value: 'filtered', label: 'Filtered' })
  }

  // 4. Return config with filtersConfig
  return {
    // ... other config
    filtersConfig: {
      enabled: true,
      options: filterOptions,
      defaultFilter: 'all',
      filterKey: 'newChartFilter'
    }
  }
}
```

#### For Bar Charts:
```typescript
export function buildNewBarChartConfig(
  data: any[],
  params: WorkforceConfigParams = {}
): BarChartTemplateConfig | null {
  // 1. Use getAllColumnNames() helper
  const getAllColumnNames = () => {
    const columnSet = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key))
    })
    return Array.from(columnSet)
  }
  const allColumns = getAllColumnNames()

  // 2. Find share columns if they exist
  const shareCol = allColumns.find(key => { /* ... */ })

  // 3. Build toggleButtons and viewModeButtons
  const toggleButtons = [
    {
      label: 'Bar 1',
      isActive: view === 'none' && showBar1,
      onClick: () => {
        if (onToggleBar) {
          onToggleBar('bar1', !showBar1)
        }
      }
    }
  ]

  const viewModeButtons = shareCol ? [{
    label: 'Share View',
    value: 'share-view',
    isActive: view === 'share-view',
    onClick: () => {
      if (onViewChange) {
        onViewChange(view === 'share-view' ? 'none' : 'share-view')
      }
    }
  }] : []

  // 4. Return config with filtersConfig
  return {
    // ... other config
    filtersConfig: {
      enabled: true,
      toggleButtons,
      viewModeButtons
    }
  }
}
```

### Step 3: Update ChartEmbedPage

If adding new filter types, update `ChartEmbedPage.tsx`:
- Add URL param extraction
- Add handler functions (handleFilterChange, handleViewChange, handleToggleBar)
- Pass handlers to ChartById

### Step 4: Update ChartById

If needed, update `ChartById.tsx` to pass callbacks to config builders:
```typescript
const builtConfig = entry.buildConfig(data, {
  ...params,
  // ... other params
  onViewChange: embedMode ? onViewChange : undefined,
  onToggleBar: embedMode ? onToggleBar : undefined
})
```

## Column Detection Best Practice

**ALWAYS use `getAllColumnNames()` helper instead of `Object.keys(data[0])`**

Reason: Some columns may not exist in the first row (e.g., "Early Stage Startup Revenue" starts in 2010, not 2005).

```typescript
// ❌ WRONG - May miss columns that don't exist in first row
const col = Object.keys(data[0]).find(key => { /* ... */ })

// ✅ CORRECT - Checks all rows
const getAllColumnNames = () => {
  const columnSet = new Set<string>()
  data.forEach(row => {
    Object.keys(row).forEach(key => columnSet.add(key))
  })
  return Array.from(columnSet)
}
const allColumns = getAllColumnNames()
const col = allColumns.find(key => { /* ... */ })
```

## Current Chart Status

### ✅ Fully Implemented
- `economic-impact-revenue`: Filters: all, early-stage, later-stage
- `economic-impact-employees`: Filters: all, finland
- `economic-impact-firms`: Filters: all, finland, early-stage, later-stage
- `economic-impact-rdi`: No filters (correct)
- `workforce-gender`: Toggle buttons (Male/Female), View modes (Share of Males/Females)
- `workforce-immigration`: Toggle buttons (Finnish/Foreign), View modes (Share of Finnish/Foreign)
- `barometer-*`: No filters (correct, tabs handled separately)

## Testing Checklist

For each chart, verify:
1. ✅ Filter buttons appear in embed mode
2. ✅ Clicking filter buttons updates URL params
3. ✅ Chart data changes when filter is applied
4. ✅ URL params persist when page is refreshed
5. ✅ Filter state matches URL params on initial load
6. ✅ Column detection works even if columns don't exist in first row

## URL Parameter Reference

### Graph Charts
- `filter=all|early-stage|later-stage|finland` - Filter selection
- `theme=light|dark|system` - Theme override
- `showTitle=0|1` - Show/hide title (default: 1)
- `showSource=0|1` - Show/hide source (default: 1)
- `compact=0|1` - Compact padding (default: 0)
- `fscDebug=1` - Show debug info

### Bar Charts
- `view=none|male-share|female-share|finnish-share|foreign-share` - View mode
- `showMaleBar=true|false` - Toggle male bar visibility
- `showFemaleBar=true|false` - Toggle female bar visibility
- `showFinnishBar=true|false` - Toggle Finnish bar visibility
- `showForeignBar=true|false` - Toggle Foreign bar visibility
- All graph chart params also apply

## Future Enhancements

1. **Validation**: Add runtime validation to ensure filter options match available columns
2. **Documentation**: Auto-generate filter documentation from chart registry
3. **Testing**: Add automated tests for filter functionality
4. **Type Safety**: Improve TypeScript types for filter values

