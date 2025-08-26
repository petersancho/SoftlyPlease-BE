# 🛠️ Rhino Compute Backend Setup Guide

## Azure VM Configuration
- **IP Address:** 4.248.252.92
- **OS:** Windows Server (assumed)
- **Purpose:** Run Rhino Compute server for geometry processing

## Phase 1: Install and Configure Rhino Compute on Azure VM

### Step 1: RDP into your Azure VM
```bash
# Use Remote Desktop Connection
# Host: 4.248.252.92
# Username: [your-admin-username]
# Password: [your-password]
```

### Step 2: Install Prerequisites
```powershell
# Run PowerShell as Administrator
Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature -name Web-Asp-Net45
```

### Step 3: Install Rhino 8
- Download from: https://www.rhino3d.com/download/
- Install with default settings
- **Note:** Requires valid Rhino 8 license

### Step 4: Install Rhino Compute
```powershell
# Download and install Rhino Compute
# From: https://www.rhino3d.com/compute

# Verify installation
Get-ChildItem "C:\Program Files\Rhino 8" -Filter "*compute*"
```

### Step 5: Configure Environment Variables
```powershell
# Run in PowerShell as Administrator
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URL", "http://4.248.252.92/", "Machine")
[Environment]::SetEnvironmentVariable("ASPNETCORE_URLS", "http://*:80", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_API_KEY", "p2robot-13a6-48f3-b24e-2025computeX", "Machine")

# Restart PowerShell to pick up environment variables
```

### Step 6: Configure Windows Firewall
```powershell
# Allow HTTP traffic
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow Rhino Compute ports if needed
New-NetFirewallRule -DisplayName "Rhino Compute" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow
```

### Step 7: Start Rhino Compute Service
```powershell
# Navigate to Rhino Compute directory
cd "C:\Program Files\Rhino 8"

# Start Rhino Compute (run as Administrator)
.\rhino.compute.exe --urls "http://*:80"

# For production, install as Windows service
New-Service -Name "Rhino.Compute" -BinaryPathName '"C:\Program Files\Rhino 8\rhino.compute.exe" --urls "http://*:80"' -DisplayName "Rhino Compute Server" -StartupType Automatic
Start-Service -Name "Rhino.Compute"
```

## Phase 2: Test Rhino Compute Server

### Step 8: Test Basic Connectivity
```powershell
# From your local machine (or Azure VM)
Invoke-WebRequest -Uri "http://4.248.252.92/" -Method GET
```

### Step 9: Test IO Endpoint
```powershell
# Test the IO endpoint
curl -X POST http://4.248.252.92/io \
  -H "Content-Type: application/json" \
  -d '{"pointer":"test"}'
```

### Step 10: Test Version Endpoint
```powershell
curl http://4.248.252.92/version
```

## Phase 3: Configure Heroku AppServer

### Step 11: Update Heroku Environment Variables
```bash
# Set the compute URL to point to your Azure VM
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92/

# Set the API key (must match VM configuration)
heroku config:set RHINO_COMPUTE_API_KEY=p2robot-13a6-48f3-b24e-2025computeX

# Set production environment
heroku config:set NODE_ENV=production
```

### Step 12: Deploy Updated AppServer
```bash
# Commit your changes
git add .
git commit -m "Configure Azure VM connection"
git push heroku main
```

## Phase 4: Create Grasshopper Definitions

### Step 13: Grasshopper Definition Standards

For each Grasshopper definition (`.gh` file):

#### **Inputs**: Use grouped parameters with `RH_in:` prefix
- `RH_in:brep_input` → Brep geometry input
- `RH_in:curve_input` → Curve geometry input
- `RH_in:number_input` → Number input
- `RH_in:point_input` → Point input

#### **Outputs**: Use `RH_out:` prefix
- `RH_out:mesh_output` → Mesh geometry output
- `RH_out:curve_output` → Curve geometry output
- `RH_out:brep_output` → Brep geometry output

### Step 14: Place Definitions in AppServer

Copy your `.gh` files to:
```
compute.rhino3d.appserver/src/files/
```

### Step 15: Base64 Encoding for Binary Data

When sending geometry data to solve endpoints:

```javascript
// Convert binary geometry data to base64
const geometryData = yourRhinoGeometryObject;
const base64Data = Buffer.from(geometryData).toString('base64');

// Send in solve request
{
  "definition": "your-definition.gh",
  "inputs": {
    "RH_in:brep_input": [base64Data]
  }
}
```

## Phase 5: Test Full System

### Step 16: Test AppServer Endpoints

```bash
# Test root endpoint (lists available definitions)
curl https://softlyplease-appserver.herokuapp.com/

# Test specific definition (shows inputs/outputs)
curl "https://softlyplease-appserver.herokuapp.com/your-definition-name.gh"

# Test solve endpoint (POST with JSON)
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "your-definition-name.gh",
    "inputs": {
      "RH_in:number_input": [42],
      "RH_in:brep_input": ["base64-encoded-brep-data"]
    }
  }'

# Test solve endpoint (GET with query parameters)
curl "https://softlyplease-appserver.herokuapp.com/solve/your-definition-name.gh?RH_in:number_input=42"
```

### Step 17: Test Definition Caching

```bash
# First request downloads and caches the definition
curl "https://softlyplease-appserver.herokuapp.com/your-definition-name.gh"

# Subsequent requests use cached version (should be faster)
curl "https://softlyplease-appserver.herokuapp.com/your-definition-name.gh"
```

## Phase 6: Development Workflow

### Step 18: Local Development Setup

Since you can't run Rhino Compute on Mac, use this workflow:

```bash
# Clone repository
git clone https://github.com/petersancho/SoftlyPlease-BE.git
cd SoftlyPlease-BE/compute.rhino3d.appserver

# Install dependencies
npm install

# Set environment for local development
export RHINO_COMPUTE_URL=http://4.248.252.92/
export NODE_ENV=development

# Start development server
npm start
```

### Step 19: Docker Development (Alternative)

```bash
# Build Docker image
docker build -t softlyplease-compute .

# Run with Azure VM connection
docker run -p 3000:3000 \
  -e RHINO_COMPUTE_URL=http://4.248.252.92/ \
  -e NODE_ENV=development \
  softlyplease-compute
```

## Phase 7: Monitoring and Troubleshooting

### Step 20: Monitor Azure VM

```powershell
# Check Rhino Compute service status
Get-Service "Rhino.Compute"

# Check running processes
Get-Process "*rhino*" -ErrorAction SilentlyContinue

# Check network connections
netstat -an | findstr :80
```

### Step 21: Monitor AppServer Logs

```bash
# Heroku logs
heroku logs --tail

# Check for connection errors
heroku logs | grep "RHINO_COMPUTE_URL"
heroku logs | grep "connection"
```

### Step 22: Test Connectivity

```bash
# Test Azure VM from local machine
ping 4.248.252.92

# Test HTTP connectivity
curl -v http://4.248.252.92/

# Test with API key
curl -H "Authorization: Bearer p2robot-13a6-48f3-b24e-2025computeX" \
     http://4.248.252.92/version
```

## Key Architecture Points

### **Adjacent Payload System**
- Grasshopper definitions: Base64 encoded binaries
- Geometry data: Base64 encoded in requests
- Efficient for HTTP transport

### **Caching Strategy**
- Definitions cached on first request
- Browser/CDN caching via GET endpoints
- Memcached for server-side caching

### **Security Model**
- API key authentication
- Environment variable configuration
- Network-level security via Azure

### **Port Configuration**
- Azure VM: HTTP on port 80
- AppServer: Port 3000 (dev) / 80 (prod)
- Firewall rules configured

## Common Issues & Solutions

### **Connection Refused**
- Check if Rhino Compute is running on Azure VM
- Verify firewall rules allow port 80
- Confirm Azure VM public IP is correct

### **Definition Not Found**
- Ensure `.gh` files are in `src/files/` directory
- Check file permissions
- Verify definition names in requests

### **Authentication Failed**
- Match API keys between VM and AppServer
- Check environment variable spelling
- Verify API key format

---

## 🚀 **Quick Start Checklist**

- [ ] Install Rhino 8 on Azure VM
- [ ] Install and configure Rhino Compute
- [ ] Set environment variables
- [ ] Configure Windows Firewall
- [ ] Start Rhino Compute service
- [ ] Update Heroku environment variables
- [ ] Create Grasshopper definitions with RH_in:/RH_out: prefixes
- [ ] Test endpoints with curl
- [ ] Verify caching works
- [ ] Set up monitoring

**Your system will be ready once Rhino Compute is running on the Azure VM!** 🎯
