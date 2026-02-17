import { useState, useEffect, useMemo } from 'react'
import GraphTemplate from './GraphTemplate'
import type { GraphTemplateConfig } from './GraphTemplate'
import styles from './EconomicImpactExplorer.module.css'

interface EconomicImpactExplorerProps {
  // Config builders - functions that return config objects
  buildRevenueConfig: () => GraphTemplateConfig | null
  buildEmployeesConfig: () => GraphTemplateConfig | null
  buildFirmsConfig: () => GraphTemplateConfig | null
  buildRdiConfig: () => GraphTemplateConfig | null
  
  // Filter values and setters
  revenueFilter: 'all' | 'early-stage' | 'later-stage'
  setRevenueFilter: (value: 'all' | 'early-stage' | 'later-stage') => void
  employeesFilter: 'all' | 'finland'
  setEmployeesFilter: (value: 'all' | 'finland') => void
  firmsFilter: 'all' | 'finland' | 'early-stage' | 'later-stage'
  setFirmsFilter: (value: 'all' | 'finland' | 'early-stage' | 'later-stage') => void
  
  // Check if charts have data
  hasRevenue: boolean
  hasEmployees: boolean
  hasFirms: boolean
  hasRdi: boolean
}

type TabType = 'revenue' | 'employees' | 'firms' | 'rdi'

// Expected title patterns for each tab (for validation)
const EXPECTED_TITLES: Record<TabType, string[]> = {
  revenue: ['Startup Revenue', 'Revenue'],
  employees: ['Number of Employees', 'Employees'],
  firms: ['Active firms', 'Firms'],
  rdi: ['R&D investments', 'R&D']
}

/**
 * Development-only validation: Check if config title matches expected tab
 * This is a lightweight "smoke test" to catch data mismatches
 * 
 * Note: Runs in all environments but only logs warnings (harmless in production)
 */
const validateConfigForTab = (config: GraphTemplateConfig | null, tab: TabType): void => {
  if (!config) return
  
  const expectedTitles = EXPECTED_TITLES[tab]
  const configTitle = config.title.toLowerCase().trim()
  const matches = expectedTitles.some(expected => 
    configTitle === expected.toLowerCase().trim() || 
    configTitle.includes(expected.toLowerCase().trim())
  )
  
  if (!matches) {
    // Lightweight check - only warn, don't throw
    // In production builds, this will be tree-shaken if console.warn is removed
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[EconomicImpactExplorer] Potential data mismatch: Tab "${tab}" has title "${config.title}" ` +
        `which doesn't match expected patterns: ${expectedTitles.join(', ')}`
      )
    }
  }
}

const EconomicImpactExplorer = ({
  buildRevenueConfig,
  buildEmployeesConfig,
  buildFirmsConfig,
  buildRdiConfig,
  revenueFilter,
  setRevenueFilter,
  employeesFilter,
  setEmployeesFilter,
  firmsFilter,
  setFirmsFilter,
  hasRevenue,
  hasEmployees,
  hasFirms,
  hasRdi
}: EconomicImpactExplorerProps) => {
  // Determine initial tab based on available data
  const getInitialTab = (): TabType => {
    if (hasRevenue) return 'revenue'
    if (hasEmployees) return 'employees'
    if (hasFirms) return 'firms'
    if (hasRdi) return 'rdi'
    return 'revenue'
  }

  const [selectedTab, setSelectedTab] = useState<TabType>(getInitialTab())

  // Update tab if current selection becomes unavailable
  useEffect(() => {
    if (selectedTab === 'revenue' && !hasRevenue) {
      setSelectedTab(getInitialTab())
    } else if (selectedTab === 'employees' && !hasEmployees) {
      setSelectedTab(getInitialTab())
    } else if (selectedTab === 'firms' && !hasFirms) {
      setSelectedTab(getInitialTab())
    } else if (selectedTab === 'rdi' && !hasRdi) {
      setSelectedTab(getInitialTab())
    }
  }, [hasRevenue, hasEmployees, hasFirms, hasRdi, selectedTab])

  const tabs = [
    { id: 'revenue' as TabType, label: 'Revenue', available: hasRevenue },
    { id: 'employees' as TabType, label: 'Employees', available: hasEmployees },
    { id: 'firms' as TabType, label: 'Active firms', available: hasFirms },
    { id: 'rdi' as TabType, label: 'R&D', available: hasRdi }
  ].filter(tab => tab.available)

  /**
   * Render chart for the currently selected tab.
   * 
   * IMPORTANT STATE MANAGEMENT NOTES:
   * - Filters persist across tab switches (intentional design)
   *   - Each metric has its own filter state (revenueFilter, employeesFilter, etc.)
   *   - When switching tabs, the filter for that metric is preserved
   *   - This allows users to set filters and switch between metrics without losing selections
   * 
   * - Data table and fullscreen actions are bound to the current tab's state
   *   - Each config builder creates callbacks that reference the correct state variables
   *   - The key prop ensures GraphTemplate remounts when tab changes, preventing stale closures
   */
  const renderChart = useMemo(() => {
    switch (selectedTab) {
      case 'revenue': {
        const config = buildRevenueConfig()
        if (!config) return null
        validateConfigForTab(config, 'revenue')
        return (
          <GraphTemplate
            key={`explorer-revenue-${revenueFilter}`} // Force remount on filter change
            config={config}
            filterValue={revenueFilter}
            onFilterChange={(value) => setRevenueFilter(value as 'all' | 'early-stage' | 'later-stage')}
            chartId="economic-impact-revenue"
          />
        )
      }
      case 'employees': {
        const config = buildEmployeesConfig()
        if (!config) return null
        validateConfigForTab(config, 'employees')
        return (
          <GraphTemplate
            key={`explorer-employees-${employeesFilter}`} // Force remount on filter change
            config={config}
            filterValue={employeesFilter}
            onFilterChange={(value) => setEmployeesFilter(value as 'all' | 'finland')}
            chartId="economic-impact-employees"
          />
        )
      }
      case 'firms': {
        const config = buildFirmsConfig()
        if (!config) return null
        validateConfigForTab(config, 'firms')
        return (
          <GraphTemplate
            key={`explorer-firms-${firmsFilter}`} // Force remount on filter change
            config={config}
            filterValue={firmsFilter}
            onFilterChange={(value) => setFirmsFilter(value as 'all' | 'finland' | 'early-stage' | 'later-stage')}
            chartId="economic-impact-firms"
          />
        )
      }
      case 'rdi': {
        const config = buildRdiConfig()
        if (!config) return null
        validateConfigForTab(config, 'rdi')
        return (
          <GraphTemplate
            key="explorer-rdi" // R&D has no filters, so static key
            config={config}
            filterValue="all"
            onFilterChange={() => {}}
            chartId="economic-impact-rdi"
          />
        )
      }
      default:
        return null
    }
  }, [selectedTab, revenueFilter, employeesFilter, firmsFilter, buildRevenueConfig, buildEmployeesConfig, buildFirmsConfig, buildRdiConfig])

  return (
    <div className={styles.economicImpactExplorer}>
      {/* Helper text */}
      <p className={styles.helperText}>
        Switch metrics below.
      </p>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${selectedTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className={styles.chartContainer}>
        {renderChart}
      </div>
    </div>
  )
}

export default EconomicImpactExplorer

