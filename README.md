# softlyplease.com - Rhino Compute AppServer

## 📋 Overview

This is the production repository for softlyplease.com's Rhino Compute system. It contains the Node.js AppServer that serves Grasshopper definitions and handles geometry computations.

## 📁 Repository Structure

```
├── config.js                     # 🛠️  Server configuration
├── package.json                  # 📦 Dependencies and scripts
├── Procfile                      # 🚀 Heroku deployment config
├── scripts/                      # 🔧 Management scripts
│   ├── azure/                    # Azure VM setup scripts
│   │   └── azure-vm-setup.ps1    # VM configuration
│   ├── heroku/                   # Heroku deployment
│   │   └── heroku-deploy.sh      # Automated deployment
│   └── deployment-check.sh       # ✅ Deployment verification
├── src/                          # 🚀 Express.js application
│   ├── app.js                    # Main application
│   ├── bin/www                   # Server startup
│   ├── routes/                   # API endpoints
│   ├── views/                    # Handlebars templates
│   ├── examples/                 # Interactive examples
│   ├── files/                    # Grasshopper definitions (.gh)
│   ├── definitions.js            # Definition management
│   └── version.js                # Version info
├── docs/                         # 📚 Documentation
│   ├── setup/
│   │   ├── QUICK-START.md
│   │   └── SETUP-GUIDE.md
│   └── heroku.md                 # Heroku deployment guide
└── compute.rhino3d/              # 🦏 Core compute engine
```

## 🏗️ System Architecture

```
softlyplease.com (Main Domain)
        ↓
  AppServer on Heroku (Node.js)
        ↓
Rhino Compute on Azure VM (Windows)
        ↓
    Rhino + Grasshopper
```

## 🚀 Quick Start

### 1. Local Development
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### 2. Production Deployment
```bash
# Deploy to Heroku
git push heroku main

# Verify deployment
./scripts/deployment-check.sh
```

### 3. Azure VM Setup
```powershell
# Run on Azure VM as Administrator
./scripts/azure/azure-vm-setup.ps1
```

## 📊 Current Configuration

- **Rhino Compute Server**: `http://4.248.252.92:6500`
- **Heroku AppServer**: `https://softlyplease-appserver.herokuapp.com`
- **Main Domain**: `https://softlyplease.com`
- **API Key**: `p2robot-13a6-48f3-b24e-2025computeX`

## 🔧 Key Components

### 🦏 Rhino Compute Server (Azure VM)
- **IP**: `4.248.252.92`
- **Port**: 6500 (API)
- **Service**: Windows service running Rhino with Grasshopper
- **Status**: Requires manual restart when down

### 🚀 AppServer (Heroku)
- **URL**: `https://softlyplease-appserver.herokuapp.com`
- **Technology**: Node.js Express with Handlebars
- **Features**: Caching, API routing, definition serving
- **Status**: ✅ Working (confirmed)

### 🌐 Main Domain
- **URL**: `https://softlyplease.com`
- **DNS**: Points to Azure VM
- **Issue**: Node.js server not starting properly

## 🦗 Grasshopper Definitions

Available definitions in `src/files/`:
- `beam_mod.gh`, `Bending_gridshell.gh`, `BranchNodeRnd.gh`
- `brep_union.gh`, `delaunay.gh`, `docString.gh`, `dresser3.gh`
- `metaballTable.gh`, `QuadPanelAperture.gh`, `rnd_lattice.gh`
- `rnd_node.gh`, `SampleGHConvertTo3dm.gh`, `srf_kmeans.gh`, `value_list.gh`

## 🚨 Current Issues & Solutions

### Main Problem: Azure VM Node.js Server Not Starting
**Symptom**: `softlyplease.com` returns HTML instead of JSON API
**Solution**: Restart Node.js service on Azure VM

### Quick Fix Commands:
```bash
# 1. Check Heroku (should work)
curl -s https://softlyplease-appserver.herokuapp.com/version

# 2. Check main domain (currently broken)
curl -s https://softlyplease.com/version

# 3. Fix: Restart Azure VM services (run as Administrator)
# Connect to Azure VM and run:
Restart-Service SoftlyPleaseAppServer
Restart-Service RhinoCompute
```

## 📋 Deployment Verification

Run the automated check script:
```bash
./scripts/deployment-check.sh
```

## 📚 Documentation

- `docs/setup/QUICK-START.md` - Quick setup guide
- `docs/setup/SETUP-GUIDE.md` - Detailed setup
- `docs/heroku.md` - Heroku deployment guide

---

**Repository Status**: ✅ Cleaned and Organized
**Last Cleanup**: $(date)
**Ready for Production**: ✅ Yes

*Repository cleaned up and ready for deployment. Main issue is Azure VM service restart needed.*
