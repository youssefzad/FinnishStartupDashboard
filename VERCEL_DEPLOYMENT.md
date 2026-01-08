# Deploying to Vercel

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login**: Use your GitHub account to sign in
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `youssefzad/FinnishStartupDashboard`
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `web` (IMPORTANT: Set this to `web`)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist` (or leave default)
   - **Install Command**: `npm install` (or leave default)

5. **Environment Variables** (if needed):
   - If you have `.env` variables for Google Sheets:
     - Go to "Environment Variables" section
     - Add each variable:
       - `VITE_GOOGLE_SHEET_ID`
       - `VITE_EMPLOYEES_GENDER_GID`
       - `VITE_RDI_GID`
     - Add them for Production, Preview, and Development

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Your site will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```powershell
   vercel login
   ```

3. **Navigate to web directory**:
   ```powershell
   cd web
   ```

4. **Deploy**:
   ```powershell
   vercel
   ```
   - Follow the prompts
   - For production deployment: `vercel --prod`

## Important Configuration

Since your project is in the `web` subdirectory, make sure to:

1. **Set Root Directory to `web`** in Vercel dashboard settings
2. **Or** use the `vercel.json` file I created (it should handle this automatically)

## Environment Variables

If your project uses Google Sheets API, add these in Vercel dashboard:
- `VITE_GOOGLE_SHEET_ID`
- `VITE_EMPLOYEES_GENDER_GID`
- `VITE_RDI_GID`

**Note**: Vite requires the `VITE_` prefix for environment variables to be accessible in the browser.

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches or pull requests

## Troubleshooting

### Build Fails
- Check that Root Directory is set to `web`
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Routes Not Working
- The `vercel.json` includes a rewrite rule for React Router
- All routes should redirect to `index.html` for client-side routing

### Environment Variables Not Working
- Make sure they start with `VITE_` prefix
- Redeploy after adding new variables
- Check that they're added for the correct environment (Production/Preview/Development)

## Updating Your Site

After pushing changes to GitHub:
- Vercel will automatically detect the push
- It will create a new deployment
- Production deployments happen automatically for `main` branch

