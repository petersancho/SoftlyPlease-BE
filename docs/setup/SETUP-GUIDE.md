# Complete Rhino Compute AppServer Setup Guide

This guide replicates the exact setup for deploying a Rhino Compute AppServer with custom domain on Heroku, connected to a Rhino Compute server running on Azure VM.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │───▶│  Heroku AppServer │───▶│ Azure VM Rhino  │
│  (softlyplease.com) │    │   (Node.js/Express) │    │   Compute Server │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

- Azure account with VM access
- Heroku account
- Custom domain (softlyplease.com)
- Git repository access
- Node.js development environment

## Part 1: Azure VM Rhino Compute Setup

### 1.1 Create Azure VM
- **OS**: Windows Server 2019
- **Size**: t2.medium (2 vCPUs, 4GB RAM minimum)
- **Storage**: 30GB OS disk
- **Network**: Public IP with port 80 open

### 1.2 Configure Security Groups
Allow inbound traffic on:
- Port 80 (HTTP)
- Port 3389 (RDP)
- Port 6500 (Rhino Compute - if different from 80)

### 1.3 Install Rhino Compute
Run this PowerShell script on the VM as Administrator:

```powershell
# Download and run the Rhino Compute installer
Invoke-WebRequest -Uri "https://github.com/mcneel/compute.rhino3d/releases/latest/download/compute.rhino3d.zip" -OutFile "compute.zip"
Expand-Archive -Path "compute.zip" -DestinationPath "C:\compute" -Force

# Set environment variables
$env:RHINO_COMPUTE_URLS = "http://0.0.0.0:80"
$env:RHINO_COMPUTE_APIKEY = "YOUR_GENERATED_API_KEY"
$env:RHINO_ACCOUNTS_TOKEN = "YOUR_RHINO_ACCOUNTS_TOKEN"

# Install as Windows Service
cd C:\compute
.\compute.geometry.exe install --start
```

### 1.4 Generate API Key
```powershell
# Generate a new API key for client authentication
$apiKey = [guid]::NewGuid().ToString()
Write-Host "New API Key: $apiKey"
```

### 1.5 Verify Installation
```powershell
# Check if service is running
Get-Service -Name "compute.geometry"

# Test local connection
curl http://localhost:80/version
```

## Part 2: Heroku AppServer Deployment

### 2.1 Clone Repository
```bash
git clone https://github.com/your-username/compute-sp.git
cd compute-sp
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Create Heroku App
```bash
# Login to Heroku
heroku login

# Create new app
heroku create softlyplease-appserver

# Set environment variables
heroku config:set RHINO_COMPUTE_URL=http://YOUR_AZURE_VM_IP:80 --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=YOUR_GENERATED_API_KEY --app softlyplease-appserver
heroku config:set NODE_ENV=production --app softlyplease-appserver
```

### 2.4 Deploy to Heroku
```bash
# Add Heroku remote
heroku git:remote -a softlyplease-appserver

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku main
```

### 2.5 Verify Deployment
```bash
# Open the app
heroku open --app softlyplease-appserver

# Check logs
heroku logs --tail --app softlyplease-appserver
```

## Part 3: Custom Domain Configuration

### 3.1 Configure DNS
Add these records to your domain registrar:

```
Type: A
Name: @
Value: [Heroku IP from heroku domains:add]

Type: CNAME  
Name: www
Value: softlyplease-appserver.herokuapp.com
```

### 3.2 Add Domain to Heroku
```bash
# Add custom domain
heroku domains:add softlyplease.com --app softlyplease-appserver
heroku domains:add www.softlyplease.com --app softlyplease-appserver
```

### 3.3 SSL Certificate
Heroku automatically provisions SSL certificates for custom domains.

## Part 4: AppServer Configuration

### 4.1 Environment Variables
Ensure these are set in Heroku:

```bash
RHINO_COMPUTE_URL=http://YOUR_AZURE_VM_IP:80
RHINO_COMPUTE_APIKEY=YOUR_GENERATED_API_KEY
NODE_ENV=production
PORT=5000
```

### 4.2 File Structure
```
src/
├── app.js                 # Main Express application
├── routes/
│   ├── index.js          # Homepage and definition listing
│   ├── solve.js          # Grasshopper solving endpoint
│   └── definition.js     # Definition serving
├── views/
│   └── homepage.hbs      # Handlebars template
├── examples/             # Interactive examples
└── files/                # Grasshopper definition files
```

### 4.3 Key Configuration Files

#### app.js
```javascript
const config = require('../config')
app.use('/examples', express.static(__dirname + '/examples'))
app.set('view engine', 'hbs')
app.set('views', './src/views')
```

#### config.js
```javascript
module.exports = {
  rhino: {
    url: process.env.RHINO_COMPUTE_URL || 'http://localhost:6500',
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'your-api-key'
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  }
}
```

## Part 5: Testing and Verification

### 5.1 Test Homepage
Visit `https://softlyplease.com` - should show list of Grasshopper definitions.

### 5.2 Test Interactive Examples
Visit `https://softlyplease.com/examples/spikyThing/` - should load interactive interface.

### 5.3 Test API Endpoints
```bash
# Test definition listing
curl https://softlyplease.com/?format=json

# Test solve endpoint
curl -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"spikyThing","inputs":{"radius":10,"count":20,"length":5}}'
```

## Part 6: Troubleshooting

### 6.1 Common Issues

#### Authentication Errors
- Verify API key is correct in both Azure VM and Heroku
- Check environment variable names match exactly
- Ensure Rhino Compute service is running on Azure VM

#### Connection Timeouts
- Verify Azure VM firewall allows connections on port 80
- Check security group rules
- Ensure Rhino Compute is listening on all interfaces

#### Heroku Deployment Issues
- Check build logs: `heroku logs --tail`
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

### 6.2 Monitoring
```bash
# Check Heroku logs
heroku logs --tail --app softlyplease-appserver

# Check Azure VM service status
Get-Service -Name "compute.geometry"

# Test Rhino Compute connectivity
curl http://YOUR_AZURE_VM_IP:80/version
```

## Part 7: Maintenance and Updates

### 7.1 Update Rhino Compute
```powershell
# On Azure VM
Stop-Service -Name "compute.geometry"
# Download new version and replace files
Start-Service -Name "compute.geometry"
```

### 7.2 Update AppServer
```bash
# Make changes locally
git add .
git commit -m "Update description"
git push heroku main
```

### 7.3 Add New Definitions
1. Add .gh file to `src/files/` directory
2. Add description to `src/routes/index.js`
3. Create example interface in `src/examples/`
4. Deploy to Heroku

## Security Considerations

- API keys should be rotated regularly
- Use HTTPS for all external communications
- Monitor Azure VM access logs
- Regular security updates for Windows Server
- Consider VPN for Azure VM access

## Cost Optimization

- Azure VM: ~$0.20/hour for t2.medium
- Heroku: Free tier available for development
- Custom domain: Annual registration fee
- SSL certificates: Free with Heroku

## Support and Resources

- [Rhino Compute Documentation](https://github.com/mcneel/compute.rhino3d)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Azure VM Documentation](https://docs.microsoft.com/azure/virtual-machines/)

---

**Last Updated**: August 26, 2025  
**Setup Time**: 2-3 hours  
**Maintenance**: Monthly updates recommended
