import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import './EmbedHelp.css'

export default function EmbedHelp() {
  return (
    <>
      <Navigation />
      <div className="embed-help-page">
        <div className="embed-help-container">
          <h1>Embedding Charts</h1>
          
          <section>
            <h2>Quick Start</h2>
            <p>Every chart on the <Link to="/explore">Explore page</Link> has an "Embed" button that provides copy-paste code snippets.</p>
            <p>You can embed any chart using an iframe:</p>
            <pre className="code-block"><code>{`<iframe src="https://your-domain.com/embed/economic-impact-revenue"
     style="width:100%;border:0;"
     height="520"
     loading="lazy"></iframe>`}</code></pre>
          </section>

          <section>
            <h2>Available Charts</h2>
            <ul className="chart-list">
              <li><code>economic-impact-revenue</code> - Startup Revenue</li>
              <li><code>economic-impact-employees</code> - Number of Employees</li>
              <li><code>economic-impact-firms</code> - Active firms</li>
              <li><code>economic-impact-rdi</code> - R&D investments</li>
              <li><code>workforce-gender</code> - Gender distribution</li>
              <li><code>workforce-immigration</code> - Foreign background workers</li>
              <li><code>barometer-financial</code> - Financial situation</li>
              <li><code>barometer-employees</code> - Number of employees (barometer)</li>
              <li><code>barometer-economy</code> - Surrounding economy</li>
            </ul>
          </section>

          <section>
            <h2>URL Parameters</h2>
            <table className="params-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Values</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>theme</code></td>
                  <td><code>light</code>, <code>dark</code>, <code>system</code></td>
                  <td>Chart theme (default: <code>system</code>)</td>
                </tr>
                <tr>
                  <td><code>filter</code></td>
                  <td>Chart-specific</td>
                  <td>Filter value (e.g., <code>all</code>, <code>early-stage</code>, <code>finland</code>)</td>
                </tr>
                <tr>
                  <td><code>view</code></td>
                  <td><code>none</code>, <code>male-share</code>, <code>female-share</code>, etc.</td>
                  <td>View mode for bar charts (default: <code>none</code>)</td>
                </tr>
                <tr>
                  <td><code>showTitle</code></td>
                  <td><code>1</code> or <code>0</code></td>
                  <td>Show chart title (default: <code>1</code>)</td>
                </tr>
                <tr>
                  <td><code>showSource</code></td>
                  <td><code>1</code> or <code>0</code></td>
                  <td>Show source attribution (default: <code>1</code>)</td>
                </tr>
                <tr>
                  <td><code>compact</code></td>
                  <td><code>1</code> or <code>0</code></td>
                  <td>Reduce padding (default: <code>0</code>)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>Responsive Height</h2>
            <p>For automatic height adjustment, use the responsive iframe snippet with postMessage listener:</p>
            <pre className="code-block"><code>{`<iframe id="my-chart" src="https://your-domain.com/embed/economic-impact-revenue"
     style="width:100%;border:0;" height="520" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FSC_CHART_HEIGHT') {
      document.getElementById('my-chart').style.height = event.data.height + 'px';
    }
  });
</script>`}</code></pre>
          </section>

          <section>
            <h2>WordPress Example</h2>
            <p>In WordPress, add this to a Custom HTML block:</p>
            <pre className="code-block"><code>{`<iframe src="https://your-domain.com/embed/economic-impact-revenue?theme=light&filter=all"
     style="width:100%;border:0;" height="520" loading="lazy"></iframe>`}</code></pre>
          </section>

          <section>
            <h2>Privacy & Analytics</h2>
            <p>Embedded charts:</p>
            <ul>
              <li>Do not use cookies</li>
              <li>Do not track users</li>
              <li>Do not collect analytics</li>
              <li>Load data from static JSON files</li>
            </ul>
            <p>The embed iframe communicates height updates via postMessage, but no other data is shared.</p>
          </section>

          <section>
            <h2>Examples</h2>
            <div className="example-grid">
              <div className="example-item">
                <h3>Revenue Chart (All)</h3>
                <pre className="code-example"><code>{`/embed/economic-impact-revenue?filter=all`}</code></pre>
              </div>
              <div className="example-item">
                <h3>Revenue Chart (Early Stage)</h3>
                <pre className="code-example"><code>{`/embed/economic-impact-revenue?filter=early-stage`}</code></pre>
              </div>
              <div className="example-item">
                <h3>Gender Chart (Share View)</h3>
                <pre className="code-example"><code>{`/embed/workforce-gender?view=female-share`}</code></pre>
              </div>
              <div className="example-item">
                <h3>Barometer (Light Theme)</h3>
                <pre className="code-example"><code>{`/embed/barometer-financial?theme=light`}</code></pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

