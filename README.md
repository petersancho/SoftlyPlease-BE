# softlyplease.com - Rhino Compute AppServer

## 📋 Overview

This is the production repository for softlyplease.com's Rhino Compute system. It contains the Node.js AppServer that serves Grasshopper definitions and handles geometry computations.

## 📁 Repository Structure

```
compute-sp/
├── 📄 README.md                          # 📖 Main project documentation
├── 📄 Dockerfile                         # 🐳 Container configuration
├── 📄 Procfile                           # 🚀 Heroku deployment config
├── 📄 package.json                       # 📦 Dependencies and scripts
├── 📄 package-lock.json                  # 🔒 Dependency lock file
│
├── 📁 config/                            # ⚙️ Configuration files
│   └── config.js                         # 🛠️ Server configuration
│
├── 📁 docs/                              # 📚 Documentation & guides
│   ├── 📄 FOLDER_ORGANIZATION_README.md  # 📂 Organization guide
│   ├── 📄 QUICK-START.md                 # 🚀 Quick start guide
│   ├── 📄 README-SOFTLYPLEASE.md         # 📖 Project overview
│   ├── 📄 SETUP-GUIDE.md                 # 🛠️ Setup instructions
│   ├── 📄 ENTERPRISE_TEST_REPORT.md      # 📊 Test reports
│   └── 📁 guides/                        # 📋 Specialized guides
│       ├── 📄 BACKEND_AGENT_MASTER_GUIDE.md    # 🤖 Agent-focused guide
│       ├── 📄 be_fe_functions.md               # 🔧 Backend/Frontend functions
│       └── 📄 fe_functions.md                  # 🎨 Frontend functions
│
├── 📁 scripts/                           # 🔧 Management & automation scripts
│   ├── 📁 azure/                         # 🖥️ Azure VM management
│   │   ├── 📄 IDIO.T-PROOF-FIX.txt       # 🛠️ Service restart guide
│   │   ├── 📄 LOCAL-COMPUTER-FAIL.txt    # ⚠️ Warning for wrong computer
│   │   ├── 📄 RESTART-NODEJS-FIX.ps1     # 🔄 Node.js service restart
│   │   ├── 📄 SCREENSHOT-GUIDE.txt       # 📸 Visual guide
│   │   ├── 📄 SIMPLE-FIX.txt             # 🔧 Simple fix instructions
│   │   └── 📄 install-nodejs-service.ps1 # ⚙️ Service installation
│   ├── 📁 deployment/                    # 🚀 Deployment scripts
│   │   ├── 📄 deploy-backend-to-heroku.ps1    # ☁️ Heroku deployment
│   │   ├── 📄 deploy-clean.ps1           # 🧹 Clean deployment
│   │   ├── 📄 deploy-complete-softlyplease-backend.ps1 # 🎯 Complete deployment
│   │   └── 📄 deployment-check.sh        # ✅ Deployment verification
│   ├── 📁 setup/                         # 🛠️ Setup & configuration
│   │   ├── 📄 auto-setup.bat             # ⚡ Automatic setup
│   │   ├── 📄 complete-azure-setup.ps1   # 🖥️ Azure VM setup
│   │   ├── 📄 quick-test.bat             # 🧪 Quick testing
│   │   └── 📄 setup-rhino-compute-server.ps1 # 🦏 Rhino compute setup
│   └── 📁 testing/                       # 🧪 Test suites
│       ├── 📄 BULLETPROOF-TEST-SUITE.sh # 🛡️ Comprehensive testing
│       ├── 📄 END-TO-END-TEST.sh        # 🔄 Full pipeline test
│       ├── 📄 test-full-pipeline.ps1     # 🔧 Full pipeline test (PowerShell)
│       └── 📄 test-pipeline-simple.ps1   # 📝 Simple pipeline test
│
├── 📁 src/                               # 🚀 Main application source
│   ├── 📄 app.js                         # 🌐 Main Express application
│   ├── 📄 definitions.js                 # 📋 Definition management
│   ├── 📄 version.js                     # 🔢 Version information
│   ├── 📁 bin/                           # ⚙️ Server startup
│   │   └── www                           # 🚀 Server entry point
│   ├── 📁 routes/                        # 🛣️ API endpoints
│   │   ├── 📄 index.js                   # 📋 Main routes (/ endpoint)
│   │   ├── 📄 solve.js                   # 🧮 Definition solving logic
│   │   ├── 📄 definition.js              # 📄 Definition metadata
│   │   ├── 📄 template.js                # 🎨 View templates
│   │   └── 📄 version.js                 # ℹ️ Version endpoint
│   ├── 📁 examples/                      # 🎮 Interactive examples
│   │   ├── 📄 index.html                 # 📋 Examples menu
│   │   ├── 📄 dresser3.html              # 🪑 3D dresser example
│   │   ├── 📁 beam/                      # 📐 Beam examples
│   │   ├── 📁 bendy/                     # 🌊 Bendy examples
│   │   ├── 📁 convert/                   # 🔄 Conversion examples
│   │   ├── 📁 delaunay/                  # 📐 Delaunay triangulation
│   │   ├── 📁 docString/                 # 📝 Documentation examples
│   │   ├── 📁 interface/                 # 🎨 Additional interfaces
│   │   ├── 📁 metaballTable/             # 🔮 Metaball table examples
│   │   ├── 📁 multi/                     # 🔄 Multi-definition examples
│   │   ├── 📁 panels/                    # 🏗️ Panel examples
│   │   ├── 📁 spikyThing/                # 🌵 Spiky geometry examples
│   │   ├── 📁 upload/                    # 📤 File upload examples
│   │   ├── 📁 valueList/                 # 📋 Value list examples
│   │   └── 📁 wip/                       # 🚧 Work in progress
│   ├── 📁 files/                         # 🦏 Grasshopper definitions
│   │   ├── 📄 beam_mod.gh                # 📐 Beam modification
│   │   ├── 📄 Bending_gridshell.gh       # 🌊 Grid shell bending
│   │   ├── 📄 BranchNodeRnd.gh           # 🌿 Random branching
│   │   ├── 📄 brep_union.gh              # 🔗 BREP operations
│   │   ├── 📄 delaunay.gh                # 📐 Delaunay triangulation
│   │   ├── 📄 docString.gh               # 📝 Documentation
│   │   ├── 📄 dresser3.gh                # 🪑 3D dresser
│   │   ├── 📄 metaballTable.gh           # 🔮 Metaball table
│   │   ├── 📄 QuadPanelAperture.gh       # 🏗️ Quad panels
│   │   ├── 📄 rnd_lattice.gh             # 🎲 Random lattice
│   │   ├── 📄 rnd_node.gh                # 🎲 Random nodes
│   │   ├── 📄 SampleGHConvertTo3dm.gh    # 🔄 3DM conversion
│   │   ├── 📄 srf_kmeans.gh              # 📊 Surface K-means
│   │   └── 📄 value_list.gh              # 📋 Value lists
│   └── 📁 views/                         # 🎨 Handlebars templates
│       ├── 📄 definition.hbs             # 📄 Definition display
│       ├── 📄 homepage.hbs               # 🏠 Homepage template
│       └── 📄 list.hbs                   # 📋 List template
│
└── 📁 third-party/                       # 🔗 External dependencies
    └── 📁 SoftlyPlease-BE-main/          # 🦏 Original Rhino compute source
        ├── 📁 compute.rhino3d/           # Core compute engine
        └── 📁 compute.rhino3d.appserver/ # Backend server source
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

## 🗂️ Project Organization

This repository follows a logical folder structure to keep everything organized and accessible:

### **📂 Key Locations:**
- **`docs/guides/be_fe_functions.md`** - Complete backend/frontend functions guide
- **`docs/guides/BACKEND_AGENT_MASTER_GUIDE.md`** - Agent-focused deployment guide
- **`src/examples/`** - All interactive examples consolidated in one place
- **`scripts/`** - Organized by purpose (azure/, deployment/, setup/, testing/)
- **`third-party/`** - External dependencies and reference code

### **🎯 Quick Access:**
```bash
# View comprehensive guides
open docs/guides/be_fe_functions.md
open docs/guides/BACKEND_AGENT_MASTER_GUIDE.md

# Access examples
open https://softlyplease-appserver.herokuapp.com/examples/

# Run deployment scripts
./scripts/deployment/deploy-complete-softlyplease-backend.ps1

# Check system status
curl https://softlyplease-appserver.herokuapp.com/version
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

### **📋 Main Guides:**
- **`docs/guides/be_fe_functions.md`** - Complete backend/frontend functions reference
- **`docs/guides/BACKEND_AGENT_MASTER_GUIDE.md`** - Agent deployment and troubleshooting
- **`docs/guides/fe_functions.md`** - Frontend-specific functions guide

### **🛠️ Setup & Configuration:**
- **`docs/QUICK-START.md`** - Quick setup guide
- **`docs/SETUP-GUIDE.md`** - Detailed setup instructions
- **`docs/README-SOFTLYPLEASE.md`** - Project overview and architecture

### **📊 Reports & Organization:**
- **`docs/FOLDER_ORGANIZATION_README.md`** - Project organization guide
- **`docs/ENTERPRISE_TEST_REPORT.md`** - Test reports and results

### **🎯 Quick Access:**
```bash
# Open documentation
open docs/guides/be_fe_functions.md          # Complete functions guide
open docs/guides/BACKEND_AGENT_MASTER_GUIDE.md  # Agent deployment guide
open docs/QUICK-START.md                    # Quick start
open docs/FOLDER_ORGANIZATION_README.md     # Organization guide
```

---

## ✅ **Repository Status**: Cleaned and Organized

**All files preserved and better organized for easier navigation and maintenance!**
**Last Cleanup**: $(date)
**Ready for Production**: ✅ Yes

*Repository cleaned up and ready for deployment. Main issue is Azure VM service restart needed.*
