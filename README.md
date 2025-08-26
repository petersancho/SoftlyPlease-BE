# Rhino Compute AppServer - Production Ready

A professional, production-ready Rhino Compute AppServer with custom domain support, interactive Grasshopper examples, and enterprise-grade architecture.

## 🚀 Quick Start

Get your Rhino Compute AppServer running in under 30 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/compute-sp.git
cd compute-sp

# 2. Set up Azure VM (run as Administrator)
./scripts/azure/azure-vm-setup.ps1 -RhinoAccountsToken "YOUR_TOKEN" -ApiKey "YOUR_API_KEY"

# 3. Deploy to Heroku
./scripts/heroku/heroku-deploy.sh

# 4. Test your setup
curl https://yourdomain.com/?format=json
```

## 📋 What You Get

✅ **Professional AppServer** - Node.js/Express with Handlebars templates  
✅ **Interactive Examples** - Real-time Grasshopper parameter manipulation  
✅ **Custom Domain** - Your own domain (e.g., softlyplease.com)  
✅ **Enterprise Caching** - Memcached and in-memory caching  
✅ **SSL Security** - Automatic HTTPS certificates  
✅ **Production Ready** - Monitoring, logging, and error handling  

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │───▶│  Heroku AppServer │───▶│ Azure VM Rhino  │
│  (Custom Domain) │    │   (Node.js/Express) │    │   Compute Server │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Repository Structure

```
compute-sp/
├── README.md                    # This file
├── package.json                 # Dependencies and scripts
├── Procfile                     # Heroku deployment
├── Dockerfile                   # Container support
├── src/                         # Application source code
│   ├── app.js                  # Main Express application
│   ├── routes/                 # API endpoints
│   ├── views/                  # Handlebars templates
│   ├── examples/               # Interactive examples
│   └── files/                  # Grasshopper definitions
├── docs/                        # Documentation
│   └── setup/                  # Setup guides
│       ├── SETUP-GUIDE.md      # Comprehensive setup guide
│       └── QUICK-START.md      # 30-minute quick start
└── scripts/                     # Automation scripts
    ├── azure/                  # Azure VM setup
    │   └── azure-vm-setup.ps1  # Complete VM automation
    ├── heroku/                 # Heroku deployment
    │   └── heroku-deploy.sh    # Automated deployment
    └── config-template.js      # Configuration template
```

## 🔧 Prerequisites

- **Azure Account** - For Windows VM hosting
- **Heroku Account** - For AppServer deployment
- **Custom Domain** - Your own domain name
- **Rhino 7 License** - For Rhino Compute server
- **Git Repository** - For version control

## 📚 Documentation

- **[Quick Start Guide](docs/setup/QUICK-START.md)** - Get running in 30 minutes
- **[Complete Setup Guide](docs/setup/SETUP-GUIDE.md)** - Comprehensive documentation
- **[Azure VM Setup](scripts/azure/azure-vm-setup.ps1)** - Automated VM configuration
- **[Heroku Deployment](scripts/heroku/heroku-deploy.sh)** - Automated deployment

## 🎯 Key Features

### AppServer
- **Server-side rendering** with Handlebars templates
- **RESTful API** for Grasshopper definition solving
- **Automatic caching** for performance optimization
- **Professional UI** with responsive design

### Rhino Compute Integration
- **Real-time solving** of Grasshopper definitions
- **Geometry processing** via Rhino Compute server
- **3D visualization** with Three.js integration
- **Parameter manipulation** with live updates

### Production Features
- **Custom domain support** with SSL certificates
- **Enterprise caching** with memcached
- **Monitoring and logging** for production use
- **Error handling** and graceful degradation

## 🚨 Common Issues & Solutions

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

## 📊 Performance & Scaling

- **Caching Strategy** - Multi-level caching for optimal performance
- **Load Balancing** - Support for multiple Azure VMs
- **CDN Integration** - Browser caching and edge optimization
- **Database Options** - MongoDB and Redis support ready

## 🔒 Security Features

- **API Key Authentication** - Secure access to Rhino Compute
- **HTTPS Enforcement** - Automatic SSL certificate management
- **CORS Configuration** - Controlled cross-origin access
- **Rate Limiting** - Protection against abuse
- **Security Headers** - Helmet.js integration

## 💰 Cost Optimization

- **Azure VM**: ~$0.20/hour for t2.medium
- **Heroku**: Free tier available for development
- **Custom Domain**: Annual registration fee
- **SSL Certificates**: Free with Heroku

## 🆘 Support & Resources

- **Documentation**: Complete guides in `docs/setup/`
- **Scripts**: Automated setup in `scripts/`
- **Examples**: Working examples in `src/examples/`
- **Community**: Open source with active development

## 🎉 Success Indicators

Your setup is working when:
- ✅ Homepage loads at your custom domain
- ✅ Interactive examples respond to parameter changes
- ✅ No H12 timeouts in Heroku logs
- ✅ Azure VM responds to external requests
- ✅ SSL certificates are active

## 📈 Next Steps

1. **Customize Examples** - Modify the interactive interfaces
2. **Add Definitions** - Include your own Grasshopper files
3. **Optimize Caching** - Configure memcached for your needs
4. **Scale Up** - Add more Azure VMs for load balancing
5. **Monitor & Alert** - Set up production monitoring

---

**Setup Time**: 30 minutes  
**Maintenance**: Monthly  
**Production Ready**: ✅ Yes  
**Enterprise Grade**: ✅ Yes  

Built with ❤️ for the Rhino community
