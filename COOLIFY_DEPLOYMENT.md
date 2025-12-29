# 🚀 Coolify Deployment Guide for AkhAI

**Platform:** Coolify (Open Source, Self-Hosted)  
**Status:** Ready to Deploy

---

## 📋 Prerequisites

1. **VPS/Server** with:
   - Ubuntu 20.04+ or Debian 11+
   - 2GB+ RAM (4GB recommended)
   - 20GB+ storage
   - Root or sudo access

2. **Domain** (optional but recommended)
   - Point DNS to your server IP

---

## 🔧 Step 1: Install Coolify on Your Server

### On Your VPS (SSH into server):

```bash
# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Follow the installation prompts
# It will ask for:
# - Domain (or use IP)
# - Email (for Let's Encrypt SSL)
# - Password (for Coolify admin)
```

**Installation takes 5-10 minutes.**

After installation, you'll get:
- Coolify web UI: `http://your-server-ip:8000`
- Admin credentials (save these!)

---

## 🐳 Step 2: Prepare Your Repository

### Option A: Deploy from Git (Recommended)

1. **Push your code to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Note your repository URL:**
   - Example: `https://github.com/algoq/akhai.git`

### Option B: Deploy from Dockerfile

The `Dockerfile` is already created in `packages/web/Dockerfile`

---

## 🚀 Step 3: Deploy on Coolify

### 3.1 Access Coolify Web UI

1. Open `http://your-server-ip:8000` in browser
2. Login with admin credentials
3. Create a new project (e.g., "AkhAI")

### 3.2 Create New Application

1. Click **"New Resource"** → **"Application"**
2. Choose **"Docker Compose"** or **"Dockerfile"**

### 3.3 Configure Application

**If using Dockerfile:**

1. **Source:**
   - **Type:** Git Repository
   - **Repository URL:** `https://github.com/algoq/akhai.git`
   - **Branch:** `main`
   - **Dockerfile Path:** `packages/web/Dockerfile`
   - **Docker Build Context:** `/` (root)

2. **Port:**
   - **Port:** `3000`
   - **Expose Port:** `3000`

3. **Environment Variables:**
   Add these in Coolify UI:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NODE_ENV=production
   PORT=3000
   ```

4. **Volumes (for SQLite database):**
   - **Host Path:** `/data/akhai`
   - **Container Path:** `/app/packages/web/data`
   - **Type:** Volume

5. **Health Check:**
   - **Path:** `/`
   - **Port:** `3000`

### 3.4 Deploy

1. Click **"Deploy"**
2. Watch the build logs
3. Wait for deployment to complete (5-10 minutes)

---

## 🔒 Step 4: Configure SSL/HTTPS

1. In Coolify, go to your application
2. Click **"Settings"** → **"SSL"**
3. Enable **"Let's Encrypt"**
4. Enter your domain
5. Coolify will automatically:
   - Generate SSL certificate
   - Configure HTTPS
   - Set up auto-renewal

---

## ✅ Step 5: Verify Deployment

1. **Check Application Status:**
   - Should show "Running" in Coolify
   - Health check should be green

2. **Access Your Application:**
   - Via domain: `https://your-domain.com`
   - Or IP: `http://your-server-ip:3000`

3. **Test Functionality:**
   - Open the app in browser
   - Try a test query
   - Verify database is working

---

## 🔧 Configuration Details

### Environment Variables

**Required:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key

**Optional:**
- `NODE_ENV=production` - Production mode
- `PORT=3000` - Application port
- `DATABASE_PATH=/app/packages/web/data/akhai.db` - Database location

### Volumes

**Database Persistence:**
- Mount `/app/packages/web/data` as volume
- This ensures SQLite database persists across restarts

### Ports

- **Internal:** `3000` (Next.js default)
- **External:** Coolify will map automatically

---

## 📊 Monitoring

### View Logs

1. In Coolify, go to your application
2. Click **"Logs"** tab
3. View real-time application logs

### Health Checks

Coolify automatically monitors:
- Application uptime
- Health check endpoint
- Container status

---

## 🔄 Updates & Redeployment

### Automatic Updates (Git)

1. Push changes to your Git repository
2. In Coolify, click **"Redeploy"**
3. Coolify will:
   - Pull latest code
   - Rebuild Docker image
   - Restart application

### Manual Updates

1. In Coolify, go to your application
2. Click **"Redeploy"**
3. Or use **"Force Rebuild"** for clean build

---

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Dockerfile path is correct
- Build context is correct
- Dependencies are installed

**Solution:**
- Check build logs in Coolify
- Verify Dockerfile syntax
- Ensure all files are committed to Git

### Application Won't Start

**Check:**
- Environment variables are set
- Port is correct (3000)
- Database directory is writable

**Solution:**
- Check application logs
- Verify environment variables
- Ensure volume is mounted correctly

### Database Issues

**Check:**
- Volume is mounted correctly
- Database directory exists
- Permissions are correct

**Solution:**
- Verify volume mount in Coolify
- Check file permissions: `chmod 755 /data/akhai`
- Ensure directory exists

### SSL Certificate Issues

**Check:**
- Domain DNS is pointing to server
- Port 80/443 are open
- Email is valid

**Solution:**
- Verify DNS records
- Check firewall settings
- Re-run SSL setup in Coolify

---

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit API keys to Git
   - Use Coolify's environment variable management
   - Rotate keys regularly

2. **Firewall:**
   - Only expose ports 80, 443, and 8000 (Coolify)
   - Close port 3000 from external access
   - Use Coolify's reverse proxy

3. **Updates:**
   - Keep Coolify updated
   - Keep Docker updated
   - Keep application updated

4. **Backups:**
   - Backup database regularly
   - Backup environment variables
   - Backup Coolify configuration

---

## 📝 Quick Reference

### Coolify Commands (via SSH)

```bash
# View Coolify status
docker ps | grep coolify

# View application logs
docker logs <container-name>

# Restart application
# (Use Coolify UI instead)
```

### Application URLs

- **Coolify UI:** `http://your-server-ip:8000`
- **AkhAI App:** `https://your-domain.com` or `http://your-server-ip:3000`

---

## ✅ Deployment Checklist

- [ ] VPS/server ready
- [ ] Coolify installed
- [ ] Git repository pushed
- [ ] Application created in Coolify
- [ ] Environment variables set
- [ ] Volume mounted for database
- [ ] SSL certificate configured
- [ ] Application deployed and running
- [ ] Health check passing
- [ ] Test query successful

---

## 🎉 Success!

Once deployed, your AkhAI application will be:
- ✅ Running on your own server
- ✅ Accessible via HTTPS
- ✅ Auto-updating from Git
- ✅ Monitored by Coolify
- ✅ Ready for beta users!

---

## 📞 Support

**Coolify Documentation:**
- https://coolify.io/docs

**AkhAI Issues:**
- Check application logs in Coolify
- Review deployment configuration
- Verify environment variables

---

*Last Updated: December 25, 2025*






