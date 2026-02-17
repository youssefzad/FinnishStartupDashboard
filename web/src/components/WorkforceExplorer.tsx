import { useState, useEffect, useMemo } from 'react'
import BarChartTemplate from './BarChartTemplate'
import type { BarChartTemplateConfig } from './BarChartTemplate'
import styles from './WorkforceExplorer.module.css'

interface WorkforceExplorerProps {
  // Config builders - functions that return config objects
  buildGenderConfig: () => BarChartTemplateConfig | null
  buildImmigrationConfig: () => BarChartTemplateConfig | null
  
  // Check if charts have data
  hasGender: boolean
  hasImmigration: boolean
  
  // Fullscreen and table actions
  onShowTable?: () => void
  onFullscreen?: (tab: TabType) => void
  showTable?: boolean
  
  // Tab state sync (for fullscreen)
  selectedTab?: TabType
  onTabChange?: (tab: TabType) => void
}

type TabType = 'gender' | 'immigration'

// Expected title patterns for each tab (for validation)
const EXPECTED_TITLES: Record<TabType, string[]> = {
  gender: ['Gender distribution', 'Gender'],
  immigration: ['Immigration status', 'Immigration']
}

/**
 * Development-only validation: Check if config title matches expected tab
 * This is a lightweight "smoke test" to catch data mismatches
 */
const validateConfigForTab = (config: BarChartTemplateConfig | null, tab: TabType): void => {
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
  hasGender,
  hasImmigration,
  onShowTable,
  onFullscreen,
  showTable = false,
  selectedTab: externalSelectedTab,
  onTabChange
}: WorkforceExplorerProps) => {
  // Determine initial tab based on available data
  const getInitialTab = (): TabType => {
    if (hasGender) return 'gender'
    if (hasImmigration) return 'immigration'
    return 'gender'
  }

  const [internalSelectedTab, setInternalSelectedTab] = useState<TabType>(getInitialTab())
  
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
    }
  }, [hasGender, hasImmigration, selectedTab])

  const tabs = [
    { id: 'gender' as TabType, label: 'Gender', available: hasGender },
    { id: 'immigration' as TabType, label: 'Immigration', available: hasImmigration }
  ].filter(tab => tab.available)

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
      default:
        return null
    }
  }, [selectedTab, buildGenderConfig, buildImmigrationConfig])

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
            onClick={() => handleTabChange(tab.id)}
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

