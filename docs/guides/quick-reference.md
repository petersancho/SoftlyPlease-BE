# Quick Reference Guide

## 🚀 **SoftlyPlease.com Rhino Compute - Quick Reference**

This guide provides essential information and commands for operating and maintaining the Rhino Compute system.

## 📊 **System Status**

### **Current Configuration**
- **Rhino Compute Server**: `http://4.248.252.92:6500`
- **AppServer**: `https://softlyplease-appserver.herokuapp.com`
- **API Key**: `softlyplease-secure-key-2024`
- **Authentication**: `RhinoComputeKey` header

### **System Health Check**
```bash
# Quick health check
curl -s https://softlyplease-appserver.herokuapp.com/ && echo "✅ AppServer OK"
curl -s -H "RhinoComputeKey: softlyplease-secure-key-2024" http://4.248.252.92:6500/version && echo "✅ Rhino Compute OK"
```

## 🔧 **Common Commands**

### **Heroku Management**
```bash
# Check app status
heroku ps --app softlyplease-appserver

# View logs
heroku logs --tail --app softlyplease-appserver

# Restart app
heroku restart --app softlyplease-appserver

# Check config
heroku config --app softlyplease-appserver

# Update config
heroku config:set KEY=value --app softlyplease-appserver
```

### **Azure VM Management**
```powershell
# Check compute services (via RDP)
Get-Service | Where-Object {$_.Name -like "*compute*"}

# Check compute processes
Get-Process | Where-Object {$_.ProcessName -like "*compute*"}

# Restart compute service
Restart-Service rhino.compute

# Check environment variables
Get-ChildItem Env: | Where-Object {$_.Name -like "*RHINO*"}
```

### **Git Repository**
```bash
# Check status
cd compute.rhino3d.appserver
git status

# Commit changes
git add .
git commit -m "Description of changes"
git push origin main

# Deploy to Heroku
git push heroku main

# Create backup
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## 📋 **API Endpoints**

### **AppServer Endpoints**
```bash
# List definitions
GET https://softlyplease-appserver.herokuapp.com/

# Get definition info
GET https://softlyplease-appserver.herokuapp.com/dresser3

# Solve definition
POST https://softlyplease-appserver.herokuapp.com/solve
Content-Type: application/json

{
  "definition": "dresser3",
  "inputs": {
    "RH_IN:height": 3.0,
    "RH_IN:width": 2.0
  }
}
```

### **Rhino Compute Endpoints**
```bash
# Version info
GET http://4.248.252.92:6500/version
RhinoComputeKey: softlyplease-secure-key-2024

# Grasshopper solve
POST http://4.248.252.92:6500/grasshopper
RhinoComputeKey: softlyplease-secure-key-2024
Content-Type: application/json
```

## 🚨 **Emergency Procedures**

### **System Down - Quick Recovery**
```bash
# 1. Check what's down
curl -s https://softlyplease-appserver.herokuapp.com/ || echo "AppServer DOWN"
curl -s -H "RhinoComputeKey: softlyplease-secure-key-2024" http://4.248.252.92:6500/version || echo "Rhino Compute DOWN"

# 2. Restart services
heroku restart --app softlyplease-appserver
# (For VM: RDP and run) Restart-Service rhino.compute

# 3. Check logs
heroku logs --tail --app softlyplease-appserver
# (For VM: Check) Get-Content "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\logs\*.log" -Tail 20
```

### **API Key Lost**
```bash
# Generate new key
NEW_KEY="softlyplease-secure-key-$(date +%s)"

# Update Heroku
heroku config:set RHINO_COMPUTE_KEY="$NEW_KEY" --app softlyplease-appserver

# Update Azure VM (via RDP)
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_KEY", "$NEW_KEY", "Machine")

# Restart services
heroku restart --app softlyplease-appserver
Restart-Service rhino.compute
```

## 💾 **Backup & Recovery**

### **Daily Backup**
```bash
# Export Heroku config
heroku config --app softlyplease-appserver > heroku-config-$(date +%Y%m%d).txt

# Commit and push code
cd compute.rhino3d.appserver
git add .
git commit -m "Daily backup $(date +%Y%m%d)"
git push origin main
```

### **Weekly Backup**
```bash
# Create Azure VM snapshot
# Azure Portal → VM → Disks → Create snapshot

# Test repository clone
git clone https://github.com/your-org/compute.rhino3d.appserver.git test-backup
```

### **Recovery from Scratch**
```bash
# 1. Clone repository
git clone https://github.com/mcneel/compute.rhino3d.appserver.git
cd compute.rhino3d.appserver

# 2. Create Heroku app
heroku create softlyplease-appserver

# 3. Set configuration
heroku config:set RHINO_COMPUTE_URL="http://4.248.252.92:6500/"
heroku config:set RHINO_COMPUTE_KEY="softlyplease-secure-key-2024"
heroku config:set NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. Test
curl https://softlyplease-appserver.herokuapp.com/
```

## 📊 **Monitoring**

### **Key Metrics to Watch**
- **Response Time**: < 5 seconds for API calls
- **Error Rate**: < 1% of requests
- **Heroku Memory**: < 512MB (free tier limit)
- **Azure CPU**: < 80% average

### **Monitoring Commands**
```bash
# Heroku metrics
heroku logs --app softlyplease-appserver --tail

# Heroku processes
heroku ps --app softlyplease-appserver

# Azure VM (via RDP)
Get-Counter '\Processor(_Total)\% Processor Time'
Get-Counter '\Memory\Available MBytes'
```

## 🔧 **Common Issues & Fixes**

| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| 401 Unauthorized | API key invalid | Update `RhinoComputeKey` header |
| 500 Internal Server | Definition error | Check Heroku logs, verify definition exists |
| Slow response | >5 second delay | Enable caching, check VM performance |
| Definition not found | 404 error | Check file exists in `src/files/` |
| VM not responding | Port 6500 unreachable | RDP to VM, restart compute service |

## 📁 **Available Definitions**

Current definitions in `src/files/`:
- `beam_mod.gh` - Beam modification
- `Bending_gridshell.gh` - Grid shell analysis
- `BranchNodeRnd.gh` - Branch node randomization
- `brep_union.gh` - BREP operations
- `delaunay.gh` - Delaunay triangulation
- `docString.gh` - Documentation processing
- `dresser3.gh` - Dresser design
- `metaballTable.gh` - Metaball table
- `QuadPanelAperture.gh` - Quad panels
- `rnd_lattice.gh` - Random lattice
- `rnd_node.gh` - Random nodes
- `SampleGHConvertTo3dm.gh` - 3DM conversion
- `srf_kmeans.gh` - Surface K-means
- `value_list.gh` - Value list processing

## 📞 **Support Contacts**

- **Heroku**: [help.heroku.com](https://help.heroku.com)
- **Azure**: [portal.azure.com](https://portal.azure.com) → Help + Support
- **Rhino**: [discourse.mcneel.com](https://discourse.mcneel.com)
- **GitHub**: [github.com/support](https://github.com/support)

## 📚 **Documentation Links**

- [Full Documentation](README.md) - Complete documentation index
- [Initial Setup](initial-setup.md) - Build from scratch
- [Troubleshooting](operations/troubleshooting.md) - Common issues
- [Backup Procedures](operations/backup.md) - Data protection
- [System Architecture](system-architecture.md) - Technical overview

## 🔄 **Regular Maintenance**

### **Daily**
- [ ] Check system health
- [ ] Review error logs
- [ ] Commit code changes

### **Weekly**
- [ ] Create VM snapshot
- [ ] Test backup restoration
- [ ] Update dependencies

### **Monthly**
- [ ] Review costs and usage
- [ ] Update documentation
- [ ] Test performance

---

**Quick Reference Version**: 1.0
**Last Updated**: December 2024
**System Status**: ✅ Operational
