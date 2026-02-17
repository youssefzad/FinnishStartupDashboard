# Testing Chart Embeds

## Quick Test URLs

### Basic Tests
- **Revenue chart (all)**: `http://localhost:5173/embed/economic-impact-revenue`
- **Revenue chart (early stage)**: `http://localhost:5173/embed/economic-impact-revenue?filter=early-stage`
- **Revenue chart (no title)**: `http://localhost:5173/embed/economic-impact-revenue?showTitle=0`
- **Revenue chart (light theme)**: `http://localhost:5173/embed/economic-impact-revenue?theme=light`
- **Revenue chart (compact)**: `http://localhost:5173/embed/economic-impact-revenue?compact=1`

### All Chart Types
- Revenue: `/embed/economic-impact-revenue`
- Employees: `/embed/economic-impact-employees`
- Firms: `/embed/economic-impact-firms`
- R&D: `/embed/economic-impact-rdi`
- Gender: `/embed/workforce-gender`
- Immigration: `/embed/workforce-immigration`
- Barometer Financial: `/embed/barometer-financial`
- Barometer Employees: `/embed/barometer-employees`
- Barometer Economy: `/embed/barometer-economy`

### Test Different Parameters
- **Filter**: `?filter=early-stage` or `?filter=finland`
- **View (for bar charts)**: `?view=female-share` or `?view=male-share`
- **Theme**: `?theme=light` or `?theme=dark` or `?theme=system`
- **Title**: `?showTitle=0` (hide) or `?showTitle=1` (show, default)
- **Source**: `?showSource=0` (hide) or `?showSource=1` (show, default)
- **Compact**: `?compact=1` (reduced padding)

## Method 1: Using embed-test.html

1. Start your dev server:
   ```bash
   cd web
   npm run dev
   ```

2. Open in browser:
   ```
   http://localhost:5173/embed-test.html
   ```

3. This page shows 3 embedded charts with responsive iframe resizing.

## Method 2: Test in a Simple HTML File

Create a test file `test-embed.html` in your project root:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chart Embed Test</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    .chart-container { margin: 2rem 0; border: 1px solid #ddd; padding: 1rem; }
  </style>
</head>
<body>
  <h1>Chart Embed Test</h1>
  
  <div class="chart-container">
    <h2>Revenue Chart</h2>
    <iframe id="chart1" 
            src="http://localhost:5173/embed/economic-impact-revenue?theme=light"
            style="width:100%;border:0;" 
            height="520" 
            loading="lazy"
            title="Finnish Startup Community chart: economic-impact-revenue"></iframe>
  </div>

  <div class="chart-container">
    <h2>Revenue Chart (Early Stage)</h2>
    <iframe id="chart2" 
            src="http://localhost:5173/embed/economic-impact-revenue?filter=early-stage&theme=light"
            style="width:100%;border:0;" 
            height="520" 
            loading="lazy"
            title="Finnish Startup Community chart: economic-impact-revenue"></iframe>
  </div>

  <script>
    // Responsive height listener
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'FSC_CHART_HEIGHT') {
        const iframe = document.getElementById('chart' + (event.data.chartId === 'economic-impact-revenue' ? '1' : '2'));
        if (iframe && typeof event.data.height === 'number' && isFinite(event.data.height)) {
          const height = Math.max(200, Math.min(3000, Math.round(event.data.height)));
          iframe.style.height = height + 'px';
        }
      }
    });
  </script>
</body>
</html>
```

Open this file in your browser (file:// protocol works).

## Method 3: Test PostMessage Resizing

1. Open `embed-test.html` in browser
2. Open browser DevTools Console
3. Watch for postMessage events:
   ```javascript
   window.addEventListener('message', (e) => {
     if (e.data.type === 'FSC_CHART_HEIGHT') {
       console.log('Height update:', e.data);
     }
   });
   ```
4. Change filter in one of the charts (if applicable)
5. Verify iframe height updates automatically

## Method 4: Test in Production Build

1. Build the project:
   ```bash
   cd web
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Test embed URLs:
   ```
   http://localhost:4173/embed/economic-impact-revenue
   ```

## Method 5: Test Different Scenarios

### Test showTitle=0
```
http://localhost:5173/embed/economic-impact-revenue?showTitle=0
```
Expected: No title shown, chart starts immediately

### Test Filters
```
http://localhost:5173/embed/economic-impact-revenue?filter=early-stage
http://localhost:5173/embed/economic-impact-revenue?filter=later-stage
http://localhost:5173/embed/economic-impact-employees?filter=finland
```
Expected: Chart data changes based on filter

### Test View Modes (Bar Charts)
```
http://localhost:5173/embed/workforce-gender?view=female-share
http://localhost:5173/embed/workforce-gender?view=male-share
http://localhost:5173/embed/workforce-immigration?view=foreign-share
```
Expected: Chart switches to share view

### Test Theme
```
http://localhost:5173/embed/economic-impact-revenue?theme=light
http://localhost:5173/embed/economic-impact-revenue?theme=dark
```
Expected: Chart colors change based on theme

### Test Compact Mode
```
http://localhost:5173/embed/economic-impact-revenue?compact=1
```
Expected: Reduced padding around chart

## Method 6: Test Invalid Chart ID

```
http://localhost:5173/embed/invalid-chart-id
```
Expected: Shows error page with list of valid chart IDs and "Copy URL" buttons

## Checklist

- [ ] Chart renders full width (no empty right area)
- [ ] Filter buttons visible and functional (above chart in embed mode)
- [ ] Title shows/hides based on `showTitle` parameter
- [ ] Source attribution shows/hides based on `showSource` parameter
- [ ] Theme changes work (`theme=light`, `theme=dark`)
- [ ] Filters work (`filter=early-stage`, etc.)
- [ ] View modes work for bar charts (`view=female-share`, etc.)
- [ ] PostMessage resizing works (iframe height updates automatically)
- [ ] Invalid chartId shows helpful error page
- [ ] All 9 chart IDs work correctly

## Debugging Tips

1. **Check console for errors**: Open DevTools → Console
2. **Inspect iframe**: Right-click on chart → Inspect
3. **Check postMessage**: Monitor Network tab → WS (WebSocket) or use console listener
4. **Verify CSS loaded**: Check if `.embed` classes are applied in Elements tab
5. **Test height updates**: Resize browser window and watch iframe height change

## Quick Test Script

Save this as `quick-test.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quick Embed Test</title>
  <style>
    body { padding: 20px; font-family: sans-serif; }
    iframe { width: 100%; border: 2px solid #ccc; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Quick Embed Tests</h1>
  
  <h2>1. Full Width Test</h2>
  <iframe id="test1" src="http://localhost:5173/embed/economic-impact-revenue" 
          height="520" style="border:0;"></iframe>
  
  <h2>2. No Title Test</h2>
  <iframe id="test2" src="http://localhost:5173/embed/economic-impact-revenue?showTitle=0" 
          height="520" style="border:0;"></iframe>
  
  <h2>3. Filter Test</h2>
  <iframe id="test3" src="http://localhost:5173/embed/economic-impact-revenue?filter=early-stage" 
          height="520" style="border:0;"></iframe>
  
  <script>
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'FSC_CHART_HEIGHT') {
        const id = 'test' + (e.data.chartId === 'economic-impact-revenue' ? '1' : 
                            e.data.chartId === 'economic-impact-revenue' ? '2' : '3');
        const iframe = document.getElementById(id);
        if (iframe && typeof e.data.height === 'number') {
          iframe.style.height = Math.max(200, Math.min(3000, e.data.height)) + 'px';
        }
      }
    });
  </script>
</body>
</html>
```

