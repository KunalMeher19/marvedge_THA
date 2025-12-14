# 🚀 Complete Deployment Guide - MarvEdge MVP

Deploy your screen recording app to production using **100% FREE** services!

**Total cost: $0/month** ✨

---

## Prerequisites

- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)
- Cloudflare account (free)

**Total setup time: ~30 minutes**

---

## Step 1: MongoDB Atlas Setup (Database) - 10 min

### 1.1 Create Account & Cluster

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free (use Google/GitHub for faster signup)
3. Click **"Build a Database"**
4. Select **M0 FREE** tier
   - Provider: AWS
   - Region: Choose closest to your users
   - Cluster Name: `marvedge-cluster` (or any name)
5. Click **"Create"**

### 1.2 Configure Network Access

1. In Atlas dashboard, go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (or add `0.0.0.0/0`)
   - This allows Vercel to connect
4. Click **"Confirm"**

### 1.3 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication: **Password**
   - Username: `marvedge_user` (or your choice)
   - Password: Click **"Autogenerate Secure Password"** and **COPY IT**
4. Database User Privileges: **Read and write to any database**
5. Click **"Add User"**

### 1.4 Get Connection String

1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Driver: **Node.js** | Version: **5.5 or later**
4. Copy the connection string:
   ```
   mongodb+srv://marvedge_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `/marvedge_mvp` before the `?`
   
   Final format:
   ```
   mongodb+srv://marvedge_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/marvedge_mvp?retryWrites=true&w=majority
   ```

**Save this! You'll need it for Vercel.**

---

## Step 2: Cloudflare R2 Setup (Video Storage) - 15 min

### 2.1 Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for free
3. Verify your email

### 2.2 Create R2 Bucket

1. In Cloudflare dashboard, click **R2** in the left sidebar
2. Click **"Create bucket"**
3. Bucket name: `marvedge-videos` (lowercase, no spaces)
4. Location: **Automatic** (recommended)
5. Click **"Create bucket"**

### 2.3 Enable Public Access

1. In your bucket settings, go to **Settings** tab
2. Scroll to **Public access**
3. Click **"Allow Access"**
4. Copy the **Public Bucket URL** (looks like `https://pub-xxxxxxxx.r2.dev`)
5. **Save this URL** - you'll need it as `R2_PUBLIC_URL`

### 2.4 Create API Token

1. In R2 overview, click **"Manage R2 API Tokens"** (top right)
2. Click **"Create API Token"**
3. Token name: `marvedge-api-token`
4. Permissions:
   - **Object Read & Write** (both checked)
   - Apply to specific buckets only: Select `marvedge-videos`
5. Click **"Create API Token"**
6. **IMPORTANT**: Copy these 3 values NOW (you won't see them again):
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
   - **Endpoint** (looks like `https://xxxx.r2.cloudflarestorage.com`) → `R2_ENDPOINT`

**Save all 3 values!**

### 2.5 Configure CORS (CRITICAL for Video Playback)

1. In your bucket settings, stay on the **Settings** tab
2. Scroll down to **CORS Policy**
3. Click **Add CORS Policy** or **Edit**
4. Paste this configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Accept-Ranges",
      "Content-Range"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click **Save**

> [!IMPORTANT]
> **Without CORS configuration**, videos won't play on your site! This allows your Vercel deployment to load videos from R2.

> [!TIP]
> For production, replace `"*"` with your actual Vercel domain (e.g., `"https://your-app.vercel.app"`) for better security.

---

## Step 3: Vercel Deployment - 5 min

### 3.1 Push to GitHub

If you haven't already:

```bash
git add .
git commit -m "Configure R2 and MongoDB for production"
git push origin main
```

### 3.2 Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your `marvedge_THA` repository
5. Click **"Import"**

### 3.3 Configure Environment Variables

In the **"Configure Project"** screen:

1. Click **"Environment Variables"**
2. Add the following variables one by one:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your MongoDB connection string from Step 1.4 |
| `R2_ENDPOINT` | Your R2 endpoint from Step 2.4 |
| `R2_ACCESS_KEY_ID` | Your R2 access key from Step 2.4 |
| `R2_SECRET_ACCESS_KEY` | Your R2 secret key from Step 2.4 |
| `R2_BUCKET_NAME` | `marvedge-videos` (or your bucket name) |
| `R2_PUBLIC_URL` | Your public bucket URL from Step 2.3 |
| `NODE_ENV` | `production` |

3. Click **"Deploy"**

### 3.4 Wait for Deployment

- Vercel will build and deploy your app (~2 minutes)
- Once complete, you'll get a live URL like `https://marvedge-tha.vercel.app`

---

## Step 4: Verify Deployment

1. Open your Vercel URL
2. Test the recording flow:
   - Click "Start Recording"
   - Record a short video
   - Stop recording
   - Trim video (optional)
   - Click "Save Video"
3. Check if video uploads successfully
4. Copy share link and test viewing

### Verify R2 Upload

1. Go to Cloudflare R2 dashboard
2. Open your `marvedge-videos` bucket
3. You should see your uploaded video file

### Verify MongoDB

1. Go to MongoDB Atlas
2. Click **Browse Collections**
3. You should see `marvedge_mvp` database with a `videos` collection

---

## 🎉 You're Live!

Your screen recording app is now deployed and running on:
- **Vercel** (hosting)
- **Cloudflare R2** (video storage)
- **MongoDB Atlas** (database)

**Cost: $0/month** 🚀

---

## 📊 Monitor Usage

### Cloudflare R2

- Dashboard: https://dash.cloudflare.com → R2
- Check: Storage used, operations count
- Free tier: 10 GB storage, 1M writes, 10M reads

### MongoDB Atlas

- Dashboard: https://cloud.mongodb.com
- Check: Database size, connections
- Free tier: 512 MB storage

---

## 🔧 Troubleshooting

### Build fails on Vercel

- Check build logs for errors
- Verify all environment variables are set
- Ensure `NODE_ENV=production`

### Videos not uploading

- Check Vercel function logs
- Verify R2 credentials are correct
- Ensure R2 bucket has public access enabled

### Database connection errors

- Verify MongoDB connection string format
- Check if IP whitelist includes `0.0.0.0/0`
- Ensure database user has read/write permissions

### Video playback issues

- Verify `R2_PUBLIC_URL` is correct
- Check browser console for CORS errors
- Ensure video uploaded successfully to R2

---

## 🔄 Updating Your App

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically rebuild and redeploy!

---

## 📚 Additional Resources

- [Cloudflare R2 Free Tier Details](../cloudflare_costs.md)
- [MongoDB Atlas Free Tier Docs](https://www.mongodb.com/docs/atlas/billing/free-tier/)
- [Vercel Documentation](https://vercel.com/docs)

---

**Need help?** Check the troubleshooting section or review the deployment logs in Vercel.
