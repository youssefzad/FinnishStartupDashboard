import { useState } from 'react'
import { updateDataFromGoogleSheets } from '../utils/dataUpdater'
import './DataUpdater.css'

const DataUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('startupData')
      if (stored) {
        const data = JSON.parse(stored)
        return data.lastUpdated || null
      }
    } catch (error) {
      // Ignore
    }
    return null
  })

  const handleUpdate = async () => {
    setIsUpdating(true)
    setMessage(null)

    try {
      const result = await updateDataFromGoogleSheets()
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setLastUpdated(new Date().toISOString())
        // Reload page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update data' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="data-updater">
      <div className="updater-card">
        <h3 className="updater-title">Data Updater</h3>
        <p className="updater-description">
          Update website data from Google Sheets. This will download the latest data and save it locally for fast loading.
        </p>
        
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}

        <button 
          className="updater-button" 
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Data from Google Sheets'}
        </button>

        {message && (
          <div className={`updater-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="updater-info">
          <p><strong>How to update website data:</strong></p>
          <ol>
            <li>Click "Update Data from Google Sheets" above</li>
            <li>Two JSON files will be downloaded: <code>main-data.json</code> and <code>employees-gender-data.json</code></li>
            <li>Copy these files to <code>public/data/</code> folder in your project</li>
            <li>Restart your dev server (or rebuild) for changes to take effect</li>
          </ol>
          <p className="updater-note">
            <strong>Note:</strong> The website loads data from <code>public/data/</code> JSON files. 
            Google Sheets is only used as a backup source for you to update these files.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DataUpdater

