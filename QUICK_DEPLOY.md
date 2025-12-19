# 🚀 Quick Deployment Commands

## ✅ Step 1: Create GitHub Repository (DO THIS FIRST!)

1. Go to: https://github.com/new
2. Repository name: `medicine-tracker`
3. Make it **Public**
4. **DON'T** check "Initialize with README"
5. Click "Create repository"
6. **Copy the repository URL** (looks like: `https://github.com/YOUR_USERNAME/medicine-tracker.git`)

## ✅ Step 2: Push to GitHub

Run these commands in PowerShell:

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\medicine-tracker

# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/medicine-tracker.git

git branch -M main

git push -u origin main
```

## ✅ Step 3: Deploy Backend on Render

1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your `medicine-tracker` repository
5. Configure:
   - **Name**: `medicine-tracker-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`
6. Click "Create Web Service"
7. **Wait 5-10 minutes** for deployment
8. **Copy your backend URL**: `https://medicine-tracker-api-XXXX.onrender.com`

## ✅ Step 4: Update Frontend API URL

1. Open: `src/utils/api.js`
2. Change line 1 to:
   ```javascript
   const API_BASE_URL = 'https://YOUR_RENDER_BACKEND_URL/api';
   ```
3. Save and commit:
   ```powershell
   git add src/utils/api.js
   git commit -m "Update API URL for production"
   git push
   ```

## ✅ Step 5: Deploy Frontend on Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Follow the prompts and you'll get your live URL!

## 🎉 Your Live App

After completing all steps, your app will be live at:
- **Frontend**: `https://medicine-tracker-XXXX.vercel.app` ← **Share this link!**
- **Backend**: `https://medicine-tracker-api-XXXX.onrender.com`

## ⚠️ Important Notes

- **First load may be slow**: Render free tier spins down after 15 min of inactivity
- **Database**: SQLite won't persist on Render. Consider PostgreSQL for production
- **Updates**: Just `git push` and both platforms auto-deploy!

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions!
