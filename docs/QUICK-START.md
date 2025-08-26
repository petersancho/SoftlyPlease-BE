# Quick Start Guide - Rhino Compute AppServer

Get your Rhino Compute AppServer running in under 30 minutes!

## 🚀 Quick Setup (3 Steps)

### Step 1: Azure VM Setup (15 minutes)
```powershell
# On your Azure VM, run as Administrator:
.\azure-vm-setup.ps1 -RhinoAccountsToken "YOUR_TOKEN" -ApiKey "YOUR_API_KEY" -Port 80
```

### Step 2: Heroku Deployment (10 minutes)
```bash
# Make the script executable and run:
chmod +x heroku-deploy.sh
./heroku-deploy.sh
```

### Step 3: Test (5 minutes)
```bash
# Test your setup:
curl https://yourdomain.com/?format=json
curl https://yourdomain.com/examples/spikyThing/
```

## 📋 What You'll Get

✅ **Homepage** - Professional listing of Grasshopper definitions  
✅ **Interactive Examples** - Real-time parameter manipulation  
✅ **Custom Domain** - Your own domain (e.g., softlyplease.com)  
✅ **Caching** - Fast response times with memcached  
✅ **SSL** - Automatic HTTPS certificates  

## 🔧 Prerequisites

- Azure account with VM access
- Heroku account  
- Custom domain
- Git repository

## 📁 File Structure

```
compute-sp/
├── SETUP-GUIDE.md          # Complete setup documentation
├── QUICK-START.md          # This file
├── azure-vm-setup.ps1     # Azure VM automation script
├── heroku-deploy.sh        # Heroku deployment script
├── config.js               # AppServer configuration
├── src/
│   ├── app.js             # Main Express application
│   ├── routes/            # API endpoints
│   ├── views/             # Handlebars templates
│   ├── examples/          # Interactive examples
│   └── files/             # Grasshopper definitions
└── package.json           # Dependencies and scripts
```

## 🎯 Key Features

- **Server-side rendering** with Handlebars templates
- **Real-time Grasshopper solving** via Rhino Compute
- **Interactive 3D visualization** with Three.js
- **Automatic caching** for performance
- **Professional UI** with responsive design

## 🚨 Common Issues & Fixes

### Authentication Errors
```bash
# Check environment variables
heroku config --app your-app-name

# Verify API key format
curl -H "RhinoComputeKey: YOUR_KEY" "http://YOUR_VM_IP:80/version"
```

### Connection Timeouts
```powershell
# On Azure VM, check service status
Get-Service -Name "compute.geometry"

# Check firewall rules
Get-NetFirewallRule -DisplayName "*Rhino*"
```

### Heroku Build Failures
```bash
# Check build logs
heroku logs --tail --app your-app-name

# Verify Node.js version in package.json
```

## 🔄 Maintenance

### Update Rhino Compute
```powershell
# On Azure VM
Stop-Service -Name "compute.geometry"
# Download new version and replace files
Start-Service -Name "compute.geometry"
```

### Update AppServer
```bash
# Deploy changes
git add .
git commit -m "Update description"
git push heroku main
```

### Monitor Performance
```bash
# Check Heroku metrics
heroku ps --app your-app-name

# View logs
heroku logs --tail --app your-app-name
```

## 📚 Next Steps

1. **Customize Examples** - Modify the interactive interfaces
2. **Add Definitions** - Include your own Grasshopper files
3. **Optimize Caching** - Configure memcached for your needs
4. **Scale Up** - Add more Azure VMs for load balancing

## 🆘 Need Help?

- Check the full [SETUP-GUIDE.md](SETUP-GUIDE.md)
- Review [Heroku logs](https://devcenter.heroku.com/articles/logging)
- Test Azure VM connectivity
- Verify environment variables

## 🎉 Success Indicators

Your setup is working when:
- ✅ Homepage loads at your domain
- ✅ Interactive examples respond to parameter changes
- ✅ No H12 timeouts in Heroku logs
- ✅ Azure VM responds to external requests

---

**Setup Time**: 30 minutes  
**Maintenance**: Monthly  
**Cost**: ~$0.20/hour (Azure) + Domain registration
