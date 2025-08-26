# SoftlyPlease.com - Rhino Compute System

## 📋 Repository Overview

This repository contains the complete Rhino Compute system for softlyplease.com, including the server infrastructure, API bridge, and comprehensive documentation.

## 📁 Repository Structure

```
├── docs/                          # 📚 Documentation
│   ├── guides/                    # Setup and operation guides
│   │   ├── initial-setup.md       # Complete setup instructions
│   │   ├── system-architecture.md # Technical architecture
│   │   ├── quick-reference.md     # Essential commands
│   │   └── RHINO-COMPUTE-MASTER-GUIDE.md # Ultimate guide
│   ├── operations/                # Maintenance & troubleshooting
│   │   ├── troubleshooting.md     # Common issues & solutions
│   │   └── backup.md             # Backup & recovery procedures
│   └── reference/                # Technical reference docs

├── frontend/                      # 🌐 Website frontend
│   ├── index.html                # Advanced 3D interface
│   └── softlyplease-interface.html # Simple testing interface

├── compute.rhino3d/              # 🦏 Rhino Compute Server
│   ├── src/                      # Source code
│   ├── script/                   # Installation & management scripts
│   └── tools/                    # Development tools

└── compute.rhino3d.appserver/    # 🚀 Node.js API Server
    ├── src/                      # Express.js application
    ├── docs/                     # Original documentation
    └── deploy-to-heroku.ps1     # Heroku deployment script
```

## 🏗️ System Architecture

```
softlyplease.com (Frontend)
        ↓
  AppServer on Heroku (Node.js)
        ↓
Rhino Compute on Azure VM (Windows)
        ↓
    Rhino + Grasshopper
```

## 🚀 Quick Start

### 1. Initial Setup
Follow the [Initial Setup Guide](docs/guides/initial-setup.md) for complete installation.

### 2. Daily Operations
Use the [Quick Reference Guide](docs/guides/quick-reference.md) for common tasks.

### 3. Troubleshooting
Check the [Troubleshooting Guide](docs/operations/troubleshooting.md) for common issues.

## 📊 Current Configuration

- **Rhino Compute Server**: `http://4.248.252.92:6500`
- **AppServer**: `https://softlyplease-appserver.herokuapp.com`
- **API Key**: `softlyplease-secure-key-2024`
- **Authentication**: `RhinoComputeKey` header

## 🔧 Key Components

### 🦏 Rhino Compute Server (Azure VM)
- **Location**: `compute.rhino3d/`
- **Purpose**: Headless Rhino execution with Grasshopper
- **Port**: 6500 (API), 5000 (compute.geometry)
- **Setup**: [Installation Guide](docs/guides/initial-setup.md#step-3-rhino-compute-installation)

### 🚀 AppServer (Heroku)
- **Location**: `compute.rhino3d.appserver/`
- **Purpose**: Node.js API bridge between frontend and Rhino Compute
- **Features**: Caching, error handling, request routing
- **Setup**: [Heroku Deployment](docs/guides/initial-setup.md#step-5-heroku-deployment)

### 🌐 Frontend (Website)
- **Location**: `frontend/`
- **Purpose**: User interface for interacting with definitions
- **Files**: `index.html` (3D interface), `softlyplease-interface.html` (simple interface)

## 📚 Available Documentation

### Setup & Installation
- **[RHINO-COMPUTE-MASTER-GUIDE.md](docs/guides/RHINO-COMPUTE-MASTER-GUIDE.md)** - The ultimate 2,000+ line comprehensive guide
- **[Initial Setup Guide](docs/guides/initial-setup.md)** - Step-by-step setup instructions
- **[System Architecture](docs/guides/system-architecture.md)** - Technical overview and components

### Operations & Maintenance
- **[Quick Reference](docs/guides/quick-reference.md)** - Essential commands and procedures
- **[Troubleshooting Guide](docs/operations/troubleshooting.md)** - Common issues and solutions
- **[Backup Procedures](docs/operations/backup.md)** - Data protection and recovery

## 🦗 Grasshopper Definitions

The system includes 14 pre-configured Grasshopper definitions:

- `beam_mod.gh` - Beam modification
- `Bending_gridshell.gh` - Grid shell bending analysis
- `BranchNodeRnd.gh` - Branch node randomization
- `brep_union.gh` - BREP union operations
- `delaunay.gh` - Delaunay triangulation
- `docString.gh` - Documentation string processing
- `dresser3.gh` - Dresser design
- `metaballTable.gh` - Metaball table generation
- `QuadPanelAperture.gh` - Quad panel with apertures
- `rnd_lattice.gh` - Random lattice generation
- `rnd_node.gh` - Random node placement
- `SampleGHConvertTo3dm.gh` - Convert to 3DM format
- `srf_kmeans.gh` - Surface K-means clustering
- `value_list.gh` - Value list processing

## 🚨 Emergency Procedures

### System Down
```bash
# Check status
curl -s https://softlyplease-appserver.herokuapp.com/health

# Restart services
heroku restart --app softlyplease-appserver
# (VM) Restart-Service rhino.compute
```

### API Key Issues
```bash
# Rotate API key
NEW_KEY="softlyplease-secure-key-$(date +%s)"
heroku config:set RHINO_COMPUTE_KEY="$NEW_KEY"
# Update Azure VM environment variable
```

### Recovery
See [Backup Procedures](docs/operations/backup.md) for complete recovery instructions.

## 🔄 Regular Maintenance

### Daily
- [ ] Check system health endpoints
- [ ] Review error logs
- [ ] Commit code changes

### Weekly
- [ ] Create Azure VM snapshot
- [ ] Test backup restoration
- [ ] Update dependencies

### Monthly
- [ ] Review costs and usage
- [ ] Update documentation
- [ ] Test disaster recovery

## 📞 Support Resources

- **Heroku Support**: [help.heroku.com](https://help.heroku.com)
- **Azure Support**: [portal.azure.com](https://portal.azure.com) → Help + Support
- **Rhino Support**: [discourse.mcneel.com](https://discourse.mcneel.com)

## 📋 Setup Checklist

- [ ] **Azure VM** created and configured
- [ ] **Windows Server** installed and updated
- [ ] **Rhino 7** installed and licensed
- [ ] **Rhino Compute** installed and running
- [ ] **Heroku App** created and configured
- [ ] **AppServer** deployed and connected
- [ ] **Definitions** uploaded and accessible
- [ ] **Frontend** integrated and tested
- [ ] **Monitoring** set up and configured
- [ ] **Backups** automated and tested

## 🎯 Next Steps

1. **Review** the [Master Guide](docs/guides/RHINO-COMPUTE-MASTER-GUIDE.md) for complete understanding
2. **Follow** the [Initial Setup Guide](docs/guides/initial-setup.md) if setting up from scratch
3. **Use** the [Quick Reference](docs/guides/quick-reference.md) for daily operations
4. **Monitor** using the [Troubleshooting Guide](docs/operations/troubleshooting.md)

---

**Repository Status**: ✅ Organized and Documented
**System Status**: ✅ Operational
**Documentation**: ✅ Comprehensive
**Last Updated**: December 2024

*This repository contains everything needed to run, maintain, and recover the Rhino Compute system for softlyplease.com.*
