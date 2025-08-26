# SOFTLYPLEASE.COM - DUAL NODE.JS ARCHITECTURE

## 🎯 CORRECT ARCHITECTURE

This repository runs **TWO Node.js servers**:

### 1. 🖥️ AZURE VM Node.js AppServer (Primary)
- **URL**: `https://softlyplease.com`
- **Port**: 80
- **Purpose**: Main website serving
- **Location**: Your Windows Azure VM
- **Status**: Should be running via Windows service

### 2. ☁️ HEROKU Node.js AppServer (Backup)
- **URL**: `https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/`
- **Port**: Dynamic (assigned by Heroku)
- **Purpose**: Redundant backup server
- **Location**: Heroku cloud
- **Status**: Deployed from this repo

## 🔧 SERVICES THAT SHOULD BE RUNNING

### On Azure VM (Windows Server):
```powershell
# These Windows services should be running:
Get-Service SoftlyPleaseAppServer  # Node.js server (port 80)
Get-Service "Rhino.Compute"        # .NET compute engine (port 6500)
```

### On Heroku:
```bash
# Node.js server should be auto-started by Heroku
# Accessible at: https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/
```

## 🚀 DEPLOYMENT

### Local Testing:
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### Heroku Deployment:
```bash
heroku create softlyplease-appserver
git push heroku main
```

### Azure VM Setup:
```powershell
# Install as Windows service
# (Use the existing setup scripts in your VM)
```

## 🧪 TESTING

### Main Domain (Azure VM):
```bash
curl https://softlyplease.com/version          # Should return JSON
curl "https://softlyplease.com/?format=json"   # Should return JSON
curl https://softlyplease.com/BranchNodeRnd.gh # Should return file
```

### Heroku Backup:
```bash
curl https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/version
```

### Rhino Compute:
```bash
curl http://4.248.252.92:6500/version           # Should return JSON
```

## 🔧 TROUBLESHOOTING

### If Azure VM Node.js not working:
```powershell
# Check service status
Get-Service SoftlyPleaseAppServer

# Restart service
Restart-Service SoftlyPleaseAppServer

# Check logs
# Look in Windows Event Viewer or service logs
```

### If Heroku not working:
```bash
# Check Heroku logs
heroku logs --tail --app softlyplease-appserver

# Redeploy
git push heroku main
```

### If Rhino Compute not working:
```powershell
# Check service
Get-Service "Rhino.Compute"

# Restart service
Restart-Service "Rhino.Compute"
```

## 📊 EXPECTED STATUS

| Service | Location | Port | Status |
|---------|----------|------|--------|
| Node.js AppServer | Azure VM | 80 | ✅ Running |
| Rhino Compute | Azure VM | 6500 | ✅ Running |
| Node.js AppServer | Heroku | Dynamic | ✅ Running |

## 🎯 ARCHITECTURE OVERVIEW

```
Internet
    ↓
[softlyplease.com] → Azure VM (Node.js port 80)
    ↓
[Load Balancer] → Rhino Compute (port 6500)
    ↓
[Grasshopper] → Geometry processing

[Backup] → Heroku Node.js (redundant)
```

This dual Node.js architecture provides redundancy and ensures softlyplease.com always works.
