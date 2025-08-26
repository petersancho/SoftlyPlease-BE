# 🦏 RHINO COMPUTE MASTER GUIDE 🦏

## The Ultimate Bulletproof Setup Guide for Azure VM + Heroku Deployment

*Last Updated: December 2024*
*Guide Version: 2.0*
*System Status: ✅ Operational*

---

## 📋 TABLE OF CONTENTS

### **🏗️ PHASE 1: FOUNDATION & PLANNING**
- [1.1 Prerequisites & Requirements](#11-prerequisites--requirements)
- [1.2 Cost Analysis & Budgeting](#12-cost-analysis--budgeting)
- [1.3 Security Considerations](#13-security-considerations)
- [1.4 Architecture Decision Records](#14-architecture-decision-records)

### **☁️ PHASE 2: AZURE INFRASTRUCTURE**
- [2.1 Azure Account Setup](#21-azure-account-setup)
- [2.2 Virtual Machine Creation](#22-virtual-machine-creation)
- [2.3 Network Configuration](#23-network-configuration)
- [2.4 Security Groups Setup](#24-security-groups-setup)

### **🪟 PHASE 3: WINDOWS SERVER CONFIGURATION**
- [3.1 Initial Server Setup](#31-initial-server-setup)
- [3.2 Windows Updates & Prerequisites](#32-windows-updates--prerequisites)
- [3.3 Remote Desktop Access](#33-remote-desktop-access)
- [3.4 Performance Optimization](#34-performance-optimization)

### **🦏 PHASE 4: RHINO INSTALLATION**
- [4.1 Rhino 7 Installation](#41-rhino-7-installation)
- [4.2 Rhino Licensing Setup](#42-rhino-licensing-setup)
- [4.3 Grasshopper Verification](#43-grasshopper-verification)
- [4.4 Performance Testing](#44-performance-testing)

### **🚀 PHASE 5: RHINO COMPUTE INSTALLATION**
- [5.1 Download & Preparation](#51-download--preparation)
- [5.2 Bootstrap Script Execution](#52-bootstrap-script-execution)
- [5.3 Service Configuration](#53-service-configuration)
- [5.4 Compute Engine Verification](#54-compute-engine-verification)

### **🌐 PHASE 6: HEROKU INFRASTRUCTURE**
- [6.1 Heroku Account Setup](#61-heroku-account-setup)
- [6.2 AppServer Repository](#62-appserver-repository)
- [6.3 Environment Configuration](#63-environment-configuration)
- [6.4 Deployment Pipeline](#64-deployment-pipeline)

### **🔧 PHASE 7: APPSERVER CONFIGURATION**
- [7.1 Code Customization](#71-code-customization)
- [7.2 Definition Management](#72-definition-management)
- [7.3 Caching Configuration](#73-caching-configuration)
- [7.4 Error Handling](#74-error-handling)

### **🧪 PHASE 8: TESTING & VALIDATION**
- [8.1 Unit Testing](#81-unit-testing)
- [8.2 Integration Testing](#82-integration-testing)
- [8.3 Performance Testing](#83-performance-testing)
- [8.4 Security Testing](#84-security-testing)

### **📊 PHASE 9: MONITORING & ALERTING**
- [9.1 Heroku Monitoring](#91-heroku-monitoring)
- [9.2 Azure Monitoring](#92-azure-monitoring)
- [9.3 Application Monitoring](#93-application-monitoring)
- [9.4 Alert Configuration](#94-alert-configuration)

### **🚨 PHASE 10: BACKUP & RECOVERY**
- [10.1 Backup Strategy](#101-backup-strategy)
- [10.2 Recovery Procedures](#102-recovery-procedures)
- [10.3 Disaster Recovery](#103-disaster-recovery)
- [10.4 Business Continuity](#104-business-continuity)

### **📈 PHASE 11: SCALING & OPTIMIZATION**
- [11.1 Performance Optimization](#111-performance-optimization)
- [11.2 Scaling Strategies](#112-scaling-strategies)
- [11.3 Cost Optimization](#113-cost-optimization)
- [11.4 Load Balancing](#114-load-balancing)

### **🔒 PHASE 12: SECURITY HARDENING**
- [12.1 Network Security](#121-network-security)
- [12.2 Application Security](#122-application-security)
- [12.3 Access Control](#123-access-control)
- [12.4 Compliance](#124-compliance)

### **🔄 PHASE 13: MAINTENANCE & UPDATES**
- [13.1 Regular Maintenance](#131-regular-maintenance)
- [13.2 Update Procedures](#132-update-procedures)
- [13.3 Emergency Response](#133-emergency-response)
- [13.4 Documentation Updates](#134-documentation-updates)

---

## 🏗️ PHASE 1: FOUNDATION & PLANNING

### 1.1 Prerequisites & Requirements

#### **Software Requirements**
```bash
# Required Software Versions
- Windows Server 2019+ (Azure VM)
- Rhino 7.0+ (Latest stable version)
- Node.js 16.x+ (for AppServer)
- .NET Framework 4.8+ (for Rhino Compute)
- Git 2.30+ (for version control)
- PowerShell 7.0+ (for automation)
```

#### **Account Requirements**
- **Azure Account**: Active subscription with sufficient credits
- **Heroku Account**: Verified account with payment method
- **Rhino Account**: McNeel account with Cloud Zoo access
- **GitHub Account**: For repository management

#### **Network Requirements**
- **Static IP**: Azure VM with reserved IP address
- **DNS**: Domain configuration for custom URLs
- **Firewall**: Properly configured security groups
- **SSL/TLS**: HTTPS configuration for production

### 1.2 Cost Analysis & Budgeting

#### **Azure VM Costs** (East US Region)
```bash
# Standard_D4s_v3 (4 vCPUs, 16GB RAM)
Base VM Cost: $140.80/month
Windows License: $13.14/month
Total VM Cost: $153.94/month

# Storage (30GB Premium SSD)
Storage Cost: $3.20/month

# Network (Data Transfer)
Outbound Data: $0.087/GB (first 10TB)
```

#### **Heroku Costs**
```bash
# Hobby Dyno (Free Tier)
Dyno Hours: 550 hours/month (free)
Add-ons: Variable (MemCachier ~$15/month)

# Professional Dyno (if needed)
Dyno Cost: $25/month
SSL Add-on: $12.50/month
```

#### **Rhino Licensing Costs**
```bash
# Core Hour Billing
Rhino 7 License: $0.10 per core-hour
Average Usage: 100 core-hours/month
Licensing Cost: $10.00/month
```

#### **Total Monthly Cost Estimate**
```bash
Azure VM: $153.94
Azure Storage: $3.20
Heroku Dyno: $25.00
Heroku Add-ons: $15.00
Rhino Licensing: $10.00
Total: $207.14/month
```

### 1.3 Security Considerations

#### **Network Security**
- **Principle of Least Privilege**: Minimal open ports
- **Fail2Ban**: Automated IP blocking for brute force attempts
- **VPN Access**: Optional for administrative access
- **Network Segmentation**: Separate public and private subnets

#### **Application Security**
- **API Key Management**: Secure storage and rotation
- **Input Validation**: Sanitize all inputs
- **Rate Limiting**: Prevent abuse
- **CORS Policy**: Restrict cross-origin requests

#### **Data Security**
- **Encryption at Rest**: Azure disk encryption
- **Encryption in Transit**: TLS 1.2+ for all connections
- **Backup Encryption**: Encrypt all backups
- **Data Classification**: Identify sensitive data

### 1.4 Architecture Decision Records

#### **ADR 001: Azure VM Selection**
**Context**: Need Windows-based VM for Rhino Compute
**Decision**: Standard_D4s_v3 (4 vCPUs, 16GB RAM)
**Rationale**:
- Rhino Compute requires Windows Server
- 4 cores provide sufficient compute power
- 16GB RAM handles multiple Grasshopper definitions
- Cost-effective for production workload

#### **ADR 002: Heroku for AppServer**
**Context**: Need to bridge web requests to Rhino Compute
**Decision**: Heroku with Node.js AppServer
**Rationale**:
- Simplified deployment and scaling
- Excellent Node.js support
- Built-in monitoring and logging
- Easy integration with web applications

---

## ☁️ PHASE 2: AZURE INFRASTRUCTURE

### 2.1 Azure Account Setup

#### **Step 1: Create Azure Account**
1. **Navigate to Azure Portal**
   ```
   https://portal.azure.com
   ```

2. **Create Free Account** (if needed)
   - Click "Start free"
   - Follow account creation process
   - Add payment method for verification

3. **Create Subscription**
   - Navigate to "Subscriptions"
   - Click "Add"
   - Choose "Free Trial" or "Pay-as-you-go"

#### **Step 2: Create Resource Group**
1. **Navigate to Resource Groups**
   - Search for "Resource groups"
   - Click "Create"

2. **Configure Resource Group**
   ```
   Subscription: Your subscription
   Resource Group Name: RhinoCompute-RG
   Region: East US
   ```

3. **Create Resource Group**
   - Click "Review + Create"
   - Click "Create"

### 2.2 Virtual Machine Creation

#### **Step 1: Start VM Creation**
1. **Navigate to Virtual Machines**
   - Search for "Virtual machines"
   - Click "Create" → "Azure virtual machine"

2. **Configure Basic Settings**
   ```
   Subscription: Your subscription
   Resource Group: RhinoCompute-RG
   Virtual Machine Name: RhinoCompute-VM
   Region: East US
   Availability Options: No infrastructure redundancy required
   Security Type: Standard
   Image: Windows Server 2019 - Gen2
   Size: Standard_D4s_v3
   ```

#### **Step 2: Configure Administrator Account**
1. **Set Authentication Type**
   ```
   Authentication Type: Password
   Username: rhinocompute
   Password: [Generate strong password]
   Confirm Password: [Same password]
   ```

2. **Password Requirements**
   - Minimum 12 characters
   - Uppercase and lowercase letters
   - Numbers and special characters
   - Save password securely (use password manager)

#### **Step 3: Configure Disks**
1. **OS Disk**
   ```
   OS Disk Type: Premium SSD
   OS Disk Size: 30 GB
   ```

2. **Data Disks** (Optional)
   - Add additional disks if needed for larger definitions
   - Use Premium SSD for best performance

### 2.3 Network Configuration

#### **Step 1: Configure Networking**
1. **Virtual Network**
   ```
   Virtual Network: Create new
   Name: RhinoCompute-VNet
   Address Range: 10.0.0.0/16
   Subnet Name: default
   Subnet Range: 10.0.0.0/24
   ```

2. **Public IP Address**
   ```
   Public IP: Create new
   Name: RhinoCompute-PublicIP
   SKU: Standard
   Assignment: Static
   ```

3. **DNS Label** (Optional)
   ```
   DNS Name Label: rhino-compute-[unique-suffix]
   ```

#### **Step 2: Configure Security Group**
1. **Create Network Security Group**
   ```
   Name: RhinoCompute-NSG
   Region: East US
   ```

2. **Add Inbound Security Rules**
   ```
   # RDP Access
   Priority: 1000
   Name: RDP
   Protocol: TCP
   Port: 3389
   Source: Your IP Address
   Action: Allow

   # Rhino Compute API
   Priority: 1010
   Name: RhinoCompute-API
   Protocol: TCP
   Port: 6500
   Source: Any
   Action: Allow

   # Compute Geometry Engine
   Priority: 1020
   Name: Compute-Geometry
   Protocol: TCP
   Port: 5000
   Source: Any
   Action: Allow
   ```

### 2.4 Security Groups Setup

#### **Step 1: Associate NSG**
1. **Navigate to VM**
   - Go to your VM in Azure Portal
   - Click "Networking" in left menu

2. **Associate Network Security Group**
   - Click "Create network security group"
   - Select existing RhinoCompute-NSG
   - Click "OK"

#### **Step 2: Verify Configuration**
1. **Check VM Overview**
   - Note the public IP address
   - Verify DNS name if configured

2. **Test Network Connectivity**
   - Try to ping the public IP (should fail - ICMP blocked)
   - Verify ports are open (will test later)

---

## 🪟 PHASE 3: WINDOWS SERVER CONFIGURATION

### 3.1 Initial Server Setup

#### **Step 1: Connect via RDP**
1. **Get RDP Connection Details**
   ```
   Public IP: [Your VM's public IP]
   Username: rhinocompute
   Password: [Your strong password]
   ```

2. **Connect from Windows**
   ```cmd
   # Press Win + R
   mstsc /v:[VM_PUBLIC_IP]
   ```

3. **Accept Certificate Warning**
   - Check "Don't ask me again for connections to this computer"
   - Click "Connect"

4. **Log in with Credentials**
   - Username: rhinocompute
   - Password: [Your password]

#### **Step 2: Initial Windows Configuration**
1. **Set Time Zone**
   - Open Settings → Time & Language
   - Set correct time zone

2. **Enable Remote Desktop**
   - Settings → System → Remote Desktop
   - Enable Remote Desktop
   - Confirm firewall rule is created

3. **Install Chrome Browser**
   ```powershell
   # Download and install Chrome
   $Path = $env:TEMP;
   $Installer = "chrome_installer.exe";
   Invoke-WebRequest "https://dl.google.com/chrome/install/latest/chrome_installer.exe" -OutFile $Path\$Installer;
   Start-Process -FilePath $Path\$Installer -Args "/silent /install" -Verb RunAs -Wait;
   Remove-Item $Path\$Installer
   ```

### 3.2 Windows Updates & Prerequisites

#### **Step 1: Install Windows Updates**
1. **Open Windows Update**
   ```
   Settings → Update & Security → Windows Update
   ```

2. **Check for Updates**
   - Click "Check for updates"
   - Install all available updates
   - Restart as required

3. **Verify Update Status**
   ```powershell
   Get-WindowsUpdateLog
   ```

#### **Step 2: Install .NET Framework 4.8**
1. **Download .NET Framework**
   ```powershell
   # Download .NET Framework 4.8
   $url = "https://go.microsoft.com/fwlink/?linkid=2088631"
   $output = "$env:TEMP\ndp48-x86-x64-allos-enu.exe"
   Invoke-WebRequest -Uri $url -OutFile $output
   ```

2. **Install .NET Framework**
   ```powershell
   # Install silently
   Start-Process -FilePath $output -ArgumentList "/q /norestart" -Wait

   # Restart computer
   Restart-Computer
   ```

3. **Verify Installation**
   ```powershell
   Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP' -Recurse |
   Get-ItemProperty -Name version -EA 0 |
   Where { $_.PSChildName -match '^(?!S)\p{L}'} |
   Select PSChildName, version
   ```

### 3.3 Remote Desktop Access

#### **Step 1: Configure RDP Security**
1. **Set Account Lockout Policy**
   ```powershell
   # Set account lockout threshold
   net accounts /lockoutthreshold:5
   net accounts /lockoutduration:30
   net accounts /lockoutwindow:30
   ```

2. **Enable Network Level Authentication**
   ```powershell
   # Enable NLA for RDP
   Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -Name "SecurityLayer" -Value 1
   ```

3. **Configure Firewall Rules**
   ```powershell
   # Enable RDP firewall rule
   Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
   ```

#### **Step 2: Test RDP Connection**
1. **Disconnect and Reconnect**
   - Close current RDP session
   - Reconnect using saved credentials

2. **Test from Different Location**
   - Verify connection works from another network if possible

### 3.4 Performance Optimization

#### **Step 1: Configure Windows Performance**
1. **Disable Unnecessary Services**
   ```powershell
   # Stop and disable Windows Search
   Stop-Service -Name "WSearch" -Force
   Set-Service -Name "WSearch" -StartupType Disabled
   ```

2. **Configure Power Settings**
   ```powershell
   # Set high performance power plan
   powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
   ```

3. **Optimize Visual Effects**
   ```
   System Properties → Advanced → Performance Settings
   Choose: "Adjust for best performance"
   ```

#### **Step 2: Configure Server Roles**
1. **Install IIS (if needed for future use)**
   ```powershell
   Install-WindowsFeature -name Web-Server -IncludeManagementTools
   ```

2. **Configure Server Manager**
   ```
   Server Manager → Local Server → Properties
   Configure: Computer name, Windows Firewall, Remote Desktop
   ```

---

## 🦏 PHASE 4: RHINO INSTALLATION

### 4.1 Rhino 7 Installation

#### **Step 1: Download Rhino**
1. **Access Download Portal**
   ```
   https://www.rhino3d.com/download/
   ```

2. **Download Rhino 7**
   - Choose "Rhino 7 for Windows"
   - Download the installer

3. **Transfer to VM**
   - Copy installer to VM via RDP
   - Or download directly on VM using Chrome

#### **Step 2: Install Rhino**
1. **Run Installer**
   ```powershell
   # Run the installer
   Start-Process -FilePath "rhino_installer.exe" -Wait
   ```

2. **Installation Options**
   ```
   Installation Type: Typical
   Destination Folder: C:\Program Files\Rhino 7
   Language: English
   ```

3. **Complete Installation**
   - Follow on-screen instructions
   - Restart if prompted

#### **Step 3: Verify Installation**
1. **Check Installation**
   ```powershell
   Test-Path "C:\Program Files\Rhino 7\System\Rhino.exe"
   ```

2. **Check Version**
   ```powershell
   & "C:\Program Files\Rhino 7\System\Rhino.exe" /version
   ```

3. **Run Rhino Test**
   - Launch Rhino from Start menu
   - Verify it opens without errors
   - Close Rhino

### 4.2 Rhino Licensing Setup

#### **Step 1: Create Cloud Zoo Team**
1. **Navigate to Rhino Accounts**
   ```
   https://accounts.rhino3d.com/
   ```

2. **Create New Team**
   ```
   Teams → Create Team
   Team Name: SoftlyPlease-RhinoCompute
   Description: Rhino Compute server for softlyplease.com
   ```

3. **Enable Core Hour Billing**
   ```
   Billing → Core Hour Billing
   Enable core hour billing
   Add payment method
   ```

#### **Step 2: Generate Auth Token**
1. **Get Auth Token**
   ```
   Core Hour Billing → Get Auth Token
   Copy and save the token securely
   ```

2. **Token Format**
   ```
   # Token will look like this:
   eyJhbGciOiJSUzI1NiIsImtpZCI6Ik1Fek16R...
   ```

#### **Step 3: Configure Licensing on VM**
1. **Store Auth Token Securely**
   ```powershell
   # Create secure credential storage
   $token = "your-auth-token-here"
   $secureToken = ConvertTo-SecureString $token -AsPlainText -Force
   $credential = New-Object System.Management.Automation.PSCredential("rhino", $secureToken)
   $credential | Export-Clixml -Path "C:\RhinoLicenses\auth-token.xml"
   ```

2. **Test Licensing**
   ```powershell
   # Launch Rhino and verify license
   & "C:\Program Files\Rhino 7\System\Rhino.exe" /nosplash /exit
   ```

### 4.3 Grasshopper Verification

#### **Step 1: Install Grasshopper**
1. **Launch Rhino**
   ```powershell
   & "C:\Program Files\Rhino 7\System\Rhino.exe"
   ```

2. **Install Grasshopper**
   ```
   Tools → Package Manager → Search for "Grasshopper"
   Install "Grasshopper" package
   ```

3. **Verify Installation**
   ```
   File → New → Select "Grasshopper Document"
   ```

#### **Step 2: Test Simple Definition**
1. **Create Test Definition**
   ```
   Canvas → Right-click → Add Primitive → Circle
   Canvas → Right-click → Add Primitive → Point
   Connect Point to Circle Center
   ```

2. **Save Test Definition**
   ```
   File → Save As → test_definition.gh
   Location: C:\RhinoDefinitions\
   ```

3. **Test Definition**
   - Change point location
   - Verify circle updates
   - Save and close

### 4.4 Performance Testing

#### **Step 1: Benchmark Rhino**
1. **Run Performance Test**
   ```powershell
   # Create simple performance test
   $startTime = Get-Date
   & "C:\Program Files\Rhino 7\System\Rhino.exe" /nosplash /runscript="_-SystemInfo _-Enter" /exit
   $endTime = Get-Date
   $duration = $endTime - $startTime
   Write-Host "Rhino startup time: $($duration.TotalSeconds) seconds"
   ```

2. **Monitor System Resources**
   ```powershell
   # Check CPU and memory usage
   Get-Counter '\Processor(_Total)\% Processor Time'
   Get-Counter '\Memory\Available MBytes'
   ```

3. **Test Grasshopper Performance**
   - Open test definition
   - Make several parameter changes
   - Monitor for lag or unresponsiveness

---

## 🚀 PHASE 5: RHINO COMPUTE INSTALLATION

### 5.1 Download & Preparation

#### **Step 1: Create Installation Directory**
```powershell
# Create installation directory
New-Item -ItemType Directory -Path "C:\RhinoCompute" -Force
Set-Location "C:\RhinoCompute"
```

#### **Step 2: Download Rhino Compute**
```powershell
# Clone the repository
git clone https://github.com/mcneel/compute.rhino3d.git
Set-Location "compute.rhino3d"
```

#### **Step 3: Download Bootstrap Script**
```powershell
# Download the bootstrap script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/mcneel/compute.rhino3d/main/script/bootstrap-server.ps1" -OutFile "bootstrap-server.ps1"

# Make script executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### 5.2 Bootstrap Script Execution

#### **Step 1: Prepare Configuration**
1. **Gather Required Information**
   ```
   Email: Your Rhino account email
   Auth Token: [From step 4.2]
   API Key: Generate strong key (save securely)
   VM IP: [Your Azure VM public IP]
   ```

2. **Generate Strong API Key**
   ```powershell
   # Generate random API key
   $apiKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   Write-Host "Generated API Key: $apiKey"
   # Save this securely
   ```

#### **Step 2: Run Bootstrap Script**
```powershell
# Execute bootstrap script
PowerShell -ExecutionPolicy Bypass -File "bootstrap-server.ps1"
```

#### **Step 3: Script Configuration**
1. **Email Input**
   ```
   Enter your Rhino account email: [your-email@domain.com]
   ```

2. **Auth Token Input**
   ```
   Enter your Cloud Zoo auth token: [paste-token-here]
   ```

3. **API Key Input**
   ```
   Enter desired API key for Rhino Compute: [your-generated-key]
   ```

4. **Accept Default Settings**
   ```
   Press Enter for remaining prompts (accept defaults)
   ```

#### **Step 4: Monitor Installation**
1. **Watch Progress**
   - Script will download and install components
   - May take 20-30 minutes
   - Watch for errors

2. **Expected Output**
   ```
   Installing IIS...
   Installing Rhino...
   Configuring licensing...
   Setting up compute services...
   Installation completed successfully
   ```

### 5.3 Service Configuration

#### **Step 1: Verify Services**
```powershell
# Check compute services
Get-Service | Where-Object {$_.Name -like "*compute*"}
```

#### **Step 2: Configure Service Startup**
```powershell
# Set services to start automatically
Set-Service -Name "rhino.compute" -StartupType Automatic
Set-Service -Name "rhino.compute.geometry" -StartupType Automatic
```

#### **Step 3: Start Services**
```powershell
# Start compute services
Start-Service -Name "rhino.compute"
Start-Service -Name "rhino.compute.geometry"
```

#### **Step 4: Configure Environment Variables**
```powershell
# Set environment variables
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_KEY", "your-api-key", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URLS", "http://+:6500", "Machine")
```

### 5.4 Compute Engine Verification

#### **Step 1: Test API Endpoint**
```powershell
# Test version endpoint
Invoke-WebRequest -Uri "http://localhost:6500/version" -Headers @{"RhinoComputeKey" = "your-api-key"}
```

#### **Step 2: Test Grasshopper Endpoint**
```powershell
# Create test definition
# (Create a simple GH definition and save it)
# Then test with curl or PowerShell
```

#### **Step 3: Verify Logs**
```powershell
# Check compute logs
Get-Content "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\logs\*.log" -Tail 20
```

#### **Step 4: Test External Access**
```powershell
# Test from external machine (replace with your VM IP)
Invoke-WebRequest -Uri "http://[VM_IP]:6500/version" -Headers @{"RhinoComputeKey" = "your-api-key"}
```

---

## 🌐 PHASE 6: HEROKU INFRASTRUCTURE

### 6.1 Heroku Account Setup

#### **Step 1: Create Heroku Account**
1. **Navigate to Heroku**
   ```
   https://www.heroku.com/
   ```

2. **Sign Up**
   - Click "Sign up for free"
   - Verify email address
   - Add payment method (required for production apps)

3. **Install Heroku CLI**
   ```bash
   # Download from heroku.com/cli
   # Or using npm
   npm install -g heroku
   heroku login
   ```

#### **Step 2: Verify Account**
```bash
# Test CLI installation
heroku --version

# Login to account
heroku login

# Verify user
heroku auth:whoami
```

### 6.2 AppServer Repository

#### **Step 1: Clone AppServer**
```bash
# Navigate to your development workspace
cd ~/projects

# Clone the repository
git clone https://github.com/mcneel/compute.rhino3d.appserver.git
cd compute.rhino3d.appserver
```

#### **Step 2: Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

#### **Step 3: Configure Repository**
```bash
# Check git status
git status

# Create development branch
git checkout -b softlyplease-setup
```

### 6.3 Environment Configuration

#### **Step 1: Gather Configuration Data**
```bash
# Your Azure VM details
VM_IP="4.248.252.92"
API_KEY="softlyplease-secure-key-2024"
```

#### **Step 2: Test Local Configuration**
```bash
# Set environment variables
export RHINO_COMPUTE_URL="http://$VM_IP:6500/"
export RHINO_COMPUTE_KEY="$API_KEY"
export NODE_ENV="production"

# Test configuration
node -e "console.log('URL:', process.env.RHINO_COMPUTE_URL); console.log('Key:', process.env.RHINO_COMPUTE_KEY);"
```

#### **Step 3: Update App Configuration**
1. **Modify app.js**
   ```javascript
   // Update compute server URL
   process.env.RHINO_COMPUTE_URL = process.env.RHINO_COMPUTE_URL || `http://${VM_IP}:6500/`;

   // Add logging for verification
   console.log('🔧 Configuration:');
   console.log('RHINO_COMPUTE_URL:', process.env.RHINO_COMPUTE_URL);
   console.log('RHINO_COMPUTE_KEY:', process.env.RHINO_COMPUTE_KEY ? 'Set' : 'Not set');
   ```

2. **Test Local Server**
   ```bash
   # Start server locally
   npm start

   # Test endpoints in another terminal
   curl http://localhost:3000/
   curl http://localhost:3000/dresser3
   ```

### 6.4 Deployment Pipeline

#### **Step 1: Create Heroku App**
```bash
# Create new Heroku app
heroku create softlyplease-appserver

# Verify app creation
heroku apps
```

#### **Step 2: Configure Environment Variables**
```bash
# Set production environment variables
heroku config:set RHINO_COMPUTE_URL="http://$VM_IP:6500/"
heroku config:set RHINO_COMPUTE_KEY="$API_KEY"
heroku config:set NODE_ENV="production"

# Verify configuration
heroku config
```

#### **Step 3: Deploy Application**
```bash
# Add heroku remote
git remote add heroku https://git.heroku.com/softlyplease-appserver.git

# Deploy to Heroku
git push heroku main

# Verify deployment
heroku logs --tail
```

#### **Step 4: Test Deployment**
```bash
# Get app URL
heroku info

# Test endpoints
curl https://softlyplease-appserver.herokuapp.com/
curl https://softlyplease-appserver.herokuapp.com/dresser3
```

---

## 🔧 PHASE 7: APPSERVER CONFIGURATION

### 7.1 Code Customization

#### **Step 1: Update Configuration**
1. **Modify app.js for Production**
   ```javascript
   // Update compute server URL with your VM IP
   if (!process.env.RHINO_COMPUTE_URL) {
     process.env.RHINO_COMPUTE_URL = process.env.NODE_ENV === 'production'
       ? 'http://4.248.252.92:6500/'  // Your Azure VM IP
       : 'http://localhost:6500/'     // Development
   }

   // Add error handling
   process.on('uncaughtException', (err) => {
     console.error('Uncaught Exception:', err);
     process.exit(1);
   });

   process.on('unhandledRejection', (err) => {
     console.error('Unhandled Rejection:', err);
     process.exit(1);
   });
   ```

2. **Update Package.json**
   ```json
   {
     "name": "softlyplease-appserver",
     "version": "1.0.0",
     "description": "Rhino Compute AppServer for softlyplease.com",
     "scripts": {
       "start": "node ./src/bin/www",
       "start:prod": "NODE_ENV=production node ./src/bin/www",
       "test": "echo \"Error: no test specified\" && exit 1"
     },
     "engines": {
       "node": "16.x"
     }
   }
   ```

#### **Step 2: Add Health Check Endpoint**
1. **Create Health Route**
   ```javascript
   // In src/routes/index.js
   router.get('/health', function(req, res, next) {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       version: process.env.npm_package_version
     });
   });
   ```

2. **Test Health Endpoint**
   ```bash
   curl http://localhost:3000/health
   ```

### 7.2 Definition Management

#### **Step 1: Organize Definitions**
```bash
# Create definitions directory structure
mkdir -p src/files
cd src/files

# Download or create definitions
# Copy your .gh files here
cp /path/to/your/definitions/*.gh .
```

#### **Step 2: Validate Definitions**
1. **Check Definition Files**
   ```bash
   # List all definitions
   ls -la *.gh

   # Check file sizes
   ls -lh *.gh
   ```

2. **Test Definition Loading**
   ```javascript
   // Add to app.js for testing
   const fs = require('fs');
   const path = require('path');

   // Check definitions on startup
   const definitionsDir = path.join(__dirname, 'files');
   fs.readdir(definitionsDir, (err, files) => {
     if (err) {
       console.error('Error reading definitions:', err);
       return;
     }
     const ghFiles = files.filter(file => file.endsWith('.gh'));
     console.log(`📁 Found ${ghFiles.length} Grasshopper definitions:`, ghFiles);
   });
   ```

### 7.3 Caching Configuration

#### **Step 1: Install MemCachier Add-on**
```bash
# Add MemCachier to Heroku app
heroku addons:create memcachier:dev --app softlyplease-appserver

# Check add-on status
heroku addons --app softlyplease-appserver
```

#### **Step 2: Configure Caching**
1. **Update Cache Configuration**
   ```javascript
   // In your cache middleware
   const memjs = require('memjs');

   // Configure MemCachier
   let cacheClient;
   if (process.env.MEMCACHIER_SERVERS) {
     cacheClient = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
       username: process.env.MEMCACHIER_USERNAME,
       password: process.env.MEMCACHIER_PASSWORD
     });
   } else {
     // Fallback to memory cache
     const NodeCache = require('node-cache');
     cacheClient = new NodeCache();
   }
   ```

2. **Set Cache TTL**
   ```javascript
   // Cache configuration
   const CACHE_TTL = 3600; // 1 hour
   const CACHE_CHECK_PERIOD = 600; // 10 minutes
   ```

### 7.4 Error Handling

#### **Step 1: Add Global Error Handling**
```javascript
// In app.js
app.use(function(err, req, res, next) {
  console.error('Error:', err);

  // Log to Heroku logs
  console.error('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  res.status(err.status || 500);
  res.json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  });
});
```

#### **Step 2: Add Request Logging**
```javascript
// Add request logging
app.use(function(req, res, next) {
  const start = Date.now();
  res.on('finish', function() {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

---

## 🧪 PHASE 8: TESTING & VALIDATION

### 8.1 Unit Testing

#### **Step 1: Install Testing Framework**
```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Add test scripts to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

#### **Step 2: Create Tests**
1. **API Endpoint Tests**
   ```javascript
   // tests/api.test.js
   const request = require('supertest');
   const app = require('../src/app');

   describe('API Endpoints', () => {
     test('GET / should return definition list', async () => {
       const response = await request(app).get('/');
       expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('definitions');
     });

     test('GET /health should return health status', async () => {
       const response = await request(app).get('/health');
       expect(response.status).toBe(200);
       expect(response.body.status).toBe('healthy');
     });
   });
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

### 8.2 Integration Testing

#### **Step 1: Test with Rhino Compute**
```bash
# Test full integration
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "dresser3",
    "inputs": {
      "RH_IN:height": 3.0,
      "RH_IN:width": 2.0,
      "RH_IN:depth": 1.5
    }
  }'
```

#### **Step 2: Validate Response**
```javascript
// Expected response structure
{
  "definition": "dresser3",
  "outputs": {
    "RH_OUT:mesh": "base64-encoded-mesh-data",
    "RH_OUT:volume": 13.5
  },
  "computation_time": 1250,
  "cached": false
}
```

### 8.3 Performance Testing

#### **Step 1: Load Testing Setup**
```bash
# Install load testing tool
npm install --save-dev artillery

# Create load test configuration
# artillery.yml
config:
  target: 'https://softlyplease-appserver.herokuapp.com'
  phases:
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: 'Solve definition'
    weight: 100
    requests:
      - post:
          url: '/solve'
          json:
            definition: 'dresser3'
            inputs:
              'RH_IN:height': 3.0
              'RH_IN:width': 2.0
              'RH_IN:depth': 1.5
```

#### **Step 2: Run Load Tests**
```bash
# Run load test
npx artillery run artillery.yml

# Generate report
npx artillery report report.json
```

### 8.4 Security Testing

#### **Step 1: API Security Tests**
```bash
# Test without API key (should fail)
curl https://softlyplease-appserver.herokuapp.com/

# Test with wrong API key (should fail)
curl -H "RhinoComputeKey: wrong-key" https://softlyplease-appserver.herokuapp.com/

# Test with correct API key (should succeed)
curl -H "RhinoComputeKey: softlyplease-secure-key-2024" https://softlyplease-appserver.herokuapp.com/
```

#### **Step 2: Input Validation Tests**
```bash
# Test with malformed JSON
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'

# Test with missing required fields
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition": "test"}'
```

---

## 📊 PHASE 9: MONITORING & ALERTING

### 9.1 Heroku Monitoring

#### **Step 1: Enable Heroku Metrics**
```bash
# Enable metrics collection
heroku labs:enable runtime-dyno-metadata --app softlyplease-appserver

# View metrics dashboard
heroku addons:open librato --app softlyplease-appserver
```

#### **Step 2: Set Up Log Drain**
```bash
# Add log drain to external service
heroku drains:add https://your-log-service.com --app softlyplease-appserver

# View logs
heroku logs --tail --app softlyplease-appserver
```

### 9.2 Azure Monitoring

#### **Step 1: Enable Azure Monitor**
1. **Navigate to Azure Portal**
   - VM → Monitoring → Metrics
   - Enable diagnostic settings

2. **Configure Metrics**
   ```
   Metrics: CPU Percentage, Memory Percentage, Network In/Out
   Destination: Log Analytics Workspace
   ```

3. **Set Up Alerts**
   ```
   Alert Rule: High CPU Usage
   Condition: CPU Percentage > 80%
   Action: Email notification
   ```

### 9.3 Application Monitoring

#### **Step 1: Add Application Metrics**
```javascript
// In app.js
const metrics = {
  requests: 0,
  errors: 0,
  avgResponseTime: 0
};

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  metrics.requests++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      metrics.errors++;
    }

    // Update average response time
    metrics.avgResponseTime = (metrics.avgResponseTime + duration) / 2;
  });

  next();
});

// Health endpoint with metrics
app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

#### **Step 2: Set Up Health Checks**
```bash
# Add health check URL to Heroku
heroku config:set HEALTHCHECK_URL="/health" --app softlyplease-appserver
```

### 9.4 Alert Configuration

#### **Step 1: Set Up Email Alerts**
```bash
# Install SendGrid add-on
heroku addons:create sendgrid --app softlyplease-appserver

# Configure alerts
heroku config:set ALERT_EMAIL="admin@softlyplease.com" --app softlyplease-appserver
```

#### **Step 2: Create Alert Script**
```javascript
// alerts.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendAlert(subject, message) {
  const msg = {
    to: process.env.ALERT_EMAIL,
    from: 'alerts@softlyplease.com',
    subject: subject,
    text: message
  };

  try {
    await sgMail.send(msg);
    console.log('Alert sent successfully');
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

module.exports = { sendAlert };
```

---

## 💾 PHASE 10: BACKUP & RECOVERY

### 10.1 Backup Strategy

#### **Step 1: Git Repository Backup**
```bash
# The repository is the primary backup
cd compute.rhino3d.appserver

# Create regular backup tags
git tag -a "backup-$(date +%Y%m%d)" -m "Automated backup"
git push origin --tags

# Create backup branch
git checkout -b "backup-$(date +%Y%m%d)"
git push origin "backup-$(date +%Y%m%d)"
```

#### **Step 2: Heroku Configuration Backup**
```bash
# Export configuration
heroku config --app softlyplease-appserver > "heroku-config-$(date +%Y%m%d).txt"

# Commit to repository
git add heroku-config-*.txt
git commit -m "Heroku config backup"
git push
```

#### **Step 3: Azure VM Backup**
1. **Create VM Snapshot**
   ```
   Azure Portal → VM → Disks → Create snapshot
   Name: RhinoCompute-Backup-YYYYMMDD
   ```

2. **Automated Backups**
   ```
   Azure Portal → Backup Center → Backup policies
   Create policy for VM backups
   Schedule: Daily at 2 AM
   Retention: 30 days
   ```

### 10.2 Recovery Procedures

#### **Scenario 1: Heroku App Deletion**
```bash
# 1. Clone repository
git clone https://github.com/your-org/compute.rhino3d.appserver.git
cd compute.rhino3d.appserver

# 2. Create new Heroku app
heroku create softlyplease-appserver-restore

# 3. Restore configuration from backup file
heroku config:set RHINO_COMPUTE_URL="http://4.248.252.92:6500/"
heroku config:set RHINO_COMPUTE_KEY="softlyplease-secure-key-2024"
heroku config:set NODE_ENV="production"

# 4. Deploy
git push heroku main

# 5. Update DNS/custom domain if needed
heroku domains:add api.softlyplease.com --app softlyplease-appserver-restore
```

#### **Scenario 2: Azure VM Loss**
```bash
# 1. Create new VM from snapshot
# Azure Portal → Snapshots → Select latest → Create disk

# 2. Create new VM with restored disk
# Azure Portal → Virtual Machines → Create
# Attach restored disk

# 3. Update networking
# Note new public IP address

# 4. Update Heroku configuration
heroku config:set RHINO_COMPUTE_URL="http://[NEW_VM_IP]:6500/"

# 5. Restart Heroku app
heroku restart --app softlyplease-appserver

# 6. Test endpoints
curl https://softlyplease-appserver.herokuapp.com/
```

#### **Scenario 3: Code Corruption**
```bash
# 1. Check git status
git status

# 2. Restore from previous commit
git log --oneline -10
git checkout [COMMIT_HASH] -- src/
git checkout [COMMIT_HASH] -- src/files/

# 3. Test locally
npm start

# 4. Deploy if working
git add .
git commit -m "Restore from backup"
git push heroku main
```

### 10.3 Disaster Recovery

#### **Step 1: Create Recovery Documentation**
```bash
# Create recovery guide
cat > RECOVERY-PLAN.md << 'EOF'
# EMERGENCY RECOVERY PLAN

## Critical Information
- **Azure VM IP**: 4.248.252.92
- **Heroku App**: softlyplease-appserver
- **API Key**: softlyplease-secure-key-2024
- **Git Repository**: https://github.com/your-org/compute.rhino3d.appserver

## Quick Recovery Steps
1. Clone repository: git clone [repo-url]
2. Create Heroku app: heroku create [app-name]
3. Set environment variables (see backup files)
4. Deploy: git push heroku main
5. Test endpoints

## Emergency Contacts
- System Administrator: [contact-info]
- Heroku Support: help.heroku.com
- Azure Support: portal.azure.com → Help + Support
EOF
```

#### **Step 2: Test Recovery Procedures**
1. **Monthly Recovery Testing**
   - Set up test environment
   - Follow recovery procedures
   - Document any issues
   - Update procedures based on findings

2. **Recovery Time Objective (RTO)**
   - Heroku App: 30 minutes
   - Azure VM: 2-4 hours
   - Full System: 4-6 hours

3. **Recovery Point Objective (RPO)**
   - Code: Near-zero (git commits)
   - Configuration: 1 day (backup frequency)
   - VM State: 1 day (snapshot frequency)

### 10.4 Business Continuity

#### **Step 1: Redundancy Planning**
1. **Multi-Region Setup** (Future)
   - Primary: East US
   - Secondary: West US

2. **Load Balancer Setup** (Future)
   - Multiple Heroku dynos
   - Multiple Azure VMs
   - Automatic failover

#### **Step 2: Communication Plan**
```bash
# Create communication template
cat > EMERGENCY-COMMUNICATION.md << 'EOF'
# EMERGENCY COMMUNICATION TEMPLATE

## Incident Summary
- **Date/Time**: [Timestamp]
- **Issue**: [Brief description]
- **Impact**: [Affected services/users]
- **Status**: [Investigating/Resolving/Resolved]

## Actions Taken
- [List actions in chronological order]

## Resolution
- [Root cause]
- [Resolution steps]
- [Prevention measures]

## Communication Log
- [Time] [Contact] [Message]
EOF
```

---

## 📈 PHASE 11: SCALING & OPTIMIZATION

### 11.1 Performance Optimization

#### **Step 1: Code Optimization**
```javascript
// Optimize caching strategy
const CACHE_STRATEGY = {
  TTL: 3600,           // 1 hour
  MAX_SIZE: 1000,      // Max cached items
  COMPRESSION: true,   // Compress cached data
  SERIALIZATION: 'json' // Data format
};

// Optimize API calls
const API_OPTIMIZATION = {
  TIMEOUT: 30000,      // 30 second timeout
  RETRIES: 3,          // Retry failed requests
  CIRCUIT_BREAKER: true, // Prevent cascade failures
  BATCH_SIZE: 10       // Batch multiple requests
};
```

#### **Step 2: Database Optimization**
```javascript
// Optimize memory cache
const cache = new NodeCache({
  stdTTL: CACHE_STRATEGY.TTL,
  checkperiod: 600,
  maxKeys: CACHE_STRATEGY.MAX_SIZE,
  deleteOnExpire: true,
  useClones: false
});
```

### 11.2 Scaling Strategies

#### **Step 1: Horizontal Scaling**
```bash
# Scale Heroku dynos
heroku ps:scale web=3 --app softlyplease-appserver

# Check scaling status
heroku ps --app softlyplease-appserver
```

#### **Step 2: Azure VM Scaling**
1. **Scale Up VM Size**
   ```
   Azure Portal → VM → Size → Change size
   Select: Standard_D8s_v3 (8 vCPUs, 32GB RAM)
   ```

2. **Add Additional VMs** (Future)
   - Create multiple VM instances
   - Set up load balancer
   - Configure auto-scaling

#### **Step 3: Load Balancing Setup**
```bash
# Install Heroku load balancer (if available)
# Or use external load balancer for multiple Heroku apps

# Example configuration for multiple instances
heroku config:set PRIMARY_COMPUTE="http://vm1:6500/"
heroku config:set SECONDARY_COMPUTE="http://vm2:6500/"
heroku config:set LOAD_BALANCER="round-robin"
```

### 11.3 Cost Optimization

#### **Step 1: Monitor Usage Costs**
```bash
# Check Heroku costs
heroku addons --app softlyplease-appserver

# Monitor Azure costs
# Azure Portal → Cost Management → Cost analysis
```

#### **Step 2: Implement Cost Controls**
```javascript
// Add cost monitoring
const COST_MONITORING = {
  MAX_REQUESTS_PER_HOUR: 10000,
  MAX_COMPUTE_TIME_PER_DAY: 3600, // 1 hour
  ALERT_THRESHOLD: 0.8 // 80% of limit
};

// Implement rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: COST_MONITORING.MAX_REQUESTS_PER_HOUR,
  message: 'Rate limit exceeded'
}));
```

#### **Step 3: Auto-Scaling Rules**
```bash
# Set up auto-scaling based on load
heroku autoscale:enable --app softlyplease-appserver \
  --min-dynos 1 \
  --max-dynos 5 \
  --metric web.requests \
  --threshold 1000
```

### 11.4 Load Balancing

#### **Step 1: Set Up Multiple Instances**
1. **Create Multiple Heroku Apps**
   ```bash
   heroku create softlyplease-appserver-2
   heroku create softlyplease-appserver-3
   ```

2. **Configure Load Balancer**
   ```bash
   # Use external load balancer (CloudFlare, AWS ALB, etc.)
   # Point to multiple Heroku app URLs
   ```

3. **Implement Health Checks**
   ```javascript
   // Health check endpoint for load balancer
   app.get('/health', (req, res) => {
     // Check Rhino Compute connectivity
     const computeHealthy = checkComputeHealth();
     const appHealthy = checkAppHealth();

     if (computeHealthy && appHealthy) {
       res.status(200).json({ status: 'healthy' });
     } else {
       res.status(503).json({ status: 'unhealthy' });
     }
   });
   ```

---

## 🔒 PHASE 12: SECURITY HARDENING

### 12.1 Network Security

#### **Step 1: Configure Azure NSG Rules**
```bash
# Restrict RDP access to specific IPs
# Azure Portal → VM → Networking → NSG
# Update RDP rule to specific IP ranges
```

#### **Step 2: Set Up VPN Access**
```bash
# Optional: Configure VPN for administrative access
# Azure Portal → Virtual Network Gateway
```

#### **Step 3: Enable DDoS Protection**
```bash
# Enable Azure DDoS Protection
# Azure Portal → DDoS protection → Enable
```

### 12.2 Application Security

#### **Step 1: Input Validation**
```javascript
// Add comprehensive input validation
const validateDefinitionRequest = (req, res, next) => {
  const { definition, inputs } = req.body;

  // Validate definition name
  if (!definition || typeof definition !== 'string') {
    return res.status(400).json({ error: 'Invalid definition name' });
  }

  // Validate inputs object
  if (!inputs || typeof inputs !== 'object') {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  // Sanitize inputs
  const sanitizedInputs = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (key.startsWith('RH_IN:') && typeof value === 'number') {
      sanitizedInputs[key] = value;
    }
  }

  req.sanitizedInputs = sanitizedInputs;
  next();
};

app.use('/solve', validateDefinitionRequest);
```

#### **Step 2: API Key Rotation**
```bash
# Rotate API keys regularly
NEW_KEY=$(openssl rand -base64 32)
heroku config:set RHINO_COMPUTE_KEY="$NEW_KEY"
# Update all clients with new key
```

### 12.3 Access Control

#### **Step 1: Implement Role-Based Access**
```javascript
// Add role-based access control
const accessControl = {
  admin: ['*'],
  user: ['/solve', '/definition'],
  public: ['/health']
};

const checkAccess = (req, res, next) => {
  const userRole = req.headers['x-user-role'] || 'public';
  const allowedPaths = accessControl[userRole] || [];

  if (allowedPaths.includes('*') || allowedPaths.includes(req.path)) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

app.use(checkAccess);
```

#### **Step 2: Audit Logging**
```javascript
// Implement comprehensive audit logging
const auditLog = (req, res, next) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode
  };

  console.log('AUDIT:', JSON.stringify(auditEntry));
  next();
};

app.use(auditLog);
```

### 12.4 Compliance

#### **Step 1: Data Encryption**
```javascript
// Encrypt sensitive data
const crypto = require('crypto');

const encrypt = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};
```

#### **Step 2: GDPR Compliance**
```javascript
// Implement data minimization
const dataMinimization = (req, res, next) => {
  // Remove unnecessary data from requests
  if (req.body && req.body.unnecessaryField) {
    delete req.body.unnecessaryField;
  }
  next();
};

app.use(dataMinimization);
```

---

## 🔄 PHASE 13: MAINTENANCE & UPDATES

### 13.1 Regular Maintenance

#### **Daily Maintenance Checklist**
- [ ] Check system health endpoints
- [ ] Review application logs
- [ ] Monitor resource usage
- [ ] Verify backup completion
- [ ] Check security alerts

#### **Weekly Maintenance Checklist**
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Update security patches

#### **Monthly Maintenance Checklist**
- [ ] Review performance metrics
- [ ] Optimize costs
- [ ] Update documentation
- [ ] Test disaster recovery
- [ ] Review security policies

### 13.2 Update Procedures

#### **Step 1: Rhino Compute Updates**
```powershell
# On Azure VM
cd C:\RhinoCompute\compute.rhino3d
git pull origin main

# Run update script
.\script\update-compute.ps1

# Restart services
Restart-Service rhino.compute
Restart-Service rhino.compute.geometry

# Verify updates
Invoke-WebRequest -Uri "http://localhost:6500/version"
```

#### **Step 2: AppServer Updates**
```bash
# Update local repository
cd compute.rhino3d.appserver
git pull origin main

# Update dependencies
npm update

# Test locally
npm test

# Deploy to Heroku
git push heroku main

# Verify deployment
heroku logs --tail --app softlyplease-appserver
```

### 13.3 Emergency Response

#### **Step 1: Create Incident Response Plan**
```bash
cat > INCIDENT-RESPONSE.md << 'EOF'
# INCIDENT RESPONSE PLAN

## 1. Detection
- Monitor alerts from Heroku/Azure
- Check health endpoints
- Review error logs

## 2. Assessment
- Determine impact and scope
- Identify root cause
- Notify stakeholders if critical

## 3. Response
- Implement immediate fixes
- Scale resources if needed
- Communicate with users

## 4. Recovery
- Restore from backups if needed
- Test system functionality
- Monitor for recurrence

## 5. Post-Mortem
- Document incident
- Identify improvements
- Update procedures
EOF
```

#### **Step 2: Emergency Contacts**
```bash
# Create emergency contact list
cat > EMERGENCY-CONTACTS.md << 'EOF'
# EMERGENCY CONTACTS

## Technical Team
- System Administrator: admin@softlyplease.com, +1-555-0100
- Lead Developer: dev@softlyplease.com, +1-555-0101

## Service Providers
- Heroku Support: help.heroku.com
- Azure Support: portal.azure.com → Help + Support
- Rhino Support: discourse.mcneel.com

## Emergency Procedures
1. Call primary contact first
2. Escalate to secondary if no response
3. Use emergency recovery procedures
4. Document all actions taken
EOF
```

### 13.4 Documentation Updates

#### **Step 1: Regular Documentation Review**
```bash
# Create documentation review checklist
cat > DOC-REVIEW-CHECKLIST.md << 'EOF'
# DOCUMENTATION REVIEW CHECKLIST

## Monthly Review Items
- [ ] Update system architecture diagram
- [ ] Verify all IP addresses and URLs
- [ ] Update API key references
- [ ] Review recovery procedures
- [ ] Update cost estimates
- [ ] Verify contact information

## After Changes
- [ ] Update configuration documentation
- [ ] Document new procedures
- [ ] Update troubleshooting guides
- [ ] Review security implications
EOF
```

#### **Step 2: Documentation Automation**
```bash
# Create script to update documentation
cat > update-docs.sh << 'EOF'
#!/bin/bash
# update-docs.sh - Automated documentation updates

# Update system status
echo "🔄 Updating documentation..."

# Update IP addresses
VM_IP=$(curl -s http://ipinfo.io/ip)
sed -i "s/4\.248\.252\.92/$VM_IP/g" docs/*.md

# Update timestamps
DATE=$(date +%Y-%m-%d)
sed -i "s/Last Updated:.*/Last Updated: $DATE/g" docs/*.md

# Commit changes
git add docs/
git commit -m "Automated documentation update - $DATE"
git push origin main

echo "✅ Documentation updated successfully"
EOF

chmod +x update-docs.sh
```

---

## 🎯 FINAL VALIDATION CHECKLIST

### **System Readiness**
- [ ] **Azure VM** running and accessible
- [ ] **Rhino Compute** services started
- [ ] **Heroku App** deployed and responding
- [ ] **API endpoints** functional
- [ ] **Definitions** loading correctly
- [ ] **Caching** working
- [ ] **Monitoring** active
- [ ] **Backups** configured

### **Documentation Completeness**
- [ ] **System architecture** documented
- [ ] **Setup procedures** detailed
- [ ] **Troubleshooting guides** available
- [ ] **Recovery procedures** tested
- [ ] **Security measures** implemented
- [ ] **Maintenance schedules** defined

### **Emergency Preparedness**
- [ ] **Recovery procedures** documented
- [ ] **Emergency contacts** available
- [ ] **Backup locations** known
- [ ] **Alternative access** methods ready

---

## 🏆 CONCLUSION

This comprehensive guide provides everything needed to:

1. **Set up** a complete Rhino Compute system from scratch
2. **Maintain** the system with regular procedures
3. **Recover** from any disaster scenario
4. **Scale** the system as needed
5. **Secure** the system against threats
6. **Document** everything for future administrators

**This is your bulletproof guide to Rhino Compute deployment on Azure + Heroku for softlyplease.com!** 🚀

**Total Setup Time**: 4-6 hours
**Maintenance Time**: 2-4 hours/month
**Recovery Time**: 1-4 hours depending on scenario

*Remember: Test your backups regularly and keep documentation updated!* 📚

---

**Guide Version**: 2.0
**Last Updated**: December 2024
**Next Review**: June 2025

*This guide ensures your Rhino Compute system is truly bulletproof and recoverable.* 🛡️
