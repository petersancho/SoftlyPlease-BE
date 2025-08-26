# 🔧 **SOFTLYPLEASE.COM BACKEND AGENT MASTER GUIDE**
## **Complete System Architecture & Deployment Reference**

---

## 📋 **TABLE OF CONTENTS**

### **1. SYSTEM OVERVIEW**
- 1.1 Architecture Diagram
- 1.2 Component Descriptions
- 1.3 Data Flow
- 1.4 Technology Stack

### **2. INFRASTRUCTURE COMPONENTS**
- 2.1 Azure VM (Rhino Compute)
- 2.2 Heroku AppServer
- 2.3 DNS Configuration
- 2.4 Security & Authentication

### **3. ENVIRONMENT CONFIGURATION**
- 3.1 Required Environment Variables
- 3.2 Heroku Configuration
- 3.3 Azure VM Setup
- 3.4 Port Configuration

### **4. DEPLOYMENT PROCEDURES**
- 4.1 Initial Setup
- 4.2 Heroku Deployment
- 4.3 Azure VM Deployment
- 4.4 DNS Updates

### **5. API ENDPOINTS & FUNCTIONALITY**
- 5.1 Core Endpoints
- 5.2 Grasshopper Definitions
- 5.3 Solve Operations
- 5.4 Caching System

### **6. TESTING & VERIFICATION**
- 6.1 Health Checks
- 6.2 Performance Testing
- 6.3 End-to-End Testing
- 6.4 Monitoring Commands

### **7. TROUBLESHOOTING**
- 7.1 Common Issues
- 7.2 Error Codes
- 7.3 Debug Procedures
- 7.4 Emergency Fixes

### **8. FILE STRUCTURE REFERENCE**
- 8.1 Source Code Layout
- 8.2 Configuration Files
- 8.3 Grasshopper Definitions
- 8.4 Scripts Directory

### **9. SECURITY & BEST PRACTICES**
- 9.1 Authentication
- 9.2 API Keys
- 9.3 Firewall Rules
- 9.4 SSL/HTTPS

### **10. MONITORING & LOGGING**
- 10.1 Heroku Logs
- 10.2 Azure VM Logs
- 10.3 Performance Metrics
- 10.4 Alert Configuration

### **11. SCALING & PERFORMANCE**
- 11.1 Heroku Dynos
- 11.2 Azure VM Sizing
- 11.3 Caching Strategies
- 11.4 Load Balancing

### **12. EMERGENCY PROCEDURES**
- 12.1 System Restart
- 12.2 Service Recovery
- 12.3 Data Backup
- 12.4 Incident Response

---

## **1. SYSTEM OVERVIEW**

### **1.1 Architecture Diagram**
```
User Browser → Heroku AppServer → Azure VM Rhino Compute
     ↓              ↓                    ↓
   Frontend     Node.js Server     Geometry Engine
   (static)     (solves GH defs)   (port 6500)

                     ┌─────────────────┐
                     │  softlyplease.com │
                     │     (DNS)        │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Heroku App     │
                     │ softlyplease-    │
                     │ appserver        │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Azure VM       │
                     │ 4.248.252.92     │
                     │ Port 6500        │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Rhino Compute   │
                     │  + Grasshopper   │
                     └─────────────────┘
```

### **1.2 Component Descriptions**

#### **Frontend (User Browser)**
- **Purpose**: Client-side interface for users to interact with Grasshopper definitions
- **Technology**: HTML5, JavaScript, Three.js, rhino3dm.js
- **Location**: Served by Heroku AppServer
- **Function**: Displays 3D geometry results, provides input controls

#### **Heroku AppServer (Node.js)**
- **Purpose**: Main application server handling HTTP requests and API calls
- **Technology**: Node.js + Express.js
- **Location**: Heroku Cloud (softlyplease-appserver)
- **Function**:
  - Serves static frontend files
  - Handles API requests for definition solving
  - Communicates with Azure VM Rhino Compute
  - Implements caching (Memcached + Node-cache)
  - Provides REST API endpoints

#### **Azure VM Rhino Compute**
- **Purpose**: Headless Rhino + Grasshopper geometry processing engine
- **Technology**: Rhino 7 + Grasshopper + Rhino Compute
- **Location**: Azure VM (4.248.252.92:6500)
- **Function**:
  - Executes Grasshopper definitions
  - Processes geometry computations
  - Returns mesh/geometry data
  - Runs as Windows service

### **1.3 Data Flow**
```
1. User visits softlyplease.com
2. DNS resolves to Heroku app
3. Heroku serves frontend HTML/JS
4. User selects definition + inputs
5. Frontend sends API request to Heroku
6. Heroku forwards request to Azure VM
7. Azure VM processes with Rhino Compute
8. Results flow back: VM → Heroku → Frontend → User
```

### **1.4 Technology Stack**
- **Backend**: Node.js 16.x + Express.js
- **Compute Engine**: Rhino 7 + Grasshopper + compute.rhino3d
- **Caching**: Memcached (Heroku) + node-cache (local)
- **Frontend**: HTML5 + JavaScript + Three.js + rhino3dm.js
- **Deployment**: Heroku (appserver) + Azure VM (compute)
- **Version Control**: Git
- **Package Management**: npm

---

## **2. INFRASTRUCTURE COMPONENTS**

### **2.1 Azure VM (Rhino Compute)**
- **IP Address**: `4.248.252.92`
- **Port**: `6500` (HTTP)
- **OS**: Windows Server
- **Services**: RhinoCompute (Windows Service)
- **Authentication**: API Key required
- **Firewall**: Port 6500 open for Heroku access

### **2.2 Heroku AppServer**
- **App Name**: `softlyplease-appserver`
- **URL**: `https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/`
- **Dynos**: Web (2 concurrent workers)
- **Stack**: Heroku-24
- **Buildpack**: Node.js
- **Addons**: Memcachier

### **2.3 DNS Configuration**
- **Domain**: `softlyplease.com`
- **Provider**: Namecheap
- **Current Setup**:
  - `softlyplease.com` → `metric-hamster-*.herokudns.com`
  - `www.softlyplease.com` → `animated-chestnut-*.herokudns.com`

### **2.4 Security & Authentication**
- **API Key**: `p2robot-13a6-48f3-b24e-2025computeX`
- **HTTPS**: Required for production
- **CORS**: Configured for domain access
- **Rate Limiting**: 100 requests/minute

---

## **3. ENVIRONMENT CONFIGURATION**

### **3.1 Required Environment Variables**

#### **Heroku AppServer Variables**:
```bash
# Rhino Compute Connection
RHINO_COMPUTE_URL=http://4.248.252.92:6500/
RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
RHINO_COMPUTE_KEY=softlyplease-secure-key-2024

# Application Settings
NODE_ENV=production
PORT=3000
WEB_CONCURRENCY=2

# Domain & CORS
CORS_ORIGIN=https://www.softlyplease.com
CUSTOM_DOMAIN_URL=https://www.softlyplease.com
PUBLIC_BASE_URL=https://softlyplease-appserver.herokuapp.com

# Performance
MAX_CONCURRENT_COMPUTATIONS=5
RATE_LIMIT=100
SLOW_REQUEST_THRESHOLD=5000
PERFORMANCE_LOGGING=true
FORCE_HTTPS=true

# Caching (Memcachier)
MEMCACHIER_SERVERS=1062694.heroku.prod.memcachier.com:11211
MEMCACHIER_USERNAME=4995F4
MEMCACHIER_PASSWORD=F2BE935C4124100DEA0E2FE780732406

# Cache TTL Settings
CACHE_DEFAULT_TTL=3600
CACHE_BEAM_TTL=1800
CACHE_TOPOOPT_TTL=7200

# Heroku Specific
HEROKU_APP_NAME=softlyplease-appserver
APP_TOKEN=prod-token-456
```

### **3.2 Heroku Configuration Commands**
```bash
# Set Rhino Compute connection
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_KEY=softlyplease-secure-key-2024 --app softlyplease-appserver

# Set production environment
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set WEB_CONCURRENCY=2 --app softlyplease-appserver

# Set domain settings
heroku config:set CORS_ORIGIN=https://www.softlyplease.com --app softlyplease-appserver
heroku config:set CUSTOM_DOMAIN_URL=https://www.softlyplease.com --app softlyplease-appserver
```

### **3.3 Azure VM Setup**
```powershell
# Windows Service Installation
# Run as Administrator on Azure VM
.\scripts\install-service.ps1

# Service Configuration
Service Name: RhinoCompute
Executable: rhino-compute.exe
Port: 6500
API Key: p2robot-13a6-48f3-b24e-2025computeX
```

### **3.4 Port Configuration**
- **Heroku**: Dynamic port (assigned by Heroku, defaults to 3000)
- **Azure VM**: Fixed port 6500
- **Firewall**: Azure VM inbound rule for port 6500

---

## **4. DEPLOYMENT PROCEDURES**

### **4.1 Initial Setup**
```bash
# 1. Clone repository
git clone <your-repo-url>
cd compute-sp

# 2. Copy proper backend files
cp -r SoftlyPlease-BE-main/compute.rhino3d.appserver/src/* src/
cp SoftlyPlease-BE-main/compute.rhino3d.appserver/package.json .
cp SoftlyPlease-BE-main/compute.rhino3d.appserver/Procfile .

# 3. Install dependencies
npm install

# 4. Set Heroku environment variables
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/
heroku config:set RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
heroku config:set NODE_ENV=production

# 5. Deploy to Heroku
git add .
git commit -m "Deploy proper McNeel backend"
git push heroku main
```

### **4.2 Heroku Deployment**
```bash
# Deploy current changes
git add .
git commit -m "Deploy updates"
git push heroku main

# Check deployment status
heroku releases --app softlyplease-appserver
heroku logs --tail --app softlyplease-appserver

# Rollback if needed
heroku rollback v193 --app softlyplease-appserver
```

### **4.3 Azure VM Deployment**
```powershell
# Connect to Azure VM via RDP
# Navigate to Rhino Compute installation directory
cd C:\Program Files\McNeel\Rhino Compute

# Update Rhino Compute service
.\rhino-compute.exe --update

# Restart service
Restart-Service RhinoCompute

# Check service status
Get-Service RhinoCompute
```

### **4.4 DNS Updates**
```bash
# Current DNS configuration (Namecheap)
# Update these records to point to correct Heroku app:

# CNAME Record:
# Host: @
# Value: softlyplease-appserver-5d5d5bc6198a.herokuapp.com
# TTL: 5 minutes

# CNAME Record:
# Host: www
# Value: softlyplease-appserver-5d5d5bc6198a.herokuapp.com
# TTL: 5 minutes
```

---

## **5. API ENDPOINTS & FUNCTIONALITY**

### **5.1 Core Endpoints**

#### **GET / - List Definitions**
```bash
curl https://softlyplease-appserver.herokuapp.com/
# Returns: [{"name":"Bending_gridshell.gh"}, {"name":"dresser3.gh"}, ...]
```

#### **GET /?format=json - JSON API**
```bash
curl "https://softlyplease-appserver.herokuapp.com/?format=json"
# Returns: Array of all 14 Grasshopper definitions
```

#### **GET /definition/[name] - Definition Details**
```bash
curl https://softlyplease-appserver.herokuapp.com/definition/dresser3.gh
# Returns: HTML page with definition details
```

#### **GET/POST /solve/[definition] - Solve Definition**
```bash
# GET request with query parameters
curl "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100&height=200"

# POST request with JSON body
curl -X POST https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"width":100,"height":200,"depth":50}}'
```

### **5.2 Available Grasshopper Definitions**
```javascript
const definitions = [
  "beam_mod.gh",
  "Bending_gridshell.gh",
  "BranchNodeRnd.gh",
  "brep_union.gh",
  "delaunay.gh",
  "docString.gh",
  "dresser3.gh",
  "metaballTable.gh",
  "QuadPanelAperture.gh",
  "rnd_lattice.gh",
  "rnd_node.gh",
  "SampleGHConvertTo3dm.gh",
  "srf_kmeans.gh",
  "value_list.gh"
];
```

### **5.3 Solve Operations**

#### **Input Parameters**:
- **GET**: Query string parameters (`?param1=value1&param2=value2`)
- **POST**: JSON body with `inputs` object
- **Both**: Support for numeric values, strings, and arrays

#### **Output Format**:
```json
{
  "definition": "dresser3.gh",
  "inputs": {"width": 100, "height": 200, "depth": 50},
  "outputs": {
    "mesh": "DracoCompressedMeshData...",
    "geometry": "RhinoGeometryData..."
  },
  "computation_time": 1250,
  "cached": false
}
```

### **5.4 Caching System**

#### **Multi-Level Caching**:
1. **Browser Cache**: GET requests leverage browser caching
2. **Heroku Memcached**: Server-side caching via Memcachier addon
3. **Node-cache**: Local in-memory cache as fallback

#### **Cache Configuration**:
```javascript
const cacheSettings = {
  default: 3600,    // 1 hour
  beam: 1800,       // 30 minutes
  topoopt: 7200     // 2 hours
};
```

---

## **6. TESTING & VERIFICATION**

### **6.1 Health Checks**
```bash
# Test Heroku app is running
curl -s https://softlyplease-appserver.herokuapp.com/version

# Test Rhino Compute connectivity
curl -s http://4.248.252.92:6500/version

# Test full pipeline
curl -s "https://softlyplease-appserver.herokuapp.com/?format=json"
```

### **6.2 Performance Testing**
```bash
# Test response time
curl -o /dev/null -s -w "%{time_total}\n" \
  https://softlyplease-appserver.herokuapp.com/

# Test concurrent requests
for i in {1..10}; do
  curl -s "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100" &
done
```

### **6.3 End-to-End Testing**
```bash
# Complete pipeline test
echo "Testing full pipeline..."

# 1. Test definitions list
echo "1. Getting definitions..."
curl -s https://softlyplease-appserver.herokuapp.com/ | jq '. | length'
# Should return: 14

# 2. Test specific definition
echo "2. Testing dresser3.gh..."
curl -s "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100&height=200" \
  -w "Status: %{http_code}\n"

# 3. Test caching
echo "3. Testing cache..."
time curl -s "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100" > /dev/null
time curl -s "https://softlyplease-appserver.herokuapp.com/solve/dresser3.gh?width=100" > /dev/null
```

### **6.4 Monitoring Commands**
```bash
# Heroku monitoring
heroku logs --tail --app softlyplease-appserver
heroku ps --app softlyplease-appserver
heroku metrics --app softlyplease-appserver

# Azure VM monitoring (run on VM)
Get-Service RhinoCompute
Get-Process | Where-Object {$_.ProcessName -like "*rhino*"}
netstat -ano | findstr :6500
```

---

## **7. TROUBLESHOOTING**

### **7.1 Common Issues**

#### **Issue: "Definition not found on server"**
```
Error: Definition 'xyz.gh' not found on server.
```
**Solutions**:
```bash
# Check available definitions
curl https://softlyplease-appserver.herokuapp.com/

# Verify file exists in src/files/
ls -la src/files/

# Check Heroku deployment included files
heroku run ls src/files/ --app softlyplease-appserver
```

#### **Issue: "Application Error" on Heroku**
```
Application Error - Heroku
```
**Solutions**:
```bash
# Check Heroku logs
heroku logs --tail --app softlyplease-appserver

# Check if app is running
heroku ps --app softlyplease-appserver

# Restart dynos
heroku ps:restart --app softlyplease-appserver

# Check environment variables
heroku config --app softlyplease-appserver
```

#### **Issue: "Connection refused" to Azure VM**
```
Failed to connect to 4.248.252.92:6500
```
**Solutions**:
```bash
# Test Azure VM connectivity
curl -s http://4.248.252.92:6500/version

# Check Azure VM service status (run on VM)
Get-Service RhinoCompute
Restart-Service RhinoCompute

# Verify firewall rules
Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 6500}
```

### **7.2 Error Codes**

#### **HTTP Status Codes**:
- **200**: Success
- **404**: Definition not found
- **500**: Server error
- **503**: Service unavailable

#### **Rhino Compute Errors**:
- **"Invalid API key"**: Check RHINO_COMPUTE_APIKEY
- **"Timeout"**: Increase timeout or check VM performance
- **"Memory limit exceeded"**: Reduce complexity or increase VM size

### **7.3 Debug Procedures**
```bash
# Enable debug logging
heroku config:set DEBUG=* --app softlyplease-appserver
heroku config:set PERFORMANCE_LOGGING=true --app softlyplease-appserver

# Test with verbose output
curl -v https://softlyplease-appserver.herokuapp.com/version

# Check Heroku app metrics
heroku metrics web --app softlyplease-appserver

# Monitor Azure VM performance
# Run on VM:
Get-Counter '\Processor(_Total)\% Processor Time'
Get-Counter '\Memory\Available MBytes'
```

### **7.4 Emergency Fixes**
```bash
# Quick Heroku restart
heroku ps:restart --app softlyplease-appserver

# Force redeploy
heroku releases --app softlyplease-appserver
heroku rollback v193 --app softlyplease-appserver

# Azure VM service reset
# Run on VM as Administrator:
Stop-Service RhinoCompute
Start-Service RhinoCompute

# Clear all caches
heroku run node -e "const cache = require('node-cache'); cache.flushAll()" --app softlyplease-appserver
```

---

## **8. FILE STRUCTURE REFERENCE**

### **8.1 Source Code Layout**
```
src/
├── app.js                 # Main Express app configuration
├── bin/
│   └── www               # Server startup script
├── routes/
│   ├── index.js          # Main route handler
│   ├── solve.js          # Definition solving logic
│   ├── definition.js     # Definition metadata
│   ├── template.js       # View templates
│   └── version.js        # Version endpoint
├── files/                 # Grasshopper definitions (.gh files)
│   ├── dresser3.gh
│   ├── beam_mod.gh
│   └── ... (14 total)
├── examples/              # Frontend examples
│   ├── index.html
│   ├── beam/
│   ├── delaunay/
│   └── ...
├── views/                 # Handlebars templates
│   ├── list.hbs
│   └── definition.hbs
└── definitions.js         # Definition registry
```

### **8.2 Configuration Files**
```
package.json              # Node.js dependencies & scripts
Procfile                  # Heroku process definition
README.md                 # Project documentation
.eslintrc.json           # Code linting rules
```

### **8.3 Scripts Directory**
```
scripts/
├── azure/                # Azure VM management
│   ├── RESTART-NODEJS-FIX.ps1
│   ├── SIMPLE-FIX.txt
│   └── install-service.ps1
├── heroku/               # Heroku deployment
│   └── heroku-deploy.sh
└── deployment-check.sh   # Health check script
```

### **8.4 Grasshopper Definitions**
All `.gh` files are stored in `src/files/` and include:
- **beam_mod.gh**: Beam modification examples
- **Bending_gridshell.gh**: Grid shell bending
- **BranchNodeRnd.gh**: Random branching nodes
- **brep_union.gh**: BREP union operations
- **delaunay.gh**: Delaunay triangulation
- **docString.gh**: Documentation strings
- **dresser3.gh**: 3D dresser model
- **metaballTable.gh**: Metaball table geometry
- **QuadPanelAperture.gh**: Quad panel apertures
- **rnd_lattice.gh**: Random lattice structures
- **rnd_node.gh**: Random node generation
- **SampleGHConvertTo3dm.gh**: 3DM conversion
- **srf_kmeans.gh**: Surface K-means clustering
- **value_list.gh**: Value list operations

---

## **9. SECURITY & BEST PRACTICES**

### **9.1 Authentication**
- **API Key Required**: All Rhino Compute requests require `RHINO_COMPUTE_APIKEY`
- **HTTPS Only**: All production traffic must use HTTPS
- **CORS Protection**: Configured to only accept requests from authorized domains

### **9.2 API Keys**
```bash
# Current production keys:
RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
RHINO_COMPUTE_KEY=softlyplease-secure-key-2024

# Rotate keys periodically:
heroku config:set RHINO_COMPUTE_APIKEY=new-key-here --app softlyplease-appserver
# Update Azure VM configuration with new key
```

### **9.3 Firewall Rules**
**Azure VM Inbound Rules**:
```
Priority 100: ICMP Any - Any (Allow)
Priority 300: RDP 3389 TCP Any - Any (Allow)
Priority 320: HTTPS 443 TCP Any - Any (Allow)
Priority 340: HTTP 80 TCP Any - Any (Allow)
Priority 350: Rhino-Compute-Inbound 6500 TCP Any - Any (Allow)
```

### **9.4 SSL/HTTPS**
- **Heroku**: Automatic SSL via Heroku SSL
- **Domain**: `softlyplease.com` configured for HTTPS
- **Certificate**: Managed by Heroku (auto-renewal)

---

## **10. MONITORING & LOGGING**

### **10.1 Heroku Logs**
```bash
# Real-time log tailing
heroku logs --tail --app softlyplease-appserver

# Specific dyno logs
heroku logs --dyno web.1 --app softlyplease-appserver

# Filter by source
heroku logs --source app --app softlyplease-appserver

# Search logs
heroku logs --grep "Error" --app softlyplease-appserver
```

### **10.2 Azure VM Logs**
```powershell
# Windows Event Viewer
eventvwr.msc

# Rhino Compute logs (if configured)
Get-EventLog -LogName Application -Source "RhinoCompute"

# Service status monitoring
Get-Service RhinoCompute | Select-Object Status, StartTime

# Network monitoring
netstat -ano | findstr :6500
```

### **10.3 Performance Metrics**
```bash
# Heroku metrics
heroku metrics --app softlyplease-appserver
heroku metrics web --app softlyplease-appserver

# Memory usage
heroku ps --app softlyplease-appserver

# Response time monitoring
curl -o /dev/null -s -w "%{time_total}\n" \
  https://softlyplease-appserver.herokuapp.com/
```

### **10.4 Alert Configuration**
```bash
# Set up email alerts for Heroku
heroku addons:create monitoring --app softlyplease-appserver

# Configure alerts for:
# - Response time > 5 seconds
# - Error rate > 5%
# - Memory usage > 80%
# - Dyno crashes
```

---

## **11. SCALING & PERFORMANCE**

### **11.1 Heroku Dynos**
```bash
# Scale web dynos
heroku ps:scale web=3 --app softlyplease-appserver

# Check current scaling
heroku ps --app softlyplease-appserver

# Scale based on load
heroku ps:scale web=1:Standard-2X --app softlyplease-appserver
```

### **11.2 Azure VM Sizing**
**Current VM Specs**:
- **Size**: Standard (adjust based on load)
- **CPU**: Multi-core recommended
- **RAM**: 8GB+ for complex computations
- **Storage**: SSD for faster file access

**Scaling Options**:
```bash
# Azure CLI scaling (if using Azure CLI)
az vm resize --resource-group your-group --name your-vm --size Standard_D4s_v3
```

### **11.3 Caching Strategies**
```javascript
// Current cache configuration in solve.js
const cacheSettings = {
  memcached: {
    ttl: 3600,        // 1 hour default
    beam: 1800,       // 30 minutes
    topoopt: 7200     // 2 hours
  },
  nodeCache: {
    ttl: 3600         // Fallback cache
  }
};
```

### **11.4 Load Balancing**
- **Heroku**: Automatic load balancing across dynos
- **Azure VM**: Single instance (consider multiple VMs for high load)
- **Rate Limiting**: 100 requests/minute per IP
- **Concurrency**: Max 5 concurrent computations

---

## **12. EMERGENCY PROCEDURES**

### **12.1 System Restart**
```bash
# Emergency Heroku restart
heroku ps:restart --app softlyplease-appserver

# Force rebuild
heroku ps:rebuild --app softlyplease-appserver

# Azure VM service restart (run on VM)
Restart-Service RhinoCompute -Force
```

### **12.2 Service Recovery**
```bash
# Check service status
heroku ps --app softlyplease-appserver
Get-Service RhinoCompute  # On Azure VM

# If service is down, restart
heroku ps:scale web=1 --app softlyplease-appserver
Restart-Service RhinoCompute  # On Azure VM
```

### **12.3 Data Backup**
```bash
# Backup Heroku configuration
heroku config --app softlyplease-appserver > heroku-config-backup.txt

# Backup source code
git tag emergency-backup-$(date +%Y%m%d-%H%M%S)
git push origin --tags
```

### **12.4 Incident Response**
```bash
# 1. Check system status
heroku logs --tail --app softlyplease-appserver &
curl -s https://softlyplease-appserver.herokuapp.com/
curl -s http://4.248.252.92:6500/version

# 2. Identify issue
heroku metrics --app softlyplease-appserver
Get-Service RhinoCompute  # On Azure VM

# 3. Implement fix
heroku ps:restart --app softlyplease-appserver
# OR
Restart-Service RhinoCompute

# 4. Verify fix
curl -s "https://softlyplease-appserver.herokuapp.com/?format=json"
```

---

## **📞 QUICK REFERENCE COMMANDS**

### **Most Used Commands**:
```bash
# Status checks
heroku ps --app softlyplease-appserver
curl https://softlyplease-appserver.herokuapp.com/
curl http://4.248.252.92:6500/version

# Logs
heroku logs --tail --app softlyplease-appserver

# Deploy
git add . && git commit -m "Update" && git push heroku main

# Restart
heroku ps:restart --app softlyplease-appserver
Restart-Service RhinoCompute  # On Azure VM
```

### **Emergency Commands**:
```bash
# Full system restart
heroku ps:restart --app softlyplease-appserver
ssh azure-vm "Restart-Service RhinoCompute"

# Force redeploy
git push heroku main --force

# Clear caches
heroku run node -e "cache.flushAll()" --app softlyplease-appserver
```

**This guide contains everything the backend agent needs to manage, deploy, debug, and maintain the softlyplease.com system. Keep it updated as the system evolves.**

**🚀 The system is currently OPERATIONAL and serving all 14 Grasshopper definitions successfully!**
