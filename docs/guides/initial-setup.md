# Initial Setup Guide

## 🚀 **Complete Setup Guide for Rhino Compute System**

This guide provides step-by-step instructions to set up the entire Rhino Compute system from scratch.

## 📋 **Prerequisites**

### **Software Requirements**
- **Windows 10/11** (for development)
- **Rhino 7** installed and licensed
- **Git** for version control
- **Node.js 16.x** or later
- **.NET Core SDK** (for Rhino Compute development)
- **PowerShell 7** (recommended)

### **Cloud Accounts**
- **Azure Account** (for VM hosting)
- **Heroku Account** (for AppServer hosting)
- **Rhino Account** (for Cloud Zoo licensing)

### **System Requirements**
- **Development Machine**: 16GB RAM, 4+ cores
- **Azure VM**: 4+ cores, 16GB RAM (recommended)

## 📋 **Setup Checklist**

- [ ] **Step 1**: Set up Rhino licensing with Cloud Zoo
- [ ] **Step 2**: Create and configure Azure VM
- [ ] **Step 3**: Install and configure Rhino Compute on Azure VM
- [ ] **Step 4**: Set up Heroku AppServer
- [ ] **Step 5**: Configure Grasshopper definitions
- [ ] **Step 6**: Test complete system
- [ ] **Step 7**: Set up monitoring and backups

## 🦏 **Step 1: Rhino Licensing Setup**

### **1.1 Create Cloud Zoo Team**
1. Go to [rhino3d.com](https://www.rhino3d.com)
2. Log in to your Rhino account
3. Navigate to **Licenses** section
4. Create a new **Team**
5. Enable **Core Hour Billing**
6. Add your payment method

### **1.2 Generate Auth Token**
1. In your team settings, go to **Core Hour Billing**
2. Click **Get Auth Token**
3. Save the token securely (you'll need it for VM setup)

### **1.3 Test Local Rhino Installation**
1. Install Rhino 7 on your development machine
2. Sign in with your Rhino account
3. Verify Grasshopper is working
4. Test a simple definition locally

## ☁️ **Step 2: Azure VM Setup**

### **2.1 Create Virtual Machine**
1. **Log in to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)

2. **Create VM**
   - Click **"Create a resource"**
   - Search for **"Windows Server 2019"**
   - Choose **"Windows Server 2019 Datacenter"**
   - Click **Create**

3. **Configure Basic Settings**
   ```
   Subscription: Your subscription
   Resource Group: Create new (e.g., "RhinoCompute-RG")
   Virtual Machine Name: RhinoCompute-VM
   Region: East US (or closest to your users)
   Availability Options: No infrastructure redundancy required
   Image: Windows Server 2019
   Size: Standard_D4s_v3 (4 vCPUs, 16GB RAM)
   ```

4. **Configure Administrator Account**
   ```
   Username: rhinocompute
   Password: [Strong password - save securely]
   Confirm Password: [Same password]
   ```

5. **Configure Networking**
   - **Virtual Network**: Create new or use existing
   - **Subnet**: default
   - **Public IP**: Create new
   - **NIC Security Group**: Advanced
   - **Configure security group**:
     - Add inbound rule for port 3389 (RDP)
     - Add inbound rule for port 6500 (Rhino Compute)
     - Add inbound rule for port 5000 (Compute Geometry)

6. **Review and Create**
   - Review all settings
   - Click **Create**
   - Wait for deployment (10-15 minutes)

### **2.2 Connect to VM**
1. **Get Public IP**
   - Go to VM overview in Azure Portal
   - Note the **Public IP address**

2. **Connect via RDP**
   ```cmd
   # From Windows: Press Win + R
   mstsc /v:[VM_IP_ADDRESS]
   ```

3. **Log in with credentials**
   - Username: `rhinocompute`
   - Password: [Your strong password]

### **2.3 Configure Windows Server**
1. **Install Windows Updates**
   - Open **Settings** → **Update & Security**
   - Install all available updates
   - Restart if required

2. **Install Chrome Browser**
   - Download from [google.com/chrome](https://google.com/chrome)
   - Install for easier web access

3. **Install .NET Framework 4.8**
   - Download from Microsoft website
   - Install and restart

## 🦏 **Step 3: Rhino Compute Installation**

### **3.1 Download Rhino Compute**
1. **Download from GitHub**
   ```powershell
   # On the Azure VM, open PowerShell as Administrator
   cd C:\
   git clone https://github.com/mcneel/compute.rhino3d.git
   cd compute.rhino3d
   ```

2. **Download Compiled Version**
   - Alternative: Download pre-compiled binaries
   - URL: [Latest release from GitHub](https://github.com/mcneel/compute.rhino3d/releases)

### **3.2 Download Bootstrap Script**
1. **Get the bootstrap script**
   ```powershell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/mcneel/compute.rhino3d/main/script/bootstrap-server.ps1" -OutFile "bootstrap-server.ps1"
   ```

### **3.3 Run Bootstrap Script**
1. **Execute the script**
   ```powershell
   # Run with execution policy bypass
   PowerShell -ExecutionPolicy Bypass -File "bootstrap-server.ps1"
   ```

2. **Script Configuration**
   - **Email**: Your Rhino account email
   - **Auth Token**: The token from Step 1.2
   - **API Key**: Create a strong API key (save this!)
   - **Accept defaults** for most other settings

3. **Wait for Installation**
   - This will take 20-30 minutes
   - Script will:
     - Install IIS
     - Install Rhino
     - Configure licensing
     - Set up compute services
     - Configure firewall rules

### **3.4 Verify Installation**
1. **Check services**
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*compute*"}
   ```

2. **Test the server**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:6500/version" -Headers @{"RhinoComputeKey" = "your-api-key"}
   ```

3. **Check logs**
   ```powershell
   # View compute logs
   Get-Content "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\logs\*.log" -Tail 20
   ```

## 🚀 **Step 4: AppServer Setup**

### **4.1 Clone AppServer Repository**
```bash
# On your local machine
cd /path/to/your/projects
git clone https://github.com/mcneel/compute.rhino3d.appserver.git
cd compute.rhino3d.appserver
npm install
```

### **4.2 Configure AppServer**
1. **Update configuration in `src/app.js`**
   ```javascript
   // Update the compute server URL
   process.env.RHINO_COMPUTE_URL = 'http://[YOUR_VM_IP]:6500/';
   ```

2. **Add your API key to environment**
   ```bash
   export RHINO_COMPUTE_KEY="your-api-key-here"
   ```

### **4.3 Test Locally**
```bash
# Start the server
npm start

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/dresser3
```

## ☁️ **Step 5: Heroku Deployment**

### **5.1 Install Heroku CLI**
```bash
# Download from heroku.com/cli
# Or via npm
npm install -g heroku
heroku login
```

### **5.2 Create Heroku App**
```bash
# Create app
heroku create softlyplease-appserver

# Set environment variables
heroku config:set RHINO_COMPUTE_URL="http://[YOUR_VM_IP]:6500/"
heroku config:set RHINO_COMPUTE_KEY="your-api-key"
heroku config:set NODE_ENV=production
```

### **5.3 Deploy**
```bash
# Add heroku remote
git remote add heroku https://git.heroku.com/softlyplease-appserver.git

# Deploy
git push heroku main
```

### **5.4 Verify Deployment**
```bash
# Check logs
heroku logs --tail

# Test endpoints
curl https://softlyplease-appserver.herokuapp.com/
```

## 🦗 **Step 6: Grasshopper Definitions Setup**

### **6.1 Create Definition Standards**
1. **Open Rhino + Grasshopper**
2. **Create inputs with naming convention**:
   - `RH_IN:parameter_name`
   - Group input parameters
3. **Create outputs with naming convention**:
   - `RH_OUT:output_name`
   - Group output parameters

### **6.2 Test Definition**
1. **Test locally in Grasshopper**
2. **Save as `.gh` file**
3. **Add to AppServer**:
   ```bash
   cp your_definition.gh compute.rhino3d.appserver/src/files/
   ```
4. **Redeploy to Heroku**:
   ```bash
   git add .
   git commit -m "Add new definition"
   git push heroku main
   ```

### **6.3 Test Remote Definition**
```bash
# Get definition info
curl https://softlyplease-appserver.herokuapp.com/your_definition

# Solve definition
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition": "your_definition", "inputs": {"RH_IN:param": value}}'
```

## 🧪 **Step 7: System Testing**

### **7.1 Health Checks**
```bash
# Test Rhino Compute
curl -H "RhinoComputeKey: your-key" http://[VM_IP]:6500/version

# Test AppServer
curl https://softlyplease-appserver.herokuapp.com/

# Test definition solving
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition": "dresser3", "inputs": {"RH_IN:height": 3.0}}'
```

### **7.2 Frontend Integration**
```javascript
// Test from browser console
fetch('https://softlyplease-appserver.herokuapp.com/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    definition: 'dresser3',
    inputs: { 'RH_IN:height': 3.0 }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### **7.3 Performance Testing**
1. **Test response times**
2. **Test concurrent requests**
3. **Monitor Azure VM performance**
4. **Check Heroku metrics**

## 🔧 **Step 8: Monitoring Setup**

### **8.1 Heroku Monitoring**
```bash
# Enable monitoring add-ons
heroku addons:create papertrail
heroku addons:create librato

# View metrics
heroku addons:open librato
```

### **8.2 Azure Monitoring**
1. **Enable Azure Monitor**
2. **Set up alerts for high CPU/memory**
3. **Configure log analytics**

### **8.3 Set Up Backups**
```bash
# Create backup script
# Schedule automated backups
# Test backup restoration
```

## 📊 **Verification Checklist**

- [ ] **Rhino Compute** responds on port 6500
- [ ] **AppServer** responds on Heroku
- [ ] **Definitions** load and solve correctly
- [ ] **Authentication** works properly
- [ ] **Caching** is functional
- [ ] **Frontend** can call API successfully
- [ ] **Monitoring** is set up
- [ ] **Backups** are configured

## 🚨 **Emergency Contacts**

Save these contacts for support:
- **Azure Support**: [portal.azure.com](https://portal.azure.com) → Help + Support
- **Heroku Support**: [help.heroku.com](https://help.heroku.com)
- **Rhino Support**: [discourse.mcneel.com](https://discourse.mcneel.com)

## 📚 **Next Steps**

Once setup is complete:
1. **Read**: [Operations Guide](operations/monitoring.md)
2. **Set up**: [Backup Procedures](operations/backup.md)
3. **Configure**: [Monitoring](operations/monitoring.md)
4. **Create**: Additional [Grasshopper Definitions](definitions/creation-guide.md)

## 🔄 **Quick Recovery**

If you need to rebuild from scratch:
1. **Follow this guide** step by step
2. **Use saved API keys** and IP addresses
3. **Restore definitions** from backups
4. **Test all endpoints** before going live

---

**Setup Version**: 1.0
**Estimated Time**: 4-6 hours
**Difficulty**: Intermediate
