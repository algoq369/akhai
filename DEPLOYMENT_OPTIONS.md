# 🌐 AkhAI Deployment Options - Open Source & Free Alternatives

**Goal:** Deploy without requiring user accounts (self-hosted or open platforms)

---

## 🏆 Top Recommendations

### 1. **Coolify** ⭐ **BEST FOR SELF-HOSTING**

**Type:** Open Source, Self-Hostable PaaS  
**License:** MIT  
**Account Required:** No (self-hosted)

**Pros:**
- ✅ **100% Open Source** - Full control
- ✅ **No Account Required** - Self-hosted
- ✅ **Docker-based** - Easy deployment
- ✅ **One-Click Deploy** - Simple setup
- ✅ **Free Forever** - No vendor lock-in
- ✅ **Supports Next.js** - Native support
- ✅ **Database Support** - Can run PostgreSQL
- ✅ **SSL/HTTPS** - Automatic via Let's Encrypt
- ✅ **Git Integration** - Auto-deploy from repo

**Cons:**
- ⚠️ Requires VPS/server (DigitalOcean, Hetzner, etc.)
- ⚠️ Need to manage server yourself
- ⚠️ Initial setup complexity

**Setup:**
```bash
# On your VPS (Ubuntu/Debian)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Then deploy via web UI or CLI
```

**Cost:** 
- **Platform:** Free (open source)
- **Server:** $5-10/month (VPS)

**Best For:** Users who want full control and no vendor lock-in

---

### 2. **CapRover** ⭐ **EASIEST SELF-HOSTING**

**Type:** Open Source, Self-Hostable PaaS  
**License:** Apache 2.0  
**Account Required:** No (self-hosted)

**Pros:**
- ✅ **Open Source** - MIT licensed
- ✅ **No Account Required** - Self-hosted
- ✅ **Docker-based** - Containerized apps
- ✅ **One-Click Apps** - Pre-configured templates
- ✅ **Free Forever** - No limits
- ✅ **SSL/HTTPS** - Automatic certificates
- ✅ **Git Integration** - Auto-deploy
- ✅ **Web UI** - Easy management

**Cons:**
- ⚠️ Requires VPS/server
- ⚠️ Need Docker knowledge
- ⚠️ Server management required

**Setup:**
```bash
# On your VPS
docker run -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock caprover/caprover
```

**Cost:**
- **Platform:** Free (open source)
- **Server:** $5-10/month (VPS)

**Best For:** Users comfortable with Docker and server management

---

### 3. **Render** ⭐ **BEST MANAGED ALTERNATIVE**

**Type:** Managed Platform  
**License:** Proprietary (but free tier)  
**Account Required:** Yes (but free, no credit card)

**Pros:**
- ✅ **Free Tier** - Generous limits
- ✅ **No Credit Card** - For free tier
- ✅ **Auto-Deploy from Git** - GitHub integration
- ✅ **HTTPS/SSL** - Automatic
- ✅ **Next.js Support** - Native support
- ✅ **PostgreSQL Available** - Free tier
- ✅ **Easy Setup** - Minimal configuration
- ✅ **Good Documentation** - Well documented

**Cons:**
- ⚠️ Account required (but free)
- ⚠️ Free tier has limits (sleeps after inactivity)
- ⚠️ Not open source

**Free Tier Limits:**
- 750 hours/month (enough for always-on)
- Sleeps after 15 min inactivity (free tier)
- 100 GB bandwidth/month

**Cost:** Free (with limitations)

**Best For:** Quick deployment without server management

---

### 4. **Fly.io** ⭐ **BEST FOR GLOBAL DISTRIBUTION**

**Type:** Managed Platform  
**License:** Proprietary (but free tier)  
**Account Required:** Yes (but free, no credit card)

**Pros:**
- ✅ **Free Tier** - $5 credit/month
- ✅ **Global Edge** - Deploy close to users
- ✅ **Docker Support** - Container-based
- ✅ **No Credit Card** - For free tier
- ✅ **Fast Deploy** - Quick setup
- ✅ **HTTPS/SSL** - Automatic
- ✅ **PostgreSQL Available** - Managed database

**Cons:**
- ⚠️ Account required (but free)
- ⚠️ Free tier limited ($5/month credit)
- ⚠️ Not open source

**Free Tier:**
- $5 credit/month
- 3 shared-cpu VMs
- 3GB persistent storage

**Cost:** Free (with $5/month credit)

**Best For:** Global distribution and low latency

---

### 5. **Railway** ⭐ **BEST FOR SIMPLICITY**

**Type:** Managed Platform  
**License:** Proprietary (but free tier)  
**Account Required:** Yes (but free, GitHub OAuth)

**Pros:**
- ✅ **Free Tier** - $5 credit/month
- ✅ **GitHub Integration** - Easy deploy
- ✅ **PostgreSQL Available** - Free tier
- ✅ **Simple Setup** - Minimal config
- ✅ **HTTPS/SSL** - Automatic
- ✅ **Good DX** - Great developer experience

**Cons:**
- ⚠️ Account required (GitHub OAuth)
- ⚠️ Free tier limited ($5/month credit)
- ⚠️ Not open source

**Free Tier:**
- $5 credit/month
- 500 hours runtime
- 5GB storage

**Cost:** Free (with $5/month credit)

**Best For:** Simple deployment with good DX

---

### 6. **DigitalOcean App Platform**

**Type:** Managed Platform  
**License:** Proprietary (but free tier)  
**Account Required:** Yes (but free tier available)

**Pros:**
- ✅ **Free Tier** - 3 static sites
- ✅ **Managed Platform** - No server management
- ✅ **PostgreSQL Available** - Managed database
- ✅ **HTTPS/SSL** - Automatic
- ✅ **Git Integration** - Auto-deploy

**Cons:**
- ⚠️ Account required
- ⚠️ Free tier limited (static sites only)
- ⚠️ Not open source
- ⚠️ May need paid tier for Next.js

**Free Tier:**
- 3 static sites
- 1 GiB outbound transfer/month each

**Cost:** Free (limited) or $5/month (basic)

**Best For:** Users already in DigitalOcean ecosystem

---

## 🔧 Self-Hosted Options (No Account Required)

### **Option A: Docker + VPS**

**Setup:**
```bash
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Deploy to:**
- **Hetzner:** €4/month (Germany)
- **DigitalOcean:** $5/month (US)
- **Linode:** $5/month (US)
- **Vultr:** $5/month (Global)

**Pros:**
- ✅ Full control
- ✅ No account required (just VPS)
- ✅ Can use any domain
- ✅ No vendor lock-in

**Cons:**
- ⚠️ Server management required
- ⚠️ Need to set up SSL manually
- ⚠️ Need to handle updates

---

### **Option B: Docker Compose + VPS**

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 📊 Comparison Table

| Platform | Open Source | Account Required | Free Tier | Setup Difficulty | Best For |
|----------|-------------|------------------|-----------|------------------|----------|
| **Coolify** | ✅ Yes | ❌ No | ✅ Free | Medium | Self-hosting |
| **CapRover** | ✅ Yes | ❌ No | ✅ Free | Medium | Docker users |
| **Render** | ❌ No | ✅ Yes (free) | ✅ Yes | Easy | Quick deploy |
| **Fly.io** | ❌ No | ✅ Yes (free) | ✅ Yes | Easy | Global edge |
| **Railway** | ❌ No | ✅ Yes (free) | ✅ Yes | Easy | Simplicity |
| **DigitalOcean** | ❌ No | ✅ Yes | ⚠️ Limited | Easy | DO ecosystem |
| **Docker + VPS** | ✅ Yes | ❌ No | ⚠️ VPS cost | Hard | Full control |

---

## 🎯 Recommended Approach

### **For Beta (50-100 users):**

**Option 1: Render (Easiest)**
- ✅ Quick setup
- ✅ Free tier sufficient
- ✅ No server management
- ✅ Good for beta testing

**Option 2: Coolify (Most Control)**
- ✅ Open source
- ✅ No account required
- ✅ Full control
- ✅ Can migrate easily

### **For Production (Scale):**

**Option 1: Coolify + VPS**
- ✅ Open source
- ✅ Full control
- ✅ Can scale
- ✅ No vendor lock-in

**Option 2: Fly.io**
- ✅ Global edge
- ✅ Good performance
- ✅ Managed platform
- ✅ Easy scaling

---

## 🚀 Quick Start Guides

### **Render Deployment:**

1. **Create account** (free, no credit card)
2. **Connect GitHub** repository
3. **Create new Web Service**
4. **Configure:**
   - Build Command: `cd packages/web && pnpm install && pnpm build`
   - Start Command: `cd packages/web && pnpm start`
   - Environment Variables: Add `ANTHROPIC_API_KEY`
5. **Deploy**

### **Coolify Deployment:**

1. **Set up VPS** (Hetzner, DigitalOcean, etc.)
2. **Install Coolify:**
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
3. **Access web UI** at `http://your-server-ip:8000`
4. **Create new project**
5. **Deploy from Git** or upload Dockerfile
6. **Configure environment variables**
7. **Deploy**

### **Docker + VPS:**

1. **Set up VPS**
2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Clone repository:**
   ```bash
   git clone https://github.com/algoq/akhai.git
   cd akhai/packages/web
   ```
4. **Create Dockerfile** (see above)
5. **Build and run:**
   ```bash
   docker build -t akhai .
   docker run -d -p 3000:3000 \
     -e ANTHROPIC_API_KEY=your_key \
     -v $(pwd)/data:/app/data \
     --name akhai \
     akhai
   ```
6. **Set up Nginx** for reverse proxy and SSL
7. **Configure Let's Encrypt** for HTTPS

---

## 🔒 Security Considerations

### **All Platforms:**
- ✅ Use HTTPS (automatic on most platforms)
- ✅ Set secure environment variables
- ✅ Enable CSP headers (already configured)
- ✅ Regular security updates

### **Self-Hosted:**
- ✅ Set up firewall (UFW)
- ✅ Use strong passwords
- ✅ Regular backups
- ✅ Monitor logs

---

## 💰 Cost Comparison

| Option | Monthly Cost | Notes |
|--------|--------------|-------|
| **Render (Free)** | $0 | Free tier sufficient for beta |
| **Fly.io (Free)** | $0 | $5 credit/month |
| **Railway (Free)** | $0 | $5 credit/month |
| **Coolify + VPS** | $5-10 | VPS cost only |
| **CapRover + VPS** | $5-10 | VPS cost only |
| **Docker + VPS** | $5-10 | VPS cost only |

---

## ✅ Final Recommendation

### **For Beta Deployment:**

**🥇 Render** (if account is acceptable)
- Easiest setup
- Free tier sufficient
- Good documentation
- No server management

**🥈 Coolify** (if no account preferred)
- Open source
- Full control
- No vendor lock-in
- Requires VPS ($5/month)

### **For Production:**

**🥇 Coolify + VPS**
- Open source
- Full control
- Scalable
- No vendor lock-in
- Cost-effective

---

*Last Updated: December 25, 2025*






