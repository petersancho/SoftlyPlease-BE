# 🐘 Rhino Compute Docker Setup for Azure + Heroku

This guide replaces the problematic IIS setup with a clean Docker-based Rhino Compute deployment on Azure.

## 📋 Current Status

**❌ Problems with Current Setup:**
- IIS on Windows Server causing hostname validation issues
- Complex configuration and maintenance
- Firewall and permission issues

**✅ What This Fixes:**
- Clean Docker deployment (no IIS)
- Automatic scaling and health checks
- HTTPS support with SSL termination
- Rate limiting and security headers
- Easy deployment and updates

## 🚀 Quick Start

### Step 1: Set Up Azure VM

```bash
# Make the script executable
chmod +x azure-setup.sh

# Update the DNS_LABEL variable in azure-setup.sh (line 10)
# Change "your-rhino-compute" to your preferred name
nano azure-setup.sh

# Run the Azure setup
./azure-setup.sh
```

This will:
- Create an Ubuntu VM in Azure
- Configure networking and security groups
- Provide your VM's public IP and DNS name

### Step 2: Deploy Rhino Compute on VM

SSH into your new Azure VM:

```bash
# SSH using the IP from the previous step
ssh rhinoadmin@<YOUR_VM_IP>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Logout and log back in for group changes to take effect
exit
ssh rhinoadmin@<YOUR_VM_IP>

# Copy the Docker Compose file (from your local machine)
scp ./rhino-compute-docker.yml rhinoadmin@<YOUR_VM_IP>:~/

# Deploy Rhino Compute
docker-compose -f rhino-compute-docker.yml up -d

# Check if it's running
curl http://localhost/health
```

### Step 3: Update Heroku Configuration

```bash
# Make the script executable
chmod +x heroku-update.sh

# Update the NEW_COMPUTE_URL in heroku-update.sh (line 5)
# Use the DNS name from your Azure VM
nano heroku-update.sh

# Run the update
./heroku-update.sh
```

## 📁 Files Created

- `rhino-compute-docker.yml` - Docker Compose configuration
- `azure-setup.sh` - Azure VM creation script
- `nginx.conf` - Nginx reverse proxy configuration
- `heroku-update.sh` - Heroku configuration update script

## 🔧 Configuration Options

### Docker Compose Options

```yaml
# In rhino-compute-docker.yml
environment:
  - ASPNETCORE_URLS=http://+:80          # Port configuration
  - RhinoCompute_AllowOrigins=*           # CORS settings
  - RhinoCompute_EnableSwagger=true       # API documentation
```

### Nginx Security Features

- Rate limiting (10 requests/second)
- Security headers (XSS protection, etc.)
- SSL/TLS support (uncomment for HTTPS)
- Health check endpoint

## 🧪 Testing

### Test Rhino Compute Directly

```bash
# Test health endpoint
curl http://your-dns-name.cloudapp.azure.com/health

# Test version endpoint
curl http://your-dns-name.cloudapp.azure.com/version
```

### Test Heroku Integration

```bash
# Test status endpoint (should now work)
curl https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/status

# Test solve endpoint
curl -X POST https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"BranchNodeRnd.gh","inputs":{"Count":3}}'
```

## 🛡️ Security Features

- **Rate Limiting**: 10 requests/second with burst protection
- **Security Headers**: XSS protection, content type sniffing prevention
- **SSL Support**: Ready for HTTPS certificates
- **Network Security**: Azure NSG rules restrict access

## 🔄 Migration Path

**Current Setup:**
```
Heroku → IIS on Azure VM (❌ Problematic)
```

**New Setup:**
```
Heroku → Docker + Nginx on Azure VM (✅ Clean & Scalable)
```

## 📊 Cost Comparison

| Component | Current (IIS) | New (Docker) |
|-----------|---------------|--------------|
| VM Size | Standard_B2s | Standard_B2s |
| OS | Windows Server | Ubuntu (free) |
| Web Server | IIS (paid) | Nginx (free) |
| Management | Complex | Simple |

## 🚨 Troubleshooting

### Rhino Compute Not Starting
```bash
# Check Docker logs
docker-compose logs rhino-compute

# Check if port 80 is available
sudo netstat -tlnp | grep :80
```

### Heroku Connection Issues
```bash
# Check Heroku logs
heroku logs -a softlyplease-appserver

# Test direct connection
curl -v https://your-dns-name.cloudapp.azure.com/health
```

### Azure VM Issues
```bash
# Check VM status
az vm list -d -o table

# Check NSG rules
az network nsg rule list -g rhino-compute-rg --nsg-name rhino-compute-vmNSG
```

## 🎯 Benefits of This Setup

1. **Simplified Deployment**: Docker handles all dependencies
2. **Better Security**: Nginx provides security headers and rate limiting
3. **Easier Maintenance**: No IIS complexity
4. **Cost Effective**: Free OS and web server
5. **Scalable**: Easy to add more instances
6. **HTTPS Ready**: Built-in SSL support

## 📞 Support

If you encounter issues:

1. Check the Docker logs: `docker-compose logs`
2. Verify network connectivity: `curl http://localhost/health`
3. Test Heroku config: `heroku config -a softlyplease-appserver`
4. Check Azure NSG rules are allowing port 80

This Docker-based setup eliminates the IIS headaches while providing a production-ready Rhino Compute deployment! 🚀
