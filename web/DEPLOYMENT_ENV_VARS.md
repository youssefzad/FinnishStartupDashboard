# Deployment Environment Variables

## Embed URL Generation

The embed modal automatically generates URLs using the current domain. When deployed to production, it will use your production domain automatically.

### How It Works

1. **Development**: Uses `http://localhost:5173` (expected behavior)
2. **Production**: Automatically uses your production domain (e.g., `https://stats.startupyhteiso.com`)

### Optional: Explicit Production URL

If you want to explicitly set the production URL (useful for CDN or custom domains), set the `VITE_PUBLIC_BASE_URL` environment variable:

```env
VITE_PUBLIC_BASE_URL=https://stats.startupyhteiso.com
```

### Setting Environment Variables

#### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `VITE_PUBLIC_BASE_URL` with your production URL
4. Redeploy

#### Netlify
1. Go to Site settings → Environment variables
2. Add `VITE_PUBLIC_BASE_URL` with your production URL
3. Redeploy

#### Other Platforms
Set `VITE_PUBLIC_BASE_URL` in your deployment platform's environment variable configuration.

### Important Notes

- **Not required**: If `VITE_PUBLIC_BASE_URL` is not set, the code automatically uses `window.location.origin`, which will be correct in production
- **Development**: Localhost URLs are expected and correct when testing locally
- **Production**: The embed URLs will automatically use your production domain when deployed

