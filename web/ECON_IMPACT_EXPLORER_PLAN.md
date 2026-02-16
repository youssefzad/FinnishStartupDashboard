# Economic Impact Explorer - Implementation Plan

## Goal
Replace the first 4 time-series charts (Revenue, Employees, Active firms, R&D) with a single tabbed interface.

## Files to Touch (5 files max)

1. **web/src/components/EconomicImpactExplorer.tsx** (NEW)
   - Tabbed interface component
   - Reuses existing config builders and GraphTemplate
   - Manages tab state and chart rendering

2. **web/src/components/ExploreData.tsx** (MODIFY)
   - Add `USE_ECON_IMPACT_EXPLORER` flag at top
   - Conditionally render explorer vs. individual charts
   - Pass necessary props/data to explorer

3. **web/src/components/ExploreData.css** (MODIFY)
   - Add styles for tab/segmented control interface

## Implementation Details

### EconomicImpactExplorer Component
- Props: All data, state setters, config builders (or access to them)
- State: `selectedTab: 'revenue' | 'employees' | 'firms' | 'rdi'`
- Tabs: Revenue | Employees | Active firms | R&D
- Each tab renders GraphTemplate with appropriate config
- Reuses existing filter logic and state management

### Flag Location
- Top of ExploreData.tsx: `const USE_ECON_IMPACT_EXPLORER = false`
- Easy 1-line toggle for rollback

### Conditional Rendering
- If flag is true: Render `<EconomicImpactExplorer />` instead of 4 individual charts
- If flag is false: Render existing 4 charts (lines 1833-2056)

## Rollback
Change one line: `const USE_ECON_IMPACT_EXPLORER = false`

## Testing
- Verify flag off → shows 4 charts as before
- Verify flag on → shows tabbed explorer
- Verify all tabs work correctly
- Verify filters work in explorer mode
- Verify fullscreen and table buttons work

