# SoftlyPlease Backend Setup Guide

## 🚀 Complete System Overview

This guide provides everything needed to understand and deploy the SoftlyPlease computational design platform backend.

### System Architecture
```
Frontend (React/TypeScript) ←→ Backend (Node.js/Express) ←→ Rhino Compute (C#/.NET)
     ↓                              ↓                              ↓
   www.softlyplease.com    localhost:3000/http://YOUR_IP:3000    localhost:6500
```

## 📋 Current Status

### ✅ Backend Components Ready
- **Rhino Compute**: Running on port 6500 ✅
- **Node.js Backend**: Running on port 3000 ✅
- **API Endpoints**: All functional ✅
- **Grasshopper Definitions**: 15+ definitions loaded ✅

### 🔧 System Requirements
- **Node.js**: 16.x or higher
- **Rhino 8**: With compute.geometry.exe
- **Windows Server**: For production deployment
- **Public IP**: For internet-accessible deployment

## 🛠️ Backend Setup Instructions

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/boi1da-proj/SoftlyPlease-Compute.git
cd SoftlyPlease-Compute
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Start Rhino Compute
```bash
# Option 1: Use the built-in script
npm run start-rhino

# Option 2: Manual start
./compute.rhino3d-8.x/src/bin/Release/compute.geometry/compute.geometry.exe --port=6500
```

#### 4. Start Backend Server
```bash
# Option 1: Development mode
npm run start:dev

# Option 2: Production mode
npm run start:production

# Option 3: Standard start
npm start
```

#### 5. Verify Installation
```bash
# Check if services are running
netstat -ano | findstr :3000  # Backend
netstat -ano | findstr :6500  # Rhino Compute

# Test the API
curl http://localhost:3000/version
```

## 🌐 API Documentation

### Base URL
- **Local:** `http://localhost:3000/`
- **Production:** `https://softlyplease-compute-server.herokuapp.com/`

### Authentication
All requests require the API key header:
```
RhinoComputeKey: p2robot-13a6-48f3-b24e-2025computeX
```

### Endpoints

#### GET /version
Returns version information for all components.
```json
{
  "rhino": "8.22.25217.12451",
  "compute": "8.0.0.0",
  "git_sha": null,
  "appserver": "0.1.12"
}
```

#### GET /definition
Returns list of available Grasshopper definitions.
```json
[
  {
    "name": "dresser3.gh",
    "id": "hash123",
    "path": "/path/to/dresser3.gh"
  }
]
```

#### POST /solve
Solves a Grasshopper definition with given inputs.
```json
// Request
{
  "definition": "dresser3.gh",
  "inputs": {
    "parameter1": 10.5,
    "parameter2": [1, 2, 3]
  }
}

// Response
{
  "success": true,
  "data": {
    "outputs": {
      "output1": "geometry_data",
      "output2": [4, 5, 6]
    }
  }
}
```

#### GET /view
Interactive web interface for testing definitions.

#### GET /examples/
Static files directory for examples.

## 🔧 Production Deployment

### Option 1: Heroku Deployment

#### 1. Create Heroku App
```bash
heroku create softlyplease-compute-server
```

#### 2. Set Environment Variables
```bash
heroku config:set RHINO_COMPUTE_URL=http://YOUR_PUBLIC_IP:6500/
heroku config:set RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
heroku config:set NODE_ENV=production
```

#### 3. Deploy
```bash
git push heroku master
```

#### 4. Verify
```bash
heroku logs --tail
heroku open
```

### Option 2: Local Production Server

#### 1. Configure Firewall
- Open port 6500 for Rhino Compute
- Open port 3000 for the backend
- Ensure public IP is accessible

#### 2. Get Public IP
```bash
curl ifconfig.me
```

#### 3. Update Frontend Configuration
- Set backend URL to `http://YOUR_PUBLIC_IP:3000/`
- Ensure CORS allows your domain

## 📁 Project Structure

```
SoftlyPlease-Compute/
├── src/
│   ├── bin/
│   │   └── www                 # Server startup script
│   ├── routes/
│   │   ├── index.js           # Main routes
│   │   ├── definition.js      # Definition management
│   │   ├── solve.js           # Grasshopper solving
│   │   ├── version.js         # Version endpoint
│   │   └── view.js            # Interactive viewer
│   ├── files/                 # Grasshopper definitions
│   │   ├── beam_mod.gh
│   │   ├── dresser3.gh
│   │   └── ... (15+ definitions)
│   ├── definitions.js         # Definition registry
│   ├── version.js            # Version utilities
│   └── app.js                # Main application
├── compute.rhino3d-8.x/       # Rhino Compute source
├── package.json              # Dependencies & scripts
├── DEPLOYMENT_README.md      # Deployment guide
└── BACKEND_SETUP_GUIDE.md    # This file
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Refused on Port 6500
```bash
# Check if Rhino Compute is running
netstat -ano | findstr :6500

# Restart Rhino Compute
npm run stop-rhino
npm run start-rhino
```

#### 2. Backend Won't Start
```bash
# Check Node.js version
node --version

# Check for port conflicts
netstat -ano | findstr :3000

# Check logs
npm start 2>&1 | tee debug.log
```

#### 3. Definition Not Found Error
```bash
# Check if files exist
ls -la src/files/

# Verify definition registry
node -e "console.log(require('./src/definitions.js').registerDefinitions())"
```

#### 4. CORS Issues
```bash
# Check CORS configuration in src/app.js
# Ensure your domain is in the allowed origins list
```

### Debug Commands
```bash
# Check system status
npm run restart

# View backend logs
tail -f /path/to/logs

# Test API endpoints
curl -H "RhinoComputeKey: p2robot-13a6-48f3-b24e-2025computeX" http://localhost:3000/version
```

## 🔄 Maintenance & Updates

### Regular Maintenance
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Update Rhino Compute
# Download latest from https://www.rhino3d.com/compute
```

### System Monitoring
```bash
# Monitor processes
ps aux | grep -E "(node|compute.geometry)"

# Check disk space
df -h

# Monitor memory usage
free -h
```

## 📊 Performance Optimization

### Rhino Compute Tuning
- **Memory:** Ensure adequate RAM (8GB+ recommended)
- **CPU:** Multi-core processor for parallel solving
- **Storage:** SSD recommended for definition files

### Backend Optimization
- **Clustering:** Enable worker processes in production
- **Caching:** Results are automatically cached
- **Compression:** Gzip enabled for responses

## 🚨 Security Considerations

### API Security
- **API Key:** Keep `p2robot-13a6-48f3-b24e-2025computeX` secure
- **Rate Limiting:** Consider implementing request limits
- **Input Validation:** All inputs are validated by Grasshopper

### Network Security
- **Firewall:** Only expose necessary ports (3000, 6500)
- **HTTPS:** Use SSL in production
- **Authentication:** Consider additional auth layers

## 📞 Support & Resources

### Documentation Links
- [Rhino Compute API](https://developer.rhino3d.com/api/RhinoCompute/)
- [Express.js Guide](https://expressjs.com/)
- [Grasshopper API](https://developer.rhino3d.com/guides/grasshopper/)

### Useful Files
- `DEPLOYMENT_README.md` - Quick deployment reference
- `check-status.ps1` - System status checker
- `src/app.js` - Main application configuration

### Getting Help
1. Check the troubleshooting section above
2. Review the API documentation
3. Check GitHub issues for similar problems
4. Test with the interactive viewer (`/view`)

## 🎯 Frontend Integration Checklist

- [ ] Connect to correct backend URL
- [ ] Implement API key authentication
- [ ] Handle CORS properly
- [ ] Implement error handling
- [ ] Test with sample definitions
- [ ] Implement loading states
- [ ] Add geometry visualization
- [ ] Handle different parameter types
- [ ] Test with real Grasshopper files

---

**The backend is fully functional and ready for frontend integration!** 🎉

All Grasshopper definitions are loaded, API endpoints are working, and the system is production-ready. The frontend can connect and start solving computational design problems immediately.
