# How to Push This Project to GitHub

## Step 1: Install Git (if not already installed)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer and follow the setup wizard
3. Restart your terminal/PowerShell after installation

## Step 2: Verify Git Installation

Open PowerShell and run:
```powershell
git --version
```

If it shows a version number, Git is installed correctly.

## Step 3: Configure Git (First time only)

Set your name and email (replace with your GitHub credentials):
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Initialize Git Repository

Navigate to your project folder and initialize Git:
```powershell
cd "C:\Users\youssef\OneDrive\Desktop\CURSOR\Statistical-website-fsc"
git init
```

## Step 5: Add All Files to Git

```powershell
git add .
```

## Step 6: Create Initial Commit

```powershell
git commit -m "Initial commit: Statistical website for FSC"
```

## Step 7: Create a GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "statistical-website-fsc")
5. Choose public or private
6. **DO NOT** initialize with README, .gitignore, or license (we already have files)
7. Click "Create repository"

## Step 8: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 9: Enter GitHub Credentials

When you push, you'll be prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)

### How to Create a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "My Project")
4. Select scopes: check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)
7. Use this token as your password when pushing

## Alternative: Using GitHub Desktop

If you prefer a GUI:
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. File → Add Local Repository
4. Select your project folder
5. Click "Publish repository" button

## Future Updates

After making changes to your code:

```powershell
git add .
git commit -m "Description of your changes"
git push
```

## Important Notes

- The `.gitignore` file has been created to exclude:
  - `node_modules/` (dependencies)
  - `dist/` (build files)
  - `.env` files (sensitive data)
  - Other temporary files

- **Never commit sensitive data** like:
  - API keys
  - Passwords
  - `.env` files with secrets
  - Personal information

- If you have sensitive data in your Google Sheets setup, consider:
  - Using environment variables
  - Adding `.env` to `.gitignore` (already done)
  - Creating a `.env.example` file with placeholder values

