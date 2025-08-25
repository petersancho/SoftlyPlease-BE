# Azure VM Rhino.Compute Setup Guide for SoftlyPlease.com

## 🎯 **Overview**
Your Azure VM has Rhino 8 and Rhino.Compute installed. This guide will configure the service, set up HTTPS, and integrate with your Heroku App Server.

## 📋 **VM Details**
- **VM Name**: `rhino-compute-vm724`
- **Resource Group**: `Rhino-Compute-VM_group`
- **Location**: `Canada Central`
- **Public IP**: `4.206.137.232`
- **NSG**: `Rhino-Compute-VM-nsg`
- **Status**: Rhino 8 + Rhino.Compute installed ✅

## 🔐 **Step 1: Access Your VM**

1. **RDP Connection**:
   - **Host**: `4.206.116.20`
   - **Username**: Your Azure VM admin username
   - **Password**: Your Azure VM admin password

2. **Verify Installation**:
   ```powershell
   # Check Rhino installation
   Get-ItemProperty "HKLM:\SOFTWARE\McNeel\Rhinoceros\8.0\Install" -Name Path

   # Check Rhino.Compute location
   Get-ChildItem "C:\Program Files" -Filter "*RhinoCompute*" -Recurse
   ```

## 🚀 **Step 2: Configure Rhino.Compute Service**

### **Start PowerShell as Administrator**

```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force

# Check if Rhino.Compute service exists
Get-Service -Name "*Rhino*" -ErrorAction SilentlyContinue

# If service exists, check status
Get-Service -Name "RhinoCompute" -ErrorAction SilentlyContinue

# If service doesn't exist, create it
# (Adjust path based on your installation location)
$computePath = "C:\Program Files\RhinoCompute\RhinoCompute.exe"
New-Service -Name "RhinoCompute" -BinaryPathName "$computePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

# Start the service
Start-Service -Name "RhinoCompute"

# Verify service is running
Get-Service -Name "RhinoCompute"
```

### **Configure Windows Firewall**

```powershell
# Open port 8081 for Rhino.Compute
New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound

# Verify firewall rule
Get-NetFirewallRule -Name "RhinoCompute-HTTP"
```

### **Test Local Rhino.Compute**

```powershell
# Test from the VM
Invoke-WebRequest -Uri "http://localhost:8081/version"

# Check service logs (if available)
Get-EventLog -LogName "Application" -Source "*Rhino*" -Newest 10
```

## 🌐 **Step 3: Install IIS and Configure HTTPS**

### **Install IIS and Required Features**

```powershell
# Install IIS and Application Request Routing
Install-WindowsFeature -Name Web-Server,Web-Request-Monitor,Web-Http-Redirect,Web-Performance,Web-Dyn-Compression,Web-Stat-Compression,Web-Filtering,Web-Basic-Auth,Web-Windows-Auth,Web-Net-Ext45,Web-Asp-Net45,Web-ISAPI-Ext,Web-ISAPI-Filter

# Install Application Request Routing (ARR)
Install-WindowsFeature -Name Web-ARR

# Install URL Rewrite module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
# Run the MSI installer
```

### **Configure IIS Reverse Proxy**

1. **Open IIS Manager**
2. **Create New Site**:
   - Site name: `compute.softlyplease.com`
   - Physical path: `C:\inetpub\wwwroot` (or create new folder)
   - Binding: Port 80, Host name: `compute.softlyplease.com`

3. **Configure Reverse Proxy**:
   - Open **Application Request Routing** → **Server Proxy Settings**
   - Enable proxy: ✅
   - HTTP version: **Pass through**
   - Time-out: `300` seconds
   - Response buffer threshold: `0`

4. **Add URL Rewrite Rule**:
   - Open **URL Rewrite** → **Add Rule(s)** → **Blank rule**
   - Name: `Reverse Proxy to Rhino.Compute`
   - Pattern: `(.*)`
   - Action Type: `Rewrite`
   - Rewrite URL: `http://localhost:8081/{R:1}`
   - Stop processing: ✅

## 🔒 **Step 4: Install SSL Certificate**

### **Option A: Let's Encrypt (Free & Recommended)**

```powershell
# Install win-acme for Let's Encrypt certificates
# Download from: https://www.win-acme.com/

# Run win-acme
wacs.exe --target iis --siteid 1 --email your-email@domain.com --accepttos

# This will:
# 1. Create certificate for compute.softlyplease.com
# 2. Install it in IIS
# 3. Set up auto-renewal
```

### **Option B: Self-Signed Certificate (Development Only)**

```powershell
# Create self-signed certificate
New-SelfSignedCertificate -DnsName "compute.softlyplease.com" -CertStoreLocation "cert:\LocalMachine\My"

# Get certificate thumbprint
Get-ChildItem -Path cert:\LocalMachine\My | Where-Object { $_.Subject -eq "CN=compute.softlyplease.com" } | Select-Object Thumbprint

# Bind certificate to IIS site (replace THUMBPRINT with actual value)
netsh http add sslcert ipport=0.0.0.0:443 certhash=THUMBPRINT appid="{00112233-4455-6677-8899-AABBCCDDEEFF}"
```

### **Update IIS Binding for HTTPS**

1. **In IIS Manager** → Sites → `compute.softlyplease.com`
2. **Add Site Binding**:
   - Type: `https`
   - Port: `443`
   - Host name: `compute.softlyplease.com`
   - SSL certificate: Select your certificate

3. **Remove HTTP Binding** (optional, for security):
   - Delete the port 80 binding

## 🏢 **Step 5: Configure Cloud Zoo Licensing**

### **Sign Into Rhino and Enable Cloud Zoo**

1. **Open Rhino 8** on the VM
2. **Help** → **License** → **Cloud Zoo**
3. **Sign in** with your Rhino account
4. **Enable Cloud Zoo** for metered licensing
5. **Verify** core-hour billing is active

### **Test Licensing**

```powershell
# Test Rhino.Compute with licensing
Invoke-WebRequest -Uri "http://localhost:8081/version"

# Response should show licensed status
```

## 🌍 **Step 6: DNS Configuration**

### **In Namecheap DNS Panel:**

1. **Add A Record**:
   - **Host**: `compute`
   - **Value**: `4.206.116.20`
   - **TTL**: `300` (5 minutes)

2. **Verify DNS**:
   ```bash
   # Test DNS resolution
   nslookup compute.softlyplease.com
   ```

## 🔗 **Step 7: Update Heroku App Server**

### **Update Environment Variables**

```bash
# Set the Compute URL
heroku config:set COMPUTE_URL=https://compute.softlyplease.com --app softlyplease-appserver

# Optional: Set compute API key if needed
heroku config:set COMPUTE_KEY=your-compute-key-here --app softlyplease-appserver
```

### **Restart Heroku App**

```bash
heroku ps:restart --app softlyplease-appserver
```

## 🧪 **Step 8: Test End-to-End**

### **Test Rhino.Compute Directly**

```bash
# Test HTTPS endpoint
curl https://compute.softlyplease.com/version

# Expected: Valid JSON response with Rhino.Compute version
```

### **Test App Server Integration**

```bash
# Test definition listing
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/

# Test definition metadata
curl -H "Authorization: Bearer prod-token-456" https://softlyplease.com/definitions/f3997a3b7a68e0f2

# Test computation
curl -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definitionId": "f3997a3b7a68e0f2",
    "inputs": {
      "height": 500,
      "width": 1000,
      "num": 3
    }
  }'
```

## 🔍 **Troubleshooting**

### **Rhino.Compute Service Issues**

```powershell
# Check service status
Get-Service -Name "RhinoCompute"

# Check service logs
Get-EventLog -LogName "Application" -Source "*Rhino*" -Newest 20

# Restart service
Restart-Service -Name "RhinoCompute" -Force

# Check if port 8081 is listening
netstat -ano | findstr :8081
```

### **IIS Issues**

```powershell
# Check IIS site status
Get-Website -Name "compute.softlyplease.com"

# Check URL Rewrite rules
Get-WebConfiguration -Filter "/system.webServer/rewrite/rules/rule" -PSPath "IIS:\Sites\compute.softlyplease.com"

# Test IIS reverse proxy
Invoke-WebRequest -Uri "http://localhost:8081/version" -Headers @{ "Host" = "compute.softlyplease.com" }
```

### **SSL Certificate Issues**

```powershell
# Check certificate installation
Get-ChildItem -Path cert:\LocalMachine\My | Where-Object { $_.Subject -like "*compute*" }

# Check SSL bindings
netsh http show sslcert

# Renew Let's Encrypt certificate
& "C:\Program Files\win-acme\wacs.exe" --renew
```

## 📊 **Production Checklist**

- [ ] **VM Access**: RDP working, admin privileges confirmed
- [ ] **Rhino.Compute**: Service installed, running on port 8081
- [ ] **Firewall**: Port 8081 open for inbound traffic
- [ ] **IIS**: Installed with ARR and URL Rewrite modules
- [ ] **Reverse Proxy**: Configured to forward to localhost:8081
- [ ] **SSL**: Certificate installed and bound to port 443
- [ ] **Cloud Zoo**: Licensing active and configured
- [ ] **DNS**: compute.softlyplease.com → 4.206.116.20
- [ ] **Heroku**: COMPUTE_URL updated to https://compute.softlyplease.com
- [ ] **End-to-End**: App Server can communicate with Rhino.Compute

## 🎯 **Expected URLs**

- **App Server API**: `https://softlyplease.com`
- **Rhino.Compute**: `https://compute.softlyplease.com`
- **Local Testing**: `http://localhost:8081` (VM only)

## 🚨 **Critical Notes**

1. **No Localhost in Production**: All production code must use `https://compute.softlyplease.com`
2. **Security**: Only allow HTTPS traffic to Rhino.Compute
3. **Monitoring**: Set up monitoring for the Rhino.Compute service
4. **Backups**: Configure VM backups and certificate renewal
5. **Costs**: Monitor core-hour usage in Cloud Zoo

## 📞 **Support**

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Verify **Cloud Zoo licensing** is active
3. Confirm **DNS propagation** is complete (can take 5-30 minutes)
4. Check **Heroku logs**: `heroku logs --tail --app softlyplease-appserver`

**The foundation is solid - you just need to complete the HTTPS configuration and DNS setup!** 🚀
