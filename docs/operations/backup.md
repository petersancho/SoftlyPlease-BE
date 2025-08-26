# Backup and Recovery Procedures

## 💾 **Backup Strategy Overview**

This document outlines the backup procedures for the Rhino Compute system to ensure you can recover from data loss or system failures.

## 📋 **Backup Inventory**

### **Critical Data to Backup**

1. **Code & Configuration**
   - Git repository (all code)
   - Heroku app configuration
   - Azure VM configuration

2. **Grasshopper Definitions**
   - All `.gh` files in `/src/files/`
   - Definition metadata

3. **Environment Variables**
   - API keys
   - Server URLs
   - Authentication tokens

4. **System Configuration**
   - Azure VM settings
   - Heroku app settings
   - Rhino licensing configuration

## 🔄 **Automated Backup Procedures**

### **1. Git Repository Backup**
```bash
# The repository itself is the backup
# Regular commits preserve all code and definitions
cd compute.rhino3d.appserver

# Create backup branch regularly
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# Tag important releases
git tag v1.0-$(date +%Y%m%d)
git push origin --tags
```

### **2. Heroku Configuration Backup**
```bash
# Export Heroku config
heroku config --app softlyplease-appserver > heroku-config-$(date +%Y%m%d).txt

# Backup to repository
git add heroku-config-*.txt
git commit -m "Backup Heroku config"
git push
```

### **3. Azure VM Backup**
1. **Create VM Snapshot**
   - Azure Portal → VM → Disks → Create snapshot
   - Name: `RhinoCompute-VM-Backup-YYYYMMDD`

2. **Automated Snapshots**
   - Use Azure Backup service
   - Schedule daily snapshots

3. **Export VM Configuration**
   ```powershell
   # On Azure VM - export configuration
   Get-ComputerInfo > system-info-$(date +%Y%m%d).txt
   Get-Service | Where-Object {$_.Name -like "*compute*"} > services-config-$(date +%Y%m%d).txt
   ```

## 📦 **Manual Backup Procedures**

### **Weekly Backup Checklist**
- [ ] **Code Backup**: Commit and push all changes
- [ ] **Definition Backup**: Verify all `.gh` files are in repository
- [ ] **Config Backup**: Export Heroku and Azure configurations
- [ ] **Test Backup**: Verify backups are accessible

### **Monthly Backup Checklist**
- [ ] **VM Snapshot**: Create Azure VM snapshot
- [ ] **Full Repository Archive**: Download complete repository
- [ ] **Test Recovery**: Perform test recovery procedure

## 🚨 **Recovery Procedures**

### **Emergency Recovery Steps**
1. **Assess the Situation**
2. **Choose Recovery Method** (based on what's lost)
3. **Execute Recovery**
4. **Test System**
5. **Resume Operations**

### **1. Complete System Loss Recovery**

#### **If Azure VM is Lost**
1. **Create New VM**
   - Follow [Initial Setup Guide](initial-setup.md) Step 2
   - Use same region and size

2. **Restore from Snapshot**
   - Azure Portal → Snapshots → Select latest
   - Create disk from snapshot
   - Attach to new VM

3. **Reconfigure Networking**
   - Update security groups
   - Note new public IP
   - Update DNS if needed

4. **Update Heroku Configuration**
   ```bash
   heroku config:set RHINO_COMPUTE_URL="http://[NEW_VM_IP]:6500/" --app softlyplease-appserver
   ```

#### **If Heroku App is Lost**
1. **Create New Heroku App**
   ```bash
   heroku create softlyplease-appserver-restore
   ```

2. **Restore Configuration**
   ```bash
   # From backup file
   heroku config:set RHINO_COMPUTE_URL="http://4.248.252.92:6500/"
   heroku config:set RHINO_COMPUTE_KEY="softlyplease-secure-key-2024"
   heroku config:set NODE_ENV=production
   ```

3. **Deploy Code**
   ```bash
   git push heroku main
   ```

### **2. Code/Data Loss Recovery**

#### **If Repository is Lost**
1. **Clone from GitHub**
   ```bash
   git clone https://github.com/mcneel/compute.rhino3d.appserver.git
   ```

2. **Restore from Backup Branch**
   ```bash
   git checkout backup-20241201  # Use latest backup
   git checkout -b recovery
   ```

3. **Redeploy**
   ```bash
   git push heroku main
   ```

#### **If Definition Files Lost**
1. **Check Git History**
   ```bash
   git log --name-only -- src/files/
   git show HEAD~1:src/files/dresser3.gh > dresser3.gh
   ```

2. **Restore from Commit**
   ```bash
   git checkout HEAD~1 -- src/files/
   ```

3. **Redeploy**
   ```bash
   git add .
   git commit -m "Restore definitions"
   git push heroku main
   ```

### **3. Configuration Loss Recovery**

#### **If API Keys Lost**
1. **Generate New Keys**
   ```bash
   # Create new API key
   NEW_KEY="softlyplease-secure-key-$(date +%s)"
   ```

2. **Update All Systems**
   ```bash
   # Update Azure VM environment variable
   # (via RDP)
   [Environment]::SetEnvironmentVariable("RHINO_COMPUTE_KEY", $NEW_KEY, "Machine")

   # Update Heroku
   heroku config:set RHINO_COMPUTE_KEY="$NEW_KEY" --app softlyplease-appserver

   # Restart services
   Restart-Service rhino.compute
   heroku restart --app softlyplease-appserver
   ```

#### **If Environment Variables Lost**
1. **Restore from Backup File**
   ```bash
   # From heroku-config-YYYYMMDD.txt
   heroku config:set RHINO_COMPUTE_URL="http://4.248.252.92:6500/"
   heroku config:set RHINO_COMPUTE_KEY="softlyplease-secure-key-2024"
   ```

2. **Verify Configuration**
   ```bash
   heroku config --app softlyplease-appserver
   ```

## 🗂️ **Backup Storage Locations**

### **Primary Storage**
- **Git Repository**: GitHub (code + definitions)
- **Azure Snapshots**: VM backups
- **Local Files**: Configuration exports

### **Secondary Storage**
- **External Drive**: Complete repository clone
- **Cloud Storage**: Azure Blob Storage for snapshots
- **Email**: Critical configuration sent to team

## 📊 **Backup Verification**

### **Daily Verification**
```bash
#!/bin/bash
# daily-backup-check.sh

echo "=== Daily Backup Verification ==="
echo "Date: $(date)"

# Check git status
cd compute.rhino3d.appserver
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Uncommitted changes detected"
    git status
else
    echo "✅ Repository is clean"
fi

# Check Heroku deployment
if heroku releases --app softlyplease-appserver | head -5; then
    echo "✅ Heroku app accessible"
else
    echo "❌ Cannot access Heroku app"
fi

# Check definitions exist
if ls src/files/*.gh 1> /dev/null 2>&1; then
    echo "✅ Definition files present"
else
    echo "❌ No definition files found"
fi

echo "=== End Verification ==="
```

### **Weekly Verification**
- [ ] Test repository clone on different machine
- [ ] Test Heroku deployment from backup
- [ ] Test definition file restoration
- [ ] Verify configuration restoration

## 🔄 **Recovery Testing**

### **Quarterly Recovery Test**
1. **Set up test environment**
2. **Restore from backups**
3. **Test all functionality**
4. **Document any issues**
5. **Update procedures**

### **Recovery Test Checklist**
- [ ] VM restoration from snapshot
- [ ] Heroku app recreation
- [ ] Code deployment from git
- [ ] Configuration restoration
- [ ] Definition file restoration
- [ ] End-to-end functionality test

## 🚨 **Emergency Recovery Contacts**

### **Support Resources**
- **GitHub Support**: [github.com/support](https://github.com/support)
- **Heroku Support**: [help.heroku.com](https://help.heroku.com)
- **Azure Support**: [portal.azure.com](https://portal.azure.com) → Help + Support
- **Rhino Support**: [discourse.mcneel.com](https://discourse.mcneel.com)

### **Emergency Contacts**
- **System Administrator**: [Your contact info]
- **Team Lead**: [Your contact info]
- **Hosting Provider**: Azure/Heroku support numbers

## 📋 **Backup Schedule**

### **Daily**
- Code commits and pushes
- Heroku config backup

### **Weekly**
- Azure VM snapshot
- Full system verification

### **Monthly**
- Offsite backup storage
- Recovery testing

### **Quarterly**
- Complete recovery test
- Documentation review

## 📚 **Related Documentation**

- [Initial Setup Guide](initial-setup.md) - Rebuild from scratch
- [Troubleshooting Guide](troubleshooting.md) - Common recovery issues
- [System Architecture](system-architecture.md) - Understanding components

---

**Last Updated**: December 2024
**Document Version**: 1.0
**Review Date**: March 2025
