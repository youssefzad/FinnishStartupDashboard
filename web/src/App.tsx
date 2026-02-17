import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import ExploreData from './components/ExploreData'
import Publications from './components/Publications'
import DataUpdater from './components/DataUpdater'
import ChartEmbedPage from './components/ChartEmbedPage'
import EmbedHelp from './components/EmbedHelp'
import FSCDebugBadge from './components/FSCDebugBadge'
import './App.css'
import './styles/fsc-theme.css'

// Feature flag: Set to true to enable FSC header/hero dimensions
const USE_FSC_HEADER_HERO = true

function AppContent() {
  const location = useLocation()
  const isEmbed = location.pathname.startsWith('/embed')
  
  // Apply FSC header/hero body class globally when flag is enabled (but not for embeds)
  useEffect(() => {
    if (USE_FSC_HEADER_HERO && !isEmbed) {
      document.body.classList.add('use-fsc-header-hero')
    } else {
      document.body.classList.remove('use-fsc-header-hero')
    }
    
    // Cleanup on unmount
    return () => {
      if (!USE_FSC_HEADER_HERO || isEmbed) {
        document.body.classList.remove('use-fsc-header-hero')
      }
    }
  }, [isEmbed])

  // Check for debug mode
  const showDebug = new URLSearchParams(location.search).get('fscDebug') === '1'

  return (
    <>
      {!isEmbed && <Navigation />}
      {showDebug && <FSCDebugBadge />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExploreData />} />
        <Route path="/publications" element={<Publications />} />
        <Route path="/update-data" element={<DataUpdater />} />
        <Route path="/embed/:chartId" element={<ChartEmbedPage />} />
        <Route path="/embed-help" element={<EmbedHelp />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}

export default App

