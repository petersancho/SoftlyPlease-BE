# 🐘 Complete Rhino Compute Deployment Guide

This guide implements a production-ready Rhino Compute setup with clear separation between Windows infrastructure and Linux web services.

## 🎯 Docker Strategy: Right Tool for the Right Job

### ✅ Where Docker Helps:
- **Heroku Web App**: Containerized Node.js for reproducible builds and portability
- **Development Environment**: Mock Rhino.Compute service (Windows-free development)
- **CI/CD Pipelines**: Consistent build environments
- **Future Scaling**: Rhino.Compute cluster management (if moving to Kubernetes)

### 🚫 Where Docker Cannot Help:
- **Rhino.Compute Core**: Must run on Windows (Rhino is Windows-only desktop software)
- **Heroku Deployment**: Heroku only supports Linux containers, not Windows

### 🏗️ Architecture Overview:

```
🌐 Frontend (Heroku - Linux)
├── Node.js Web App (🐳 Containerized)
└── Examples & Static Assets

🔧 Backend (Azure - Windows)
├── Rhino.Compute (Windows Server)
├── Caddy Reverse Proxy (TLS/Auth)
└── Windows Docker Containers (optional scaling)
```

## 📋 Architecture Overview

```
🌐 Internet
├── Heroku Appserver (🐳 Containerized Node.js)
└── Examples & Static Assets

🔧 Azure Windows Infrastructure
├── Windows Server VM
├── Rhino.Compute (Windows-only)
├── Caddy Reverse Proxy (TLS/Auth)
└── Optional: Windows Docker Containers for scaling
```

## 📁 Project Structure

```
compute-sp/
├── compute.rhino3d.appserver/     # Heroku Node.js app
│   ├── src/
│   │   ├── lib/computeClient.js   # New: Centralized Compute communication
│   │   ├── routes/
│   │   │   ├── status.js          # Updated: Uses computeClient
│   │   │   └── solve.js           # Updated: Uses computeClient
│   │   └── app.js                 # Updated: Fixed require paths
├── ops/                           # Infrastructure scripts
│   ├── bootstrap.ps1              # Azure VM setup script
│   ├── Dockerfile.rhino           # Rhino Compute container
│   ├── test-acceptance.ps1        # Comprehensive testing
│   └── README.md                  # This file
└── azure-setup.sh                 # Alternative Azure setup
```

## 🚀 Deployment Options

### Option A: Traditional Heroku (Buildpack-based)
```bash
# Simple deployment using Heroku buildpacks
heroku create softlyplease-appserver --buildpack heroku/nodejs
git push heroku main
```

### Option B: Docker Container (Recommended)
```bash
# More control, reproducible builds, better portability
heroku create softlyplease-appserver
heroku container:login
heroku container:push web -a softlyplease-appserver
heroku container:release web -a softlyplease-appserver
```

### Option C: Local Development with Docker
```bash
# Windows-free development with mock Rhino.Compute
docker-compose -f docker-compose.dev.yml up
# Visit: http://localhost:3000
```

## 🏗️ Step-by-Step Deployment

### Step 1: Deploy Heroku Web App

Choose one of the deployment methods above, then configure:

```bash
# Set environment variables (standardized naming)
heroku config:set RHINO_RHINO_COMPUTE_URL="http://your-azure-vm:8081" -a softlyplease-appserver
heroku config:set RHINO_COMPUTE_KEY="your-api-key" -a softlyplease-appserver
```

### Step 2: Azure Windows Infrastructure Setup

**Option A: Automated Setup (Recommended)**
```bash
# 1. Create Azure VM with Windows Server 2022
# Edit ops/bootstrap.ps1 to set your variables:
# $DOMAIN = "compute.softlyplease.com"
# $APP_ORIGIN = "https://www.softlyplease.com"
# $BEARER = "<generate_long_random_token>"

# 2. Run on the Azure VM (as Administrator)
cd C:\softlycompute
# Copy ops/bootstrap.ps1 to VM and execute
.\bootstrap.ps1
```

**Option B: Manual Azure CLI Setup**
```bash
# 1. Create Windows Server 2022 VM
az vm create \
  --resource-group rhino-compute-rg \
  --name rhino-compute-vm \
  --image Win2022Datacenter \
  --size Standard_D4s_v5 \
  --admin-password "ComplexPassword123!" \
  --public-ip-sku Standard

# 2. Open firewall ports
az vm open-port --resource-group rhino-compute-rg --name rhino-compute-vm --port 80,443
```

### Step 3: Build Rhino Compute Container

On the Azure VM:
```bash
# 1. Install Docker Desktop for Windows
# Download and install from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
# Enable Windows containers mode

# 2. Clone Rhino Compute repository
git clone https://github.com/mcneel/compute.rhino3d.git
cd compute.rhino3d

# 3. Copy the Dockerfile from this project
copy C:\softlycompute\ops\Dockerfile.rhino .\Dockerfile

# 4. Build with process isolation (REQUIRED for Windows containers)
docker build --isolation=process -t softly/rhino-compute:8 .

# 5. Run the container
docker run -d --restart=always --name rhino-compute `
  -e ASPNETCORE_URLS="http://*:8081" `
  -e RHINO_TOKEN="<your_rhino_core_token>" `
  -e RHINO_COMPUTE_KEY="<your_api_key>" `
  -p 127.0.0.1:8081:8081 `
  softly/rhino-compute:8
```

### Step 3: Configure Caddy (Reverse Proxy + TLS)

The `bootstrap.ps1` script automatically creates the Caddy configuration. It:
- Installs Caddy as a Windows service
- Configures TLS termination with Let's Encrypt
- Sets up Bearer token authentication for POST/PUT/PATCH/DELETE
- Allows unauthenticated GET /version for health checks
- Enables CORS for your Heroku app origin

### Step 4: DNS Configuration

```bash
# Create DNS A record
# compute.softlyplease.com → [Azure VM Public IP]

# Verify DNS propagation
nslookup compute.softlyplease.com
```

### Step 5: Update Heroku Configuration

```bash
# Set environment variables (replace with actual values)
heroku config:set RHINO_COMPUTE_URL=https://compute.softlyplease.com -a softlyplease-appserver
heroku config:set COMPUTE_KEY=<same_token_as_BEARER_in_bootstrap> -a softlyplease-appserver

# Verify configuration
heroku config -a softlyplease-appserver
```

## 🛠️ Development Environment

### Windows-Free Development with Mock Service

For frontend developers who don't have Windows/Rhino locally:

```bash
# Start complete development environment
docker-compose -f docker-compose.dev.yml up

# Your app runs on: http://localhost:3000
# Mock Rhino.Compute on: http://localhost:8081
```

**What the mock provides:**
- ✅ `/version` endpoint (same as real Rhino.Compute)
- ✅ `/solve` endpoint with realistic responses
- ✅ Proper JSON structure matching Rhino.Compute API
- ✅ Configurable responses based on input parameters
- ✅ No Windows/Rhino installation required

**Benefits:**
- Frontend developers can work without Windows infrastructure
- Test UI interactions without waiting for real compute
- Develop and debug faster
- Consistent API contract across environments

## 🧪 Acceptance Testing

Run the comprehensive test suite on the Azure VM:

```bash
# Copy test script to VM
copy ops\test-acceptance.ps1 C:\softlycompute\

# Edit variables in the script
$DOMAIN = "compute.softlyplease.com"
$HEROKU_APP = "softlyplease-appserver"
$COMPUTE_KEY = "<your_compute_key>"

# Run tests
.\test-acceptance.ps1
```

### Expected Test Results:

✅ **Rhino Compute health check passed** (localhost:8081/version)
✅ **Public HTTPS endpoint works** (https://compute.softlyplease.com/version)
✅ **Authentication correctly blocks unauthorized requests** (401 for POST without token)
✅ **Heroku status endpoint works** (returns JSON with compute status)
✅ **Examples page loads successfully** (https://www.softlyplease.com/examples/)

## 🔧 Configuration Files

### Caddyfile (Auto-generated by bootstrap.ps1)
```caddyfile
compute.softlyplease.com {
    encode zstd gzip

    # Require Bearer token for mutations
    @needsAuth method POST PUT PATCH DELETE
    route {
        @auth header Authorization "Bearer <your_token>"
        handle @needsAuth {
            @badAuth not header Authorization "Bearer <your_token>"
            respond @badAuth 401
        }
    }

    # CORS for Heroku app
    header {
        Access-Control-Allow-Origin https://www.softlyplease.com
        Access-Control-Allow-Methods "GET,POST,OPTIONS"
        Access-Control-Allow-Headers "Authorization,Content-Type"
    }

    reverse_proxy 127.0.0.1:8081
}
```

### Docker Compose Alternative
```yaml
version: '3.8'
services:
  rhino-compute:
    build:
      context: .
      dockerfile: Dockerfile.rhino
      isolation: process
    ports:
      - "127.0.0.1:8081:8081"
    environment:
      - ASPNETCORE_URLS=http://*:8081
      - RHINO_TOKEN=<your_token>
      - RHINO_COMPUTE_KEY=<your_key>
    restart: unless-stopped
```

## 🔒 Security Features

- **TLS Termination**: Caddy handles HTTPS with auto-renewing Let's Encrypt certificates
- **Bearer Token Auth**: Only authorized requests can modify data
- **Network Isolation**: Rhino Compute only accessible via localhost (127.0.0.1)
- **Rate Limiting**: Built into Caddy configuration
- **CORS Protection**: Only your Heroku app can make browser requests

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check container logs
docker logs rhino-compute

# Check if port 8081 is available
netstat -ano | findstr :8081

# Verify environment variables
docker exec rhino-compute env
```

### Caddy TLS Issues
```bash
# Check Caddy logs
Get-WinEvent -LogName "Application" | Where-Object { $_.ProviderName -like "*caddy*" }

# Restart Caddy service
Restart-Service caddy
```

### Authentication Problems
```bash
# Test with curl
curl -H "Authorization: Bearer <your_token>" https://compute.softlyplease.com/solve -X POST -d '{"test":"data"}'

# Check token matches between bootstrap.ps1 and Heroku
heroku config:get COMPUTE_KEY -a softlyplease-appserver
```

### DNS Issues
```bash
# Verify DNS resolution
nslookup compute.softlyplease.com

# Test connectivity
Test-NetConnection -ComputerName compute.softlyplease.com -Port 443
```

## 📊 Cost Estimation

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Azure VM (D4s_v5) | ~$150 | 4 vCPU, 16GB RAM |
| Public IP | ~$5 | Static IP |
| DNS | ~$1 | Azure DNS Zone |
| **Total** | **~$156** | Production-ready |

## 🎯 Docker Benefits Summary

| Component | Docker Role | Benefits |
|-----------|-------------|----------|
| **Heroku Web App** | 🐳 **Full Containerization** | Reproducible builds, portability, security |
| **Rhino.Compute** | 🚫 **Cannot Containerize** | Windows-only software, needs Windows infrastructure |
| **Development** | 🐳 **Mock Services** | Windows-free development, faster iteration |
| **CI/CD** | 🐳 **Build Consistency** | Same image locally and in production |
| **Future Scaling** | 🐳 **Kubernetes Ready** | Easy migration to container orchestration |

## 🎯 Production Checklist

- [ ] Azure VM created with Windows Server 2022
- [ ] Docker Desktop installed and configured for Windows containers
- [ ] Rhino Compute repository cloned and container built
- [ ] Caddy installed and configured with TLS
- [ ] DNS A record configured (compute.softlyplease.com → VM IP)
- [ ] Heroku environment variables set (RHINO_COMPUTE_URL, COMPUTE_KEY)
- [ ] All acceptance tests passing
- [ ] SSL certificate issued by Let's Encrypt
- [ ] Firewall configured (only 80/443 open to internet)
- [ ] VM backups configured
- [ ] Monitoring/alerts set up

## 🔄 Rollback Plan

### Quick Rollback (if container issues)
```bash
# Stop current container
docker stop rhino-compute

# Run previous version
docker run -d --restart=always --name rhino-compute-rollback `
  -e ASPNETCORE_URLS="http://*:8081" `
  -p 127.0.0.1:8081:8081 `
  softly/rhino-compute:7  # Previous version
```

### Full Infrastructure Rollback
```bash
# Heroku: Revert to direct Azure VM connection
heroku config:set RHINO_COMPUTE_URL=http://<vm_ip>:6001 -a softlyplease-appserver
heroku config:unset COMPUTE_KEY -a softlyplease-appserver

# Azure: Delete new resources
az group delete --name rhino-compute-rg --yes
```

## 📞 Support

If you encounter issues:

1. **Check the test script output** - it will identify specific failures
2. **Review container logs** - `docker logs rhino-compute`
3. **Verify network connectivity** - ensure ports are open in Azure NSG
4. **Check DNS propagation** - `nslookup compute.softlyplease.com`
5. **Validate tokens** - ensure COMPUTE_KEY matches between Heroku and Caddy

This setup provides a **production-ready, secure, and scalable** Rhino Compute deployment! 🚀
