# 🌐 Ngrok Quick Setup Guide

## Step 1: Download Ngrok

1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the `ngrok.exe` file to a folder (e.g., `C:\ngrok\`)

## Step 2: Sign Up and Get Auth Token

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Copy your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

## Step 3: Authenticate Ngrok

Open PowerShell and run:
```powershell
cd C:\ngrok  # Or wherever you extracted ngrok.exe
.\ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

## Step 4: Expose Your Backend (Port 5000)

In a new PowerShell window:
```powershell
cd C:\ngrok
.\ngrok http 5000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5000
```

**Copy this URL!** This is your backend URL.

## Step 5: Update Frontend API URL

1. Open `src/utils/api.js`
2. Change line 1 to:
   ```javascript
   const API_BASE_URL = 'https://YOUR_NGROK_BACKEND_URL/api';
   ```
   (Replace with the URL from Step 4)

## Step 6: Expose Your Frontend (Port 5173)

In another new PowerShell window:
```powershell
cd C:\ngrok
.\ngrok http 5173
```

You'll see:
```
Forwarding   https://xyz789.ngrok-free.app -> http://localhost:5173
```

**This is your shareable link!** 🎉

## Step 7: Update Backend CORS

The backend needs to allow requests from your ngrok frontend URL.

In `backend/app.py`, change the CORS line to:
```python
CORS(app, origins=["*"])  # Allow all origins for ngrok
```

Then restart the backend server.

## 🎉 You're Done!

Share the **frontend ngrok URL** with anyone:
- Example: `https://xyz789.ngrok-free.app`

They can access your medicine tracker app from anywhere!

## ⚠️ Important Notes

- **Free tier limits**: 
  - URLs expire when you close ngrok
  - Random URLs each time (upgrade for custom domains)
  - 40 connections/minute limit
  
- **Keep terminals open**: Don't close the ngrok windows while sharing

- **Restart needed**: If you restart ngrok, you'll get new URLs and need to update the frontend API URL again

## 🔄 Quick Restart Process

If you need to restart:

1. Stop both ngrok processes (Ctrl+C)
2. Start backend ngrok: `.\ngrok http 5000`
3. Copy new backend URL
4. Update `src/utils/api.js` with new URL
5. Start frontend ngrok: `.\ngrok http 5173`
6. Share new frontend URL

## 💡 Pro Tip

For easier management, you can run both in one command:
```powershell
.\ngrok http 5000 --log=stdout > backend.log &
.\ngrok http 5173
```

---

**Need help?** Let me know if you encounter any issues!
