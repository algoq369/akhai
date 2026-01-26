# ⚡ Quick Start: Deploy AkhAI on Coolify

**Time:** 15-20 minutes  
**Difficulty:** Easy

---

## 🎯 Quick Steps

### 1. **Get a VPS** (5 min)
- **Recommended:** Hetzner (€4/month) or DigitalOcean ($5/month)
- **Requirements:** Ubuntu 20.04+, 2GB+ RAM, 20GB+ storage

### 2. **Install Coolify** (5 min)
```bash
# SSH into your VPS
ssh root@your-server-ip

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 3. **Access Coolify** (1 min)
- Open: `http://your-server-ip:8000`
- Login with admin credentials (from installation)

### 4. **Deploy AkhAI** (5 min)

**In Coolify UI:**

1. **New Resource** → **Application** → **Dockerfile**

2. **Configure:**
   - **Repository:** `https://github.com/algoq/akhai.git`
   - **Branch:** `main`
   - **Dockerfile Path:** `packages/web/Dockerfile`
   - **Build Context:** `/`

3. **Environment Variables:**
   ```
   ANTHROPIC_API_KEY=your_key_here
   NODE_ENV=production
   ```

4. **Volumes:**
   - **Host:** `/data/akhai`
   - **Container:** `/app/packages/web/data`

5. **Port:** `3000`

6. **Click "Deploy"**

### 5. **Set Up SSL** (2 min)
- **Settings** → **SSL** → **Let's Encrypt**
- Enter your domain
- Done! ✅

---

## ✅ Done!

Your AkhAI app is now live at:
- `https://your-domain.com`

---

## 🔧 Need Help?

See full guide: `COOLIFY_DEPLOYMENT.md`






