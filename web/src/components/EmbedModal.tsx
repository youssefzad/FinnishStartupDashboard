import { useState, useEffect } from 'react'
import type { ChartId } from '../config/chartRegistry'
import './EmbedModal.css'

interface EmbedModalProps {
  chartId: ChartId
  currentFilter?: string
  currentView?: string
  onClose: () => void
}

export default function EmbedModal({ chartId, currentFilter, currentView, onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState<'basic' | 'responsive' | null>(null)
  const [showParams, setShowParams] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Get base URL for embed snippets
  // Priority: 1) VITE_PUBLIC_BASE_URL env var, 2) window.location.origin (auto-detects production)
  const getBaseUrl = () => {
    // Priority 1: Explicit production URL from environment variable (set in production build)
    // Set VITE_PUBLIC_BASE_URL=https://your-production-domain.com in your deployment config
    if (typeof window !== 'undefined' && import.meta.env.VITE_PUBLIC_BASE_URL) {
      return import.meta.env.VITE_PUBLIC_BASE_URL
    }
    
    // Priority 2: Use current window origin (automatically correct in production)
    // - In development: http://localhost:5173 (expected)
    // - In production: https://your-production-domain.com (automatic)
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      // In production, this will be your actual domain (e.g., https://stats.startupyhteiso.com)
      return origin
    }
    
    // Fallback (shouldn't happen in browser)
    return 'https://your-domain.com'
  }
  
  const baseUrl = getBaseUrl()
  const embedPath = `/embed/${chartId}`
  
  // Build query params
  const queryParams = new URLSearchParams()
  if (currentFilter && currentFilter !== 'all') {
    queryParams.set('filter', currentFilter)
  }
  if (currentView && currentView !== 'none') {
    queryParams.set('view', currentView)
  }
  // Don't include theme param - embeds default to dark mode
  // Users can add ?theme=light or ?theme=system if they want to override
  queryParams.set('showTitle', '1')
  queryParams.set('showSource', '1')
  
  const queryString = queryParams.toString()
  const embedUrl = `${baseUrl}${embedPath}${queryString ? `?${queryString}` : ''}`

  // Generate stable iframe ID
  const iframeId = `fsc-chart-${chartId}`

  // Responsive iframe snippet with hardened postMessage listener
  const responsiveSnippet = `<iframe id="${iframeId}" src="${embedUrl}"
     style="width:100%;border:0;"
     height="520"
     loading="lazy"
     title="Finnish Startup Community chart: ${chartId}"></iframe>
<script>
  (function() {
    var iframe = document.getElementById('${iframeId}');
    if (!iframe) return;
    
    var lastHeight = 520;
    var rafId = null;
    
    function setHeight(height) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(function() {
        if (iframe && height !== lastHeight) {
          iframe.style.height = height + 'px';
          lastHeight = height;
        }
      });
    }
    
    window.addEventListener('message', function(event) {
      // Validate message shape
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type !== 'FSC_CHART_HEIGHT') return;
      if (event.data.chartId !== '${chartId}') return;
      
      // Validate height is a finite number
      var height = event.data.height;
      if (typeof height !== 'number' || !isFinite(height)) return;
      
      // Clamp height to sane range (200-3000px)
      height = Math.max(200, Math.min(3000, Math.round(height)));
      
      setHeight(height);
    });
  })();
</script>`

  const copyToClipboard = async (text: string, type: 'basic' | 'responsive') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="embed-modal-overlay" onClick={onClose}>
      <div className="embed-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="embed-modal-header">
          <h2>Embed Chart</h2>
          <button className="embed-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="embed-modal-body">
          <p className="embed-modal-description">
            Copy and paste the code below to embed this chart on your website.
          </p>

          <div className="embed-snippet-section">
            <div className="embed-snippet-container">
              <pre className="embed-snippet-code"><code>{responsiveSnippet}</code></pre>
              <button 
                className={`embed-copy-button ${copied === 'responsive' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(responsiveSnippet, 'responsive')}
              >
                {copied === 'responsive' ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="embed-params-info">
            <button 
              className="embed-params-toggle"
              onClick={() => setShowParams(!showParams)}
            >
              {showParams ? '▼' : '▶'} Available URL Parameters
            </button>
            {showParams && (
              <ul>
                <li><code>theme</code> - <code>light</code>, <code>dark</code>, or <code>system</code></li>
                <li><code>filter</code> - Filter value (e.g., <code>all</code>, <code>early-stage</code>, <code>finland</code>)</li>
                <li><code>view</code> - View mode for bar charts (e.g., <code>male-share</code>, <code>female-share</code>)</li>
                <li><code>showTitle</code> - Show chart title (<code>1</code> or <code>0</code>)</li>
                <li><code>showSource</code> - Show source attribution (<code>1</code> or <code>0</code>)</li>
                <li><code>compact</code> - Reduce padding (<code>1</code> or <code>0</code>)</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

