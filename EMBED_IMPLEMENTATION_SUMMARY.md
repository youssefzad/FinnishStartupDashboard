# Chart Embedding Implementation Summary

## Files Changed/Added

### New Files Created:
1. **`web/src/charts/buildEconomicImpactConfigs.ts`** - Extracted config builders for revenue, employees, firms, R&D
2. **`web/src/charts/buildWorkforceConfigs.ts`** - Extracted config builders for gender and immigration charts
3. **`web/src/charts/buildBarometerConfigs.ts`** - Extracted config builder for barometer charts
4. **`web/src/config/chartRegistry.ts`** - Chart registry mapping chartId to config builders
5. **`web/src/components/ChartById.tsx`** - Reusable component to render chart by ID
6. **`web/src/components/ChartEmbedPage.tsx`** - Embed page component with postMessage height updates
7. **`web/src/components/ChartEmbedPage.css`** - Styles for embed page
8. **`web/src/components/EmbedModal.tsx`** - Modal with iframe snippets
9. **`web/src/components/EmbedModal.css`** - Styles for embed modal
10. **`web/src/components/EmbedHelp.tsx`** - Documentation page for embedding
11. **`web/src/components/EmbedHelp.css`** - Styles for help page

### Files Modified:
1. **`web/src/App.tsx`** - Added `/embed/:chartId` and `/embed-help` routes, hide navigation for embed routes
2. **`web/src/components/GraphTemplate.tsx`** - Added embed button and chartId prop
3. **`web/src/components/BarChartTemplate.tsx`** - Added embed button and chartId prop
4. **`web/src/components/EconomicImpactExplorer.tsx`** - Pass chartId to GraphTemplate
5. **`web/src/components/WorkforceExplorer.tsx`** - Pass chartId to BarChartTemplate
6. **`web/src/components/BarometerExplorer.tsx`** - Pass chartId to GraphTemplate

## Key Implementation Details

### Chart Registry Entry Example

```typescript
'economic-impact-revenue': {
  chartId: 'economic-impact-revenue',
  title: 'Startup Revenue',
  kind: 'graph',
  dataKey: 'main',
  buildConfig: (data, params) => {
    const theme = params.theme || 'dark'
    const windowWidth = params.windowWidth || 1200
    return buildRevenueConfig(data, {
      filter: params.filter || 'all',
      windowWidth,
      chartColors: getChartColors(theme),
      getXAxisInterval: getXAxisInterval(windowWidth),
      // ... other params
    })
  }
}
```

### Embed Page Implementation

**ChartEmbedPage.tsx** handles:
- Reading `chartId` from URL params
- Reading query params (theme, filter, view, showTitle, showSource, compact)
- Applying theme override (non-persistent)
- PostMessage height updates to parent frame
- Rendering ChartById component

**PostMessage Logic:**
```typescript
useEffect(() => {
  const sendHeight = () => {
    if (containerRef.current && chartId) {
      const height = containerRef.current.scrollHeight
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'FSC_CHART_HEIGHT',
          chartId,
          height
        }, '*')
      }
    }
  }
  
  sendHeight()
  const resizeObserver = new ResizeObserver(() => sendHeight())
  resizeObserver.observe(containerRef.current)
  
  return () => resizeObserver.disconnect()
}, [chartId])
```

### Embed Modal Snippet Generator

**Basic iframe:**
```html
<iframe src="https://your-domain.com/embed/economic-impact-revenue?filter=all&theme=system"
     style="width:100%;border:0;"
     height="520"
     loading="lazy"></iframe>
```

**Responsive iframe (with postMessage):**
```html
<iframe id="fsc-chart-economic-impact-revenue" src="..."
     style="width:100%;border:0;" height="520" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FSC_CHART_HEIGHT' && 
        event.data.chartId === 'economic-impact-revenue') {
      document.getElementById('fsc-chart-economic-impact-revenue').style.height = 
        event.data.height + 'px';
    }
  });
</script>
```

## Chart IDs

All charts use stable IDs:
- `economic-impact-revenue`
- `economic-impact-employees`
- `economic-impact-firms`
- `economic-impact-rdi`
- `workforce-gender`
- `workforce-immigration`
- `barometer-financial`
- `barometer-employees`
- `barometer-economy`

## URL Parameters

- `theme` - `light` | `dark` | `system` (default: system)
- `filter` - Filter value (e.g., `all`, `early-stage`, `finland`)
- `view` - View mode for bar charts (e.g., `none`, `male-share`, `female-share`)
- `showTitle` - `1` | `0` (default: `1`)
- `showSource` - `1` | `0` (default: `1`)
- `compact` - `1` | `0` (default: `0`)

## Routes

- `/embed/:chartId` - Embed route (no navigation, minimal layout)
- `/embed-help` - Documentation page (normal site page)

## Manual Test Checklist

- [ ] Navigate to `/embed/economic-impact-revenue` - chart renders
- [ ] Navigate to `/embed/economic-impact-revenue?filter=early-stage` - filter applies
- [ ] Navigate to `/embed/workforce-gender?view=female-share` - view mode applies
- [ ] Navigate to `/embed/barometer-financial?theme=light` - theme applies
- [ ] Navigate to `/embed/economic-impact-revenue?showTitle=0` - title hidden
- [ ] Navigate to `/embed/economic-impact-revenue?showSource=0` - source hidden
- [ ] Navigate to `/embed/economic-impact-revenue?compact=1` - reduced padding
- [ ] Test postMessage resizing in a simple HTML page with iframe
- [ ] Click "Embed" button on `/explore` page - modal opens
- [ ] Copy basic iframe snippet - works when pasted
- [ ] Copy responsive iframe snippet - auto-resizes height
- [ ] Navigate to `/embed-help` - documentation page loads
- [ ] All 9 chartIds embed correctly
- [ ] Invalid chartId shows error with list of valid IDs

## Notes

- **No breaking changes**: `/explore` page works exactly as before
- **Theme handling**: Embed theme is URL-controlled, doesn't persist to localStorage
- **Data loading**: Currently loads all datasets (acceptable for embed use case)
- **Routing**: Uses BrowserRouter (no hash), so embeds use `/embed/:chartId` not `/#/embed/:chartId`
- **Navigation**: Hidden automatically for routes starting with `/embed`
- **PostMessage**: Height updates sent on mount and resize (ResizeObserver + window resize listener)

