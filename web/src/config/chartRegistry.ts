import type { GraphTemplateConfig } from '../components/GraphTemplate'
import type { BarChartTemplateConfig } from '../components/BarChartTemplate'
import { buildRevenueConfig, buildEmployeesConfig, buildFirmsConfig, buildRdiConfig, type EconomicImpactConfigParams } from '../charts/buildEconomicImpactConfigs'
import { buildGenderConfig, buildImmigrationConfig } from '../charts/buildWorkforceConfigs'
import { buildBarometerConfig } from '../charts/buildBarometerConfigs'

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
  kind: 'graph' | 'bar'
  dataKey: 'main' | 'employeesGender' | 'rdi' | 'barometer'
  buildConfig: (data: any[], params: Record<string, any>) => GraphTemplateConfig | BarChartTemplateConfig | null
}

// Helper to get chart colors based on theme
function getChartColors(theme: 'light' | 'dark'): EconomicImpactConfigParams['chartColors'] {
  if (theme === 'light') {
    return {
      grid: 'rgba(0, 0, 0, 0.1)',
      axis: 'rgba(26, 26, 26, 0.5)',
      tick: 'rgba(26, 26, 26, 0.7)',
      tooltipBg: 'rgba(255, 255, 255, 0.95)',
      tooltipText: '#1a1a1a'
    }
  } else {
    return {
      grid: 'rgba(255, 255, 255, 0.1)',
      axis: 'rgba(255, 255, 255, 0.5)',
      tick: 'rgba(255, 255, 255, 0.7)',
      tooltipBg: 'rgba(17, 17, 17, 0.95)',
      tooltipText: '#ffffff'
    }
  }
}

// Helper to get X-axis interval based on window width
function getXAxisInterval(windowWidth: number): () => number {
  return () => {
    if (windowWidth >= 1024) {
      return 0
    } else if (windowWidth >= 768) {
      return 1
    } else {
      return 2
    }
  }
}

export const chartRegistry: Record<ChartId, ChartRegistryEntry> = {
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
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'economic-impact-employees': {
    chartId: 'economic-impact-employees',
    title: 'Number of Employees',
    kind: 'graph',
    dataKey: 'main',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildEmployeesConfig(data, {
        filter: params.filter || 'all',
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'economic-impact-firms': {
    chartId: 'economic-impact-firms',
    title: 'Active firms',
    kind: 'graph',
    dataKey: 'main',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildFirmsConfig(data, {
        filter: params.filter || 'all',
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'economic-impact-rdi': {
    chartId: 'economic-impact-rdi',
    title: 'R&D investments',
    kind: 'graph',
    dataKey: 'rdi',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildRdiConfig(data, {
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'workforce-gender': {
    chartId: 'workforce-gender',
    title: 'Gender distribution of startup workers',
    kind: 'bar',
    dataKey: 'employeesGender',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildGenderConfig(data, {
        view: params.view || 'none',
        showMaleBar: params.showMaleBar !== false,
        showFemaleBar: params.showFemaleBar !== false,
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable,
        onViewChange: params.onViewChange,
        onToggleBar: params.onToggleBar
      })
    }
  },
  'workforce-immigration': {
    chartId: 'workforce-immigration',
    title: 'Immigration status',
    kind: 'bar',
    dataKey: 'employeesGender',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildImmigrationConfig(data, {
        view: params.view || 'none',
        showFinnishBar: params.showFinnishBar !== false,
        showForeignBar: params.showForeignBar !== false,
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable,
        onViewChange: params.onViewChange,
        onToggleBar: params.onToggleBar
      })
    }
  },
  'barometer-financial': {
    chartId: 'barometer-financial',
    title: 'Financial situation',
    kind: 'graph',
    dataKey: 'barometer',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildBarometerConfig(data, {
        tab: 'financial',
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'barometer-employees': {
    chartId: 'barometer-employees',
    title: 'Number of employees',
    kind: 'graph',
    dataKey: 'barometer',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildBarometerConfig(data, {
        tab: 'employees',
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  },
  'barometer-economy': {
    chartId: 'barometer-economy',
    title: 'Surrounding economy',
    kind: 'graph',
    dataKey: 'barometer',
    buildConfig: (data, params) => {
      const theme = params.theme || 'dark'
      const windowWidth = params.windowWidth || 1200
      return buildBarometerConfig(data, {
        tab: 'economy',
        windowWidth,
        chartColors: getChartColors(theme),
        getXAxisInterval: getXAxisInterval(windowWidth),
        onShowTable: params.onShowTable,
        onFullscreen: params.onFullscreen,
        showTable: params.showTable
      })
    }
  }
}

// Helper to get all chart IDs
export function getAllChartIds(): ChartId[] {
  return Object.keys(chartRegistry) as ChartId[]
}

// Helper to check if chart ID exists
export function isValidChartId(chartId: string): chartId is ChartId {
  return chartId in chartRegistry
}

