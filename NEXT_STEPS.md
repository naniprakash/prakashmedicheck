# ✅ PostgreSQL Connected! Final Deployment Steps

## 🎉 What's Done:
- ✅ Code pushed to GitHub: https://github.com/naniprakash/prakashmedicheck
- ✅ PostgreSQL support added to backend
- ✅ Database automatically switches between SQLite (local) and PostgreSQL (production)

## 🚀 Next: Deploy to Render

### Step 1: Deploy Backend on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - If not signed up, click "Get Started" and sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already
   - Select repository: `prakashmedicheck`
   - Click "Connect"

3. **Configure Backend Service**
   Fill in these exact settings:
   
   - **Name**: `medicine-tracker-api`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`

4. **Add Environment Variable (IMPORTANT!)**
   - Scroll down to "Environment Variables"
   - Click "Add Environment Variable"
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string from Render
     (It should look like: `postgres://user:password@host/database`)
   - Click "Add"

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Watch the logs for any errors
   - Once you see "Running on http://0.0.0.0:10000", it's live!

6. **Copy Your Backend URL**
   - At the top of the page, you'll see your service URL
   - Example: `https://medicine-tracker-api-xxxx.onrender.com`
   - **COPY THIS URL!**

### Step 2: Update Frontend API URL

Once you have your Render backend URL, tell me and I'll update the frontend for you!

Or you can do it manually:
1. Edit `src/utils/api.js`
2. Change line 1:
   ```javascript
   const API_BASE_URL = 'https://YOUR_RENDER_URL/api';
   ```
3. Save and run:
   ```powershell
   git add src/utils/api.js
   git commit -m "Update API URL for production"
   git push
   ```

### Step 3: Deploy Frontend on Vercel

```powershell
# Install Vercel CLI (if not already)
npm install -g vercel

# Login
vercel login

# Deploy
cd C:\Users\HP\.gemini\antigravity\scratch\medicine-tracker
vercel --prod
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Your account
- **Link to existing project**: No
- **Project name**: medicine-tracker (or press Enter)
- **Directory**: ./ (press Enter)
- **Override settings**: No

Wait 1-2 minutes and you'll get your live URL!

### Step 4: Update Backend CORS

After getting your Vercel URL:

1. Edit `backend/app.py`
2. Find the CORS line (around line 10) and update:
   ```python
   CORS(app, origins=[
       "https://YOUR_VERCEL_URL.vercel.app",
       "http://localhost:5173"
   ])
   ```
3. Push to GitHub:
   ```powershell
   git add backend/app.py
   git commit -m "Update CORS for Vercel"
   git push
   ```

Render will automatically redeploy!

## 🎉 You're Live!

Your app will be accessible at:
- **Frontend (Share this!)**: `https://medicine-tracker-xxxx.vercel.app`
- **Backend API**: `https://medicine-tracker-api-xxxx.onrender.com`

## ⚠️ Important Notes

### Render Free Tier
- **Cold starts**: Service sleeps after 15 min of inactivity
- **First request**: Takes 30-60 seconds to wake up
- **750 hours/month**: Free tier limit

### PostgreSQL Database
- **Persistent**: Your data is now saved permanently!
- **Free tier**: 1GB storage, 97 hours/month
- **Automatic backups**: Render handles this

### Making Updates
Just push to GitHub and both platforms auto-deploy:
```powershell
git add .
git commit -m "Your changes"
git push
```

## 🐛 Troubleshooting

**Backend won't start?**
- Check Render logs in dashboard
- Verify DATABASE_URL is set correctly
- Ensure PostgreSQL is running

**Frontend can't connect?**
- Check API_BASE_URL in `src/utils/api.js`
- Verify CORS settings in backend
- Check browser console for errors

**Database errors?**
- Verify DATABASE_URL format
- Check PostgreSQL connection in Render dashboard

---

**Ready?** Start with Step 1 and let me know your Render backend URL when it's deployed!
