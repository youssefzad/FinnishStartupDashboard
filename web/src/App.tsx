import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import ExploreData from './components/ExploreData'
import Publications from './components/Publications'
import DataUpdater from './components/DataUpdater'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExploreData />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/update-data" element={<DataUpdater />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

