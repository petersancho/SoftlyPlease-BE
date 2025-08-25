# 🏗️ Complete Rhino Compute Backend Setup Guide

## Overview
This guide provides comprehensive setup instructions for deploying Rhino Compute on Azure VM with proper integration to the SoftlyPlease AppServer.

## 📋 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Clients   │ -> │  Heroku AppServer│ -> │ Azure VM (R.C.) │
│                 │    │  (Node.js/Express)│    │   (C#/ASP.NET)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                        │                        │
       │                        │                        │
   softlyplease.com      RHINO_COMPUTE_URL      rhino.geometry
   www.softlyplease.com      = http://4.248.252.92/     REST API
```

## 🚀 Phase 1: Azure VM Setup

### Prerequisites
- Azure VM running Windows Server
- RDP access to VM (port 3389 open)
- Administrator privileges

### Step 1: Install Rhino 8
```powershell
# Download and install Rhino 8 for Windows
# URL: https://www.rhino3d.com/download/
# Install with default settings
```

### Step 2: Install Rhino Compute
```powershell
# Download Rhino Compute
# URL: https://www.rhino3d.com/compute

# Install following the official guide:
# https://developer.rhino3d.com/guides/compute/development/
```

### Step 3: Configure Environment Variables
```powershell
# Set these environment variables (PowerShell as Administrator)

# Allow external connections
$env:ASPNETCORE_URLS = "http://*:80"

# Set compute URL for self-reference
$env:RHINO_COMPUTE_URL = "http://4.248.252.92/"

# Set API key for client authorization
$env:RHINO_COMPUTE_API_KEY = "p2robot-13a6-48f3-b24e-2025computeX"

# Make permanent (optional)
[Environment]::SetEnvironmentVariable("ASPNETCORE_URLS", "http://*:80", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URL", "http://4.248.252.92/", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_API_KEY", "p2robot-13a6-48f3-b24e-2025computeX", "Machine")
```

### Step 4: Start Rhino Compute Service
```powershell
# Check if service exists
Get-Service "*rhino*" -ErrorAction SilentlyContinue

# Start the service
Start-Service "Rhino.Compute"

# Alternative: Run manually for testing
& "C:\Program Files\Rhino 8\rhino.compute.exe" --urls "http://*:80"
```

### Step 5: Verify Installation
```powershell
# Check service status
Get-Service "Rhino.Compute" | Select-Object Status, StartType

# Check if process is running
Get-Process "*rhino*" -ErrorAction SilentlyContinue

# Check listening ports
netstat -ano | findstr ":80"
```

## 🎯 Phase 2: Grasshopper Definition Standards

### Input/Output Naming Convention

**Inputs**: Use `RH_in:` prefix
```
RH_in:brep_input     # For Brep geometry
RH_in:curve_input    # For Curve geometry
RH_in:number_input   # For Number values
RH_in:text_input     # For Text values
```

**Outputs**: Use `RH_out:` prefix
```
RH_out:mesh_output   # For Mesh results
RH_out:brep_output   # For Brep results
RH_out:points_output # For Point results
```

### Example Grasshopper Definition Structure

```
┌─────────────────────────────────────────────┐
│                  Inputs                    │
│  ┌─────────────────────────────────────┐   │
│  │ RH_in:brep_input (Brep Parameter)  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                Processing                   │
│  ┌─────────────────────────────────────┐   │
│  │     Your Grasshopper Components     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                  Outputs                   │
│  ┌─────────────────────────────────────┐   │
│  │ RH_out:mesh_output (Mesh Parameter)│   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Base64 Encoding for Geometry
- All geometry data must be base64 encoded
- Use the Adjacent Payload System for binary data
- Example: `brep_data_base64_string`

## 🔧 Phase 3: Heroku AppServer Configuration

### Update Environment Variables
```bash
# Connect AppServer to Azure VM
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92/

# Set API key (must match Azure VM)
heroku config:set RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX

# Enable production mode
heroku config:set NODE_ENV=production
```

### Current AppServer Configuration
```javascript
// src/app.js - Already configured
const RHINO_COMPUTE_URL = process.env.RHINO_COMPUTE_URL ||
                         'http://4.248.252.92/';  // Your Azure VM
const RHINO_COMPUTE_KEY = process.env.RHINO_COMPUTE_KEY ||
                         'p2robot-13a6-48f3-b24e-2025computeX';
```

## 🧪 Phase 4: Testing Framework

### Automated Testing Script
```bash
#!/bin/bash
# test-endpoints.sh

echo "🧪 Testing SoftlyPlease Compute System"
echo "======================================"

# Test 1: Azure VM Connectivity
echo "1. Testing Azure VM (4.248.252.92)..."
curl -s -w "%{http_code}" http://4.248.252.92/ -o /dev/null
echo ""

# Test 2: Rhino Compute Version
echo "2. Testing Rhino Compute version..."
curl -s http://4.248.252.92/version
echo ""

# Test 3: AppServer Root Endpoint
echo "3. Testing AppServer definitions..."
curl -s https://softlyplease-appserver.herokuapp.com/
echo ""

# Test 4: Definition Inputs/Outputs
echo "4. Testing definition analysis..."
curl -s "https://softlyplease-appserver.herokuapp.com/delaunay.gh"
echo ""

# Test 5: Solve Endpoint (GET)
echo "5. Testing solve endpoint (GET)..."
curl -s "https://softlyplease-appserver.herokuapp.com/solve/delaunay.gh?RH_in:points=[[0,0,0],[1,0,0],[0,1,0],[1,1,0]]"
echo ""

echo "✅ Testing complete!"
```

### Manual Testing Commands

```bash
# Test Azure VM basic connectivity
curl -v http://4.248.252.92/

# Test Rhino Compute IO endpoint
curl -X POST http://4.248.252.92/io \
  -H "Content-Type: application/json" \
  -d '{"pointer":"test"}'

# Test AppServer definition list
curl https://softlyplease-appserver.herokuapp.com/

# Test specific definition analysis
curl "https://softlyplease-appserver.herokuapp.com/delaunay.gh"

# Test solving with POST (base64 geometry)
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "delaunay.gh",
    "inputs": {
      "RH_in:points": [[0,0,0],[1,0,0],[0,1,0],[1,1,0]]
    }
  }'
```

## 📊 Phase 5: Performance Optimization

### Caching Strategy

1. **Definition Caching**: Rhino Compute caches GH definitions after first load
2. **Browser Caching**: GET requests enable browser/CDN caching
3. **Memcached**: AppServer uses memcached for result caching

### Performance Monitoring
```bash
# Check Heroku dyno performance
heroku ps

# View AppServer logs
heroku logs --tail

# Monitor memcached (if configured)
heroku redis:info  # If using Heroku Redis
```

## 🔐 Phase 6: Security Configuration

### API Key Security
- Generate strong API keys for production
- Rotate keys regularly
- Use different keys for different environments

### Network Security
```powershell
# Configure Windows Firewall (if needed)
New-NetFirewallRule -DisplayName "Rhino Compute HTTP" `
  -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Azure NSG rules (already configured)
# - Port 80: Allow HTTP
# - Port 443: Allow HTTPS (future)
# - Port 3389: RDP (admin only)
```

## 🐳 Phase 7: Local Development

### Docker Development Setup
```bash
# Since Rhino Compute requires Windows, use Docker for AppServer dev

cd /Users/petersancho/compute-sp

# Build AppServer container
docker build -t softlyplease-compute .

# Run with Azure VM connection
docker run -p 3000:3000 \
  -e RHINO_COMPUTE_URL=http://4.248.252.92/ \
  -e RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX \
  softlyplease-compute

# Test local development
curl http://localhost:3000/
```

## 📋 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all Grasshopper definitions |
| GET | `/:definition.gh` | Get definition inputs/outputs |
| POST | `/solve` | Solve definition (body parameters) |
| GET | `/solve/:definition.gh?params` | Solve definition (query parameters) |
| HEAD | `/solve/:definition.gh?params` | Check solvability |
| GET | `/version` | System version information |

### Data Formats

**Geometry Input**: Base64 encoded binary data
```json
{
  "definition": "my-definition.gh",
  "inputs": {
    "RH_in:brep_data": ["base64-encoded-brep-string"],
    "RH_in:number_param": [42.0]
  }
}
```

**Results**: JSON with computed outputs
```json
{
  "values": [
    {
      "type": "Mesh",
      "data": "base64-encoded-mesh-data"
    }
  ]
}
```

## 🔧 Troubleshooting

### Common Issues

**Issue**: 404 on `/io` endpoint
```
Solution: Rhino Compute service not running
Action: Start-Service "Rhino.Compute"
```

**Issue**: Connection timeout
```
Solution: Check Azure VM firewall/NSG rules
Action: Verify port 80 is open
```

**Issue**: Definition not found
```
Solution: Check file exists in src/files/
Action: Verify .gh file is in AppServer directory
```

**Issue**: API key authentication failed
```
Solution: Mismatched API keys
Action: Ensure Heroku and Azure VM keys match
```

## 📞 Support and Resources

- **Rhino Compute Documentation**: https://developer.rhino3d.com/guides/compute/
- **Heroku Node.js**: https://devcenter.heroku.com/articles/nodejs-support
- **Grasshopper REST API**: https://developer.rhino3d.com/guides/rhinocommon/what-is-rhinocommon/

---

## ✅ Quick Checklist

- [ ] Azure VM running Windows Server
- [ ] Rhino 8 installed on VM
- [ ] Rhino Compute installed and running
- [ ] Environment variables configured
- [ ] API key set and matching
- [ ] Port 80 open in Azure NSG
- [ ] Heroku AppServer configured
- [ ] Grasshopper definitions created with RH_in:/RH_out: prefixes
- [ ] Base64 encoding implemented for geometry
- [ ] Caching configured (memcached/Redis)
- [ ] Testing framework validated
- [ ] Domain (softlyplease.com) pointing to Heroku

**🎉 Your Rhino Compute backend is ready for production!**
