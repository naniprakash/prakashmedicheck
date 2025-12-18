# 🚀 Step-by-Step Deployment Guide

## ✅ Prerequisites Completed
- [x] Git initialized
- [x] Backend ready with Procfile
- [x] Requirements.txt updated with gunicorn

## 📋 Deployment Steps

### Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Repository name: `medicine-tracker`
   - Make it Public or Private
   - DON'T initialize with README (we already have code)
   - Click "Create repository"

2. **Add all files to git**
   ```bash
   git add .
   git commit -m "Initial commit - Medicine Tracker App"
   ```

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/medicine-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend on Render

1. **Go to Render**
   - Visit https://render.com
   - Click "Get Started" and sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Click "Connect account" to link GitHub
   - Select your `medicine-tracker` repository
   - Click "Connect"

3. **Configure Backend**
   - **Name**: `medicine-tracker-api`
   - **Region**: Choose closest to you
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: Free

4. **Add Environment Variables** (Optional)
   - Click "Advanced"
   - Add any env vars if needed

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Copy your backend URL: `https://medicine-tracker-api.onrender.com`

### Step 3: Update Frontend API URL

1. **Edit src/utils/api.js**
   - Change line 1:
   ```javascript
   const API_BASE_URL = 'https://medicine-tracker-api.onrender.com/api';
   ```

2. **Commit the change**
   ```bash
   git add src/utils/api.js
   git commit -m "Update API URL for production"
   git push
   ```

### Step 4: Deploy Frontend on Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```
   - Follow the prompts to authenticate

3. **Deploy**
   ```bash
   vercel
   ```
   - Select your project
   - Follow prompts (accept defaults)
   - Wait for deployment

4. **Get Your Live URL**
   - Vercel will show: `https://medicine-tracker-xyz.vercel.app`
   - **This is your live app link!** 🎉

### Step 5: Update Backend CORS

1. **Edit backend/app.py**
   - Update CORS to allow your Vercel domain:
   ```python
   CORS(app, origins=[
       "https://medicine-tracker-xyz.vercel.app",  # Your Vercel URL
       "http://localhost:5173"  # For local development
   ])
   ```

2. **Push changes**
   ```bash
   git add backend/app.py
   git commit -m "Update CORS for production"
   git push
   ```
   - Render will auto-deploy the update

## 🎉 You're Live!

Your app is now deployed at:
- **Frontend**: `https://medicine-tracker-xyz.vercel.app`
- **Backend**: `https://medicine-tracker-api.onrender.com`

Share the frontend URL with anyone!

## ⚠️ Important Notes

### Free Tier Limitations

**Render (Backend)**:
- Spins down after 15 min of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

**Vercel (Frontend)**:
- 100GB bandwidth/month
- Unlimited deployments
- Always fast (no sleep)

### Database Persistence

SQLite won't persist on Render free tier. For production:
1. Go to Render Dashboard
2. Create PostgreSQL database (free tier available)
3. Update backend to use PostgreSQL instead of SQLite

## 🔄 Making Updates

After deployment, to update your app:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push

# Render auto-deploys backend
# For frontend, run:
vercel --prod
```

## 🐛 Troubleshooting

**Backend not responding?**
- Check Render logs in dashboard
- Verify build completed successfully
- Check CORS settings

**Frontend can't connect to backend?**
- Verify API_BASE_URL in api.js
- Check browser console for errors
- Ensure backend is running (visit backend URL)

**Database errors?**
- SQLite doesn't persist on Render
- Use PostgreSQL for production

## 📞 Need Help?

Check the Render and Vercel documentation:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
