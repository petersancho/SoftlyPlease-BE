# SoftlyPlease Rhino Compute AppServer - Production Deployment

This guide will help you deploy the Rhino Compute AppServer to your domain www.softlyplease.com using the Azure VM.

## 🚀 Quick Deployment

### Option 1: Windows Service (Recommended)
```powershell
# Run as Administrator
npm run install-service
```

### Option 2: IIS with HttpPlatformHandler
1. Install IIS and HttpPlatformHandler
2. Copy files to `C:\inetpub\wwwroot\softlyplease`
3. Use the provided `web.config`

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ Rhino Compute server running on port 6500
- ✅ Administrator access for service installation
- ✅ Domain DNS pointing to this server

## 🛠️ Step-by-Step Deployment

### 1. Install Dependencies
```bash
cd compute.rhino3d.appserver
npm install
```

### 2. Install as Windows Service (Recommended)
```powershell
# Must run as Administrator
npm run install-service

# Or manually:
# .\scripts\install-service.ps1 -ServiceName "SoftlyPleaseAppServer" -Port "80"
```

### 3. Configure Domain DNS
Point your Namecheap DNS records:
- **A Record**: `@` → Your Azure VM public IP
- **A Record**: `www` → Your Azure VM public IP

### 4. Test Local Access
```
http://localhost:80          # Local access
http://your-server-ip:80     # External IP access
https://www.softlyplease.com # Domain access (after DNS)
```

## 🔧 Service Management

### Start/Stop/Restart Service
```powershell
# Start service
nssm start SoftlyPleaseAppServer

# Stop service
nssm stop SoftlyPleaseAppServer

# Restart service
nssm restart SoftlyPleaseAppServer

# Check status
nssm status SoftlyPleaseAppServer
```

### Uninstall Service
```powershell
npm run uninstall-service
# Or: .\scripts\uninstall-service.ps1
```

## 📁 File Structure After Deployment

```
C:\compute-sp\compute.rhino3d.appserver\
├── src\                     # Application source
├── logs\                    # Service logs
├── scripts\                 # Service management
├── web.config              # IIS configuration
├── package.json            # Dependencies & scripts
└── DEPLOYMENT_README.md    # This file
```

## 🌐 Domain Configuration

### Namecheap DNS Setup
1. **Login** to Namecheap account
2. **Go to** Domain List → Manage
3. **Click** Advanced DNS
4. **Add Records**:
   ```
   Type: A Record
   Host: @
   Value: [Your Azure VM IP]
   TTL: 600

   Type: A Record
   Host: www
   Value: [Your Azure VM IP]
   TTL: 600
   ```

### Firewall Configuration
Ensure Windows Firewall allows port 80:
```powershell
# Allow port 80 inbound
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

## 🔍 Troubleshooting

### Check Service Status
```powershell
Get-Service SoftlyPleaseAppServer
```

### View Service Logs
```powershell
# Check logs in:
type .\logs\service-out.log
type .\logs\service-error.log
```

### Check Node.js App Directly
```bash
# Test the app directly on port 8080
npm run start:prod

# Or test on port 3000 for development
npm start
```

### Common Issues

**Port 80 Access Denied:**
- Run service installation as Administrator
- Use IIS reverse proxy configuration

**Service Won't Start:**
- Check Node.js installation
- Verify dependencies: `npm install`
- Check logs in `.\logs\`

**Domain Not Working:**
- Verify DNS propagation (may take 24-48 hours)
- Check Azure VM public IP is correct
- Ensure firewall allows port 80

## 🔄 Updates

To update the application:
1. Stop the service: `nssm stop SoftlyPleaseAppServer`
2. Pull latest changes or update files
3. Run `npm install` if dependencies changed
4. Start the service: `nssm start SoftlyPleaseAppServer`

## 📞 Support

- Check logs in `.\logs\` directory
- Verify Rhino Compute server on port 6500
- Test locally before domain configuration

## 🎯 Production Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Rhino Compute server running on port 6500
- [ ] Windows service installed and running
- [ ] Port 80 accessible through firewall
- [ ] Domain DNS pointing to server IP
- [ ] SSL certificate configured (if needed)
- [ ] Logs configured and monitored

---

**Your app should be accessible at: https://www.softlyplease.com**

The examples viewer will be at: `https://www.softlyplease.com/view`
