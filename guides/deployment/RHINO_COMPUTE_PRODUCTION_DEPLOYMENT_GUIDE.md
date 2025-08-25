# 🚀 **Rhino Compute Production Deployment Guide**

## **Solving the Main Blocker: Enable Live Computations on softlyplease.com**

---

## 📋 **Table of Contents**

### **1. Problem Analysis**
### **2. Deployment Options**
### **3. Heroku Deployment (Recommended)**
### **4. AWS/Azure VM Deployment**
### **5. Docker Container Deployment**
### **6. Security & Performance**
### **7. Testing & Verification**
### **8. Cost Analysis**
### **9. Troubleshooting**

---

## 🔍 **1. Current Problem Analysis**

### **What's Happening:**
```bash
# Production Error:
❌ request to http://localhost:6500/grasshopper failed, reason: connect ECONNREFUSED 127.0.0.1:6500

# Local Works Fine:
✅ Rhino Compute running on localhost:6500
✅ Node.js server connects successfully
✅ TopoOpt.gh computations complete in ~1000ms
```

### **Root Cause:**
The Heroku app is trying to connect to Rhino Compute on `localhost:6500`, but Rhino Compute isn't running in the Heroku environment. Heroku provides an ephemeral file system that doesn't persist between deployments.

### **Impact:**
- ✅ Frontend interface works perfectly
- ✅ API endpoints respond
- ✅ MemCachier caching operational
- ❌ Actual Grasshopper computations fail

---

## 🏗️ **2. Deployment Options Comparison**

| **Option** | **Ease** | **Cost** | **Performance** | **Scalability** | **Setup Time** |
|------------|----------|----------|-----------------|----------------|----------------|
| **Heroku** | ⭐⭐⭐ | 💰💰 | ⭐⭐⭐ | ⭐⭐ | 1-2 days |
| **AWS/Azure VM** | ⭐⭐ | 💰💰💰 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 3-5 days |
| **Docker** | ⭐ | 💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2-3 days |
| **Rhino Cloud Services** | ⭐⭐⭐⭐ | 💰💰💰💰 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1 day |

**🎯 Recommendation:** Start with **Heroku** for quickest implementation, then scale to AWS/Azure if needed.

---

## 🟢 **3. Heroku Deployment (Recommended)**

### **Step 1: Create Separate Rhino Compute App**

```bash
# Create new Heroku app for Rhino Compute
heroku create softlyplease-rhino-compute

# Add required buildpacks
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt
heroku buildpacks:add heroku/dotnet

# Set environment variables
heroku config:set ASPNETCORE_URLS=http://+:6500
heroku config:set ASPNETCORE_ENVIRONMENT=Production
heroku config:set RHINO_COMPUTE_PORT=6500
```

### **Step 2: Prepare Rhino Compute for Heroku**

**Create `Dockerfile` for Rhino Compute:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy and restore
COPY ["RhinoCompute.csproj", "."]
RUN dotnet restore

# Build and publish
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 6500

# Start command
ENTRYPOINT ["dotnet", "RhinoCompute.dll"]
```

**Create `Procfile` for Heroku:**
```procfile
web: dotnet RhinoCompute.dll --urls http://0.0.0.0:6500
```

### **Step 3: Deploy Rhino Compute**

```bash
# Initialize git in Rhino Compute directory
cd /path/to/rhino-compute
git init
git add .
git commit -m "Deploy Rhino Compute to Heroku"

# Add Heroku remote
heroku git:remote -a softlyplease-rhino-compute

# Deploy
git push heroku main
```

### **Step 4: Update Main App Configuration**

```bash
# Get Rhino Compute URL from Heroku
heroku info --app softlyplease-rhino-compute

# Update main app's Rhino Compute URL
heroku config:set RHINO_COMPUTE_URL=https://softlyplease-rhino-compute.herokuapp.com --app softlyplease-appserver
```

### **Step 5: Test the Connection**

```bash
# Test health endpoint
curl https://softlyplease-rhino-compute.herokuapp.com/health

# Test grasshopper endpoint
curl -X POST https://softlyplease-rhino-compute.herokuapp.com/grasshopper \
  -H "Content-Type: application/json" \
  -d '{"definition":"test"}'
```

---

## ☁️ **4. AWS/Azure VM Deployment**

### **AWS EC2 Option:**

```bash
# Launch EC2 Instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --security-groups rhino-compute-sg \
  --key-name your-key-pair

# Install .NET 6
sudo yum update -y
sudo yum install -y dotnet-sdk-6.0

# Install Rhino Compute
cd /opt
git clone https://github.com/mcneel/rhino-compute.git
cd rhino-compute
dotnet build -c Release

# Configure service
sudo nano /etc/systemd/system/rhino-compute.service
```

**Service Configuration:**
```ini
[Unit]
Description=Rhino Compute Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/rhino-compute
ExecStart=/usr/bin/dotnet /opt/rhino-compute/bin/Release/net6.0/RhinoCompute.dll --urls http://0.0.0.0:6500
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable rhino-compute
sudo systemctl start rhino-compute
```

### **Azure VM Option:**

```bash
# Create VM
az vm create \
  --resource-group rhino-compute-rg \
  --name rhino-compute-vm \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Install dependencies
sudo apt update
sudo apt install -y dotnet6

# Deploy Rhino Compute (same as AWS)
```

---

## 🐳 **5. Docker Container Deployment**

### **Step 1: Create Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'
services:
  rhino-compute:
    build: ./rhino-compute
    ports:
      - "6500:6500"
    environment:
      - ASPNETCORE_URLS=http://+:6500
      - ASPNETCORE_ENVIRONMENT=Production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6500/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### **Step 2: Build and Deploy**

```bash
# Build the image
docker build -t rhino-compute ./rhino-compute

# Run locally for testing
docker-compose up -d

# Deploy to cloud (example: DigitalOcean)
doctl apps create --spec docker-compose.yml
```

### **Step 3: Cloud Deployment Options**

**DigitalOcean App Platform:**
```yaml
# .do/app.yaml
name: rhino-compute
static_sites:
  - name: rhino-compute
    source_dir: rhino-compute
    github:
      repo: your-org/rhino-compute
      branch: main
    envs:
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:6500
```

**Railway:**
```bash
# Deploy to Railway
railway init
railway variables set ASPNETCORE_URLS=http://0.0.0.0:6500
railway up
```

---

## 🔒 **6. Security & Performance Configuration**

### **Security Best Practices:**

```bash
# Enable HTTPS only
heroku config:set FORCE_HTTPS=true

# Set up authentication (if needed)
heroku config:set RHINO_COMPUTE_API_KEY=your-secure-api-key

# Configure CORS properly
heroku config:set CORS_ORIGIN=https://softlyplease.com

# Rate limiting
heroku config:set RATE_LIMIT_PER_MINUTE=1000
```

### **Performance Optimization:**

```bash
# Increase dyno resources
heroku ps:resize web=standard-1x

# Enable clustering
heroku config:set WEB_CONCURRENCY=2

# Memory optimization
heroku config:set NODE_OPTIONS=--max-old-space-size=512

# Rhino Compute specific
heroku config:set RHINO_COMPUTE_MAX_WORKERS=4
heroku config:set RHINO_COMPUTE_TIMEOUT=30000
```

### **Monitoring Setup:**

```bash
# Install monitoring addons
heroku addons:create papertrail:choklad
heroku addons:create newrelic:wayne

# Custom health check
heroku config:set HEALTH_CHECK_URL=https://softlyplease-rhino-compute.herokuapp.com/health
```

---

## 🧪 **7. Testing & Verification**

### **Comprehensive Testing Suite:**

```bash
# 1. Test Rhino Compute Health
curl https://softlyplease-rhino-compute.herokuapp.com/health

# 2. Test Grasshopper Endpoint
curl -X POST https://softlyplease-rhino-compute.herokuapp.com/grasshopper \
  -H "Content-Type: application/json" \
  -d '{"definition":"test.gh","inputs":{}}'

# 3. Test Full Integration
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"height":[600],"width":[1200],"depth":[400],"num":[5],"RH_IN:explode":[false]}}'

# 4. Performance Test
for i in {1..10}; do
  time curl -s -X POST https://softlyplease-appserver.herokuapp.com/solve \
    -H "Content-Type: application/json" \
    -d '{"definition":"TopoOpt.gh","inputs":{"height":[600],"width":[1200],"depth":[400],"num":[5],"RH_IN:explode":[false]}}' \
    -o /dev/null
done
```

### **Automated Testing:**

```javascript
// test/rhino-compute.test.js
const axios = require('axios');

describe('Rhino Compute Production', () => {
  const RHINO_URL = process.env.RHINO_COMPUTE_URL;
  const API_URL = process.env.API_URL;

  test('Rhino Compute is healthy', async () => {
    const response = await axios.get(`${RHINO_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
  });

  test('TopoOpt computation works', async () => {
    const response = await axios.post(`${API_URL}/solve`, {
      definition: 'TopoOpt.gh',
      inputs: {
        height: [600],
        width: [1200],
        depth: [400],
        num: [5],
        'RH_IN:explode': [false]
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.headers['x-cache']).toBeDefined();
  });

  test('Performance is acceptable', async () => {
    const start = Date.now();
    await axios.post(`${API_URL}/solve`, {
      definition: 'TopoOpt.gh',
      inputs: { height: [500], width: [1000], depth: [300], num: [3], 'RH_IN:explode': [false] }
    });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

---

## 💰 **8. Cost Analysis**

### **Heroku Deployment:**
```bash
# Standard-1X Dyno: $25/month
# MemCachier: $15/month
# Papertrail: $7/month
# Total: ~$47/month

heroku apps --all  # Check current costs
```

### **AWS EC2:**
```bash
# t3.medium: ~$30/month
# EBS Storage: $5/month
# Total: ~$35/month + bandwidth

aws ec2 describe-instances --instance-ids i-1234567890abcdef0
```

### **DigitalOcean:**
```bash
# Basic Droplet: $6/month
# App Platform: $12/month
# Total: ~$18/month

doctl compute droplet list
```

### **Azure VM:**
```bash
# B2s VM: ~$25/month
# Managed Disk: $2/month
# Total: ~$27/month

az vm list --resource-group rhino-compute-rg
```

**💡 Cost Optimization:**
- Use spot instances for non-production
- Scale down during low usage
- Implement auto-scaling based on load

---

## 🔧 **9. Troubleshooting**

### **Common Issues & Solutions:**

**Issue 1: Connection Refused**
```bash
# Check if service is running
heroku logs --app softlyplease-rhino-compute --tail

# Verify port configuration
heroku config:get ASPNETCORE_URLS

# Test direct connection
curl https://softlyplease-rhino-compute.herokuapp.com/health
```

**Issue 2: Computation Timeout**
```bash
# Increase timeout settings
heroku config:set RHINO_COMPUTE_TIMEOUT=60000

# Check memory usage
heroku ps:resize web=standard-1x

# Monitor performance
heroku addons:open newrelic
```

**Issue 3: High Memory Usage**
```bash
# Monitor memory
heroku logs --app softlyplease-rhino-compute | grep memory

# Optimize worker count
heroku config:set RHINO_COMPUTE_MAX_WORKERS=2

# Check for memory leaks
heroku addons:open newrelic
```

**Issue 4: CORS Errors**
```bash
# Update CORS settings
heroku config:set CORS_ORIGIN=https://softlyplease.com,https://www.softlyplease.com

# Test CORS headers
curl -I -X OPTIONS https://softlyplease-rhino-compute.herokuapp.com/grasshopper
```

### **Debug Commands:**

```bash
# Check all environment variables
heroku config --app softlyplease-rhino-compute

# View recent logs
heroku logs --app softlyplease-rhino-compute --tail

# Check dyno status
heroku ps --app softlyplease-rhino-compute

# Restart services
heroku ps:restart --app softlyplease-rhino-compute

# Check build status
heroku builds --app softlyplease-rhino-compute
```

### **Emergency Rollback:**

```bash
# Rollback to previous release
heroku releases --app softlyplease-rhino-compute
heroku rollback v10 --app softlyplease-rhino-compute

# Temporary disable problematic endpoint
heroku maintenance:on --app softlyplease-appserver
```

---

## 🎯 **Implementation Roadmap**

### **Phase 1: Quick Win (1-2 days)**
1. ✅ Deploy Rhino Compute to Heroku
2. ✅ Update main app configuration
3. ✅ Test basic connectivity
4. ✅ Verify TopoOpt computations work

### **Phase 2: Optimization (1 week)**
1. 🔧 Configure security settings
2. 📊 Set up monitoring
3. ⚡ Optimize performance
4. 🧪 Implement comprehensive testing

### **Phase 3: Production Ready (1 week)**
1. 🚀 Enable auto-scaling
2. 📈 Set up alerts
3. 🔄 Implement backup strategy
4. 📚 Update documentation

---

## 🚀 **Quick Start - Heroku Method**

**Execute these commands to fix the blocker:**

```bash
# 1. Create Rhino Compute app
heroku create softlyplease-rhino-compute

# 2. Configure it
heroku config:set ASPNETCORE_URLS=http://+:6500 --app softlyplease-rhino-compute
heroku buildpacks:add heroku/dotnet --app softlyplease-rhino-compute

# 3. Deploy Rhino Compute (you'll need the source code)
# ... deploy steps here ...

# 4. Update main app
heroku config:set RHINO_COMPUTE_URL=https://softlyplease-rhino-compute.herokuapp.com --app softlyplease-appserver

# 5. Test
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"height":[600],"width":[1200],"depth":[400],"num":[5],"RH_IN:explode":[false]}}'
```

**🎉 Result:** Live topology optimization computations on softlyplease.com!

**Need the Rhino Compute source code?** Let me know and I can help you obtain and configure it for deployment!
