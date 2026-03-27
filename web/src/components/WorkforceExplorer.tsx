import { useState, useEffect, useMemo } from 'react'
import BarChartTemplate from './BarChartTemplate'
import type { BarChartTemplateConfig } from './BarChartTemplate'
import GraphTemplate from './GraphTemplate'
import type { GraphTemplateConfig } from './GraphTemplate'
import styles from './WorkforceExplorer.module.css'

interface WorkforceExplorerProps {
  // Config builders - functions that return config objects
  buildGenderConfig: () => BarChartTemplateConfig | null
  buildImmigrationConfig: () => BarChartTemplateConfig | null
  buildWagesConfig: (view: 'all-workers' | 'by-gender') => GraphTemplateConfig | null
  
  // Check if charts have data
  hasGender: boolean
  hasImmigration: boolean
  hasWages: boolean
  
  // Fullscreen and table actions
  onShowTable?: () => void
  onFullscreen?: (tab: TabType) => void
  showTable?: boolean
  
  // Tab state sync (for fullscreen)
  selectedTab?: TabType
  onTabChange?: (tab: TabType) => void

  /** When set, wages All Workers / By Gender is controlled by the parent (keeps fullscreen in sync). */
  wagesView?: 'all-workers' | 'by-gender'
  onWagesViewChange?: (view: 'all-workers' | 'by-gender') => void
}

type TabType = 'gender' | 'immigration' | 'wages'

// Expected title patterns for each tab (for validation)
const EXPECTED_TITLES: Record<TabType, string[]> = {
  gender: ['Gender distribution', 'Gender'],
  immigration: ['Foreign background workers', 'Foreign background', 'Immigration status'],
  wages: ['Wages', 'Mean annual wages', 'Mean wages']
}

/**
 * Development-only validation: Check if config title matches expected tab
 * This is a lightweight "smoke test" to catch data mismatches
 */
const validateConfigForTab = (config: { title: string } | null, tab: TabType): void => {
  if (!config) return
  
  const expectedTitles = EXPECTED_TITLES[tab]
  const configTitle = config.title.toLowerCase().trim()
  const matches = expectedTitles.some(expected => 
    configTitle === expected.toLowerCase().trim() || 
    configTitle.includes(expected.toLowerCase().trim())
  )
  
  if (!matches) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[WorkforceExplorer] Potential data mismatch: Tab "${tab}" has title "${config.title}" ` +
        `which doesn't match expected patterns: ${expectedTitles.join(', ')}`
      )
    }
  }
}

const WorkforceExplorer = ({
  buildGenderConfig,
  buildImmigrationConfig,
  buildWagesConfig,
  hasGender,
  hasImmigration,
  hasWages,
  onShowTable,
  onFullscreen,
  showTable = false,
  selectedTab: externalSelectedTab,
  onTabChange,
  wagesView: wagesViewProp,
  onWagesViewChange
}: WorkforceExplorerProps) => {
  // Determine initial tab based on available data
  const getInitialTab = (): TabType => {
    if (hasGender) return 'gender'
    if (hasImmigration) return 'immigration'
    if (hasWages) return 'wages'
    return 'gender'
  }

  const [internalSelectedTab, setInternalSelectedTab] = useState<TabType>(getInitialTab())
  const [internalWagesView, setInternalWagesView] = useState<'all-workers' | 'by-gender'>('all-workers')
  const wagesView = wagesViewProp !== undefined ? wagesViewProp : internalWagesView

  const setWagesView = (value: 'all-workers' | 'by-gender') => {
    if (onWagesViewChange) onWagesViewChange(value)
    else setInternalWagesView(value)
  }
  
  // Use external tab if provided, otherwise use internal state
  const selectedTab = externalSelectedTab || internalSelectedTab
  
  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalSelectedTab(tab)
    }
  }

  // Update tab if current selection becomes unavailable
  useEffect(() => {
    if (selectedTab === 'gender' && !hasGender) {
      handleTabChange(getInitialTab())
    } else if (selectedTab === 'immigration' && !hasImmigration) {
      handleTabChange(getInitialTab())
    } else if (selectedTab === 'wages' && !hasWages) {
      handleTabChange(getInitialTab())
    }
  }, [hasGender, hasImmigration, hasWages, selectedTab])

  const tabs = [
    { id: 'gender' as TabType, label: 'Gender', available: hasGender },
    { id: 'immigration' as TabType, label: 'Foreign background', available: hasImmigration },
    { id: 'wages' as TabType, label: 'Wages', available: hasWages }
  ]

  /**
   * Render chart for the currently selected tab.
   * 
   * IMPORTANT STATE MANAGEMENT NOTES:
   * - Each chart has its own state (genderShareView, immigrationShareView, etc.)
   * - State is managed within the config builders in ExploreData.tsx
   * - The key prop ensures BarChartTemplate remounts when tab changes, preventing stale closures
   */
  const renderChart = useMemo(() => {
    switch (selectedTab) {
      case 'gender': {
        const config = buildGenderConfig()
        if (!config) return null
        validateConfigForTab(config, 'gender')
        // Add fullscreen and table actions to config
        const configWithActions = {
          ...config,
          onShowTable,
          onFullscreen: onFullscreen ? () => onFullscreen('gender') : undefined,
          showTable
        }
        return (
          <BarChartTemplate
            key={`explorer-gender-${selectedTab}`} // Force remount on tab change
            config={configWithActions}
            chartId="workforce-gender"
          />
        )
      }
      case 'immigration': {
        const config = buildImmigrationConfig()
        if (!config) return null
        validateConfigForTab(config, 'immigration')
        // Add fullscreen and table actions to config
        const configWithActions = {
          ...config,
          onShowTable,
          onFullscreen: onFullscreen ? () => onFullscreen('immigration') : undefined,
          showTable
        }
        return (
          <BarChartTemplate
            key={`explorer-immigration-${selectedTab}`} // Force remount on tab change
            config={configWithActions}
            chartId="workforce-immigration"
          />
        )
      }
      case 'wages': {
        const config = buildWagesConfig(wagesView)
        if (!config) return null
        validateConfigForTab({ title: config.title } as any, 'wages')
        const configWithActions = {
          ...config,
          onShowTable,
          onFullscreen: onFullscreen ? () => onFullscreen('wages') : undefined,
          showTable
        }
        return (
          <GraphTemplate
            key={`explorer-wages-${selectedTab}`}
            config={configWithActions}
            filterValue={wagesView}
            onFilterChange={(value) => {
              if (value === 'all-workers' || value === 'by-gender') setWagesView(value)
            }}
            chartId="workforce-wages"
          />
        )
      }
      default:
        return null
    }
  }, [selectedTab, buildGenderConfig, buildImmigrationConfig, buildWagesConfig, wagesView, onFullscreen, onShowTable, showTable])

  return (
    <div className={styles.workforceExplorer}>
      {/* Helper text - Mobile: centered above tabs */}
      <p className={`${styles.helperText} ${styles.helperTextMobile}`}>
        Metrics
      </p>

      {/* Tab Navigation Container - Desktop: inline with "Metrics:" */}
      <div className={styles.tabsContainer}>
        <span className={`${styles.helperText} ${styles.helperTextDesktop}`}>
          Metrics:
        </span>
        <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${selectedTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              if (!tab.available) return
              handleTabChange(tab.id)
            }}
            disabled={!tab.available}
            title={!tab.available ? 'Data not available yet' : undefined}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className={styles.chartContainer}>
        {renderChart}
      </div>
    </div>
  )
}

export default WorkforceExplorer

