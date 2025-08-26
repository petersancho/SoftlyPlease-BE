# SoftlyPlease.com AppServer Setup Guide

## Overview
This guide explains how to get your Grasshopper definitions working on softlyplease.com using the Rhino Compute AppServer and Heroku.

## Architecture
```
softlyplease.com (Frontend)
        ↓
  AppServer on Heroku (Node.js)
        ↓
Rhino Compute on Azure VM (Windows)
        ↓
    Rhino + Grasshopper
```

## Current Setup

### ✅ What's Already Working
- Rhino Compute server running on Azure VM (IP: 4.248.252.92)
- API key authentication configured
- AppServer code ready for deployment
- 14 Grasshopper definitions available in `/src/files/`

### 🔧 What Needs to Be Done

## Step 1: Deploy AppServer to Heroku

### Option A: Use the Deployment Script
```powershell
# Navigate to appserver directory
cd compute.rhino3d.appserver

# Run the deployment script
.\deploy-to-heroku.ps1
```

### Option B: Manual Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create softlyplease-appserver

# Set environment variables
heroku config:set RHINO_COMPUTE_URL="http://4.248.252.92/"
heroku config:set RHINO_COMPUTE_KEY="softlyplease-secure-key-2024"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

## Step 2: Test the Setup

### Test API Endpoints

1. **List available definitions:**
   ```
   GET https://softlyplease-appserver.herokuapp.com/
   ```

2. **Get definition info:**
   ```
   GET https://softlyplease-appserver.herokuapp.com/definition/dresser3
   ```

3. **Solve a definition:**
   ```bash
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

## Step 3: Update softlyplease.com Frontend

Update your website to call the AppServer endpoints:

```javascript
// Example: Call AppServer from your website
const response = await fetch('https://softlyplease-appserver.herokuapp.com/solve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    definition: 'spiky_thing', // or any definition name
    inputs: {
      'RH_IN:radius': 1.0,
      'RH_IN:count': 8,
      'RH_IN:length': 2.0
    }
  })
});

const result = await response.json();
// Process the result (geometry data)
```

## Available Definitions

Your AppServer includes these Grasshopper definitions:

1. **beam_mod.gh** - Beam modification
2. **Bending_gridshell.gh** - Grid shell bending analysis
3. **BranchNodeRnd.gh** - Branch node randomization
4. **brep_union.gh** - BREP union operations
5. **delaunay.gh** - Delaunay triangulation
6. **docString.gh** - Documentation string processing
7. **dresser3.gh** - Dresser design
8. **metaballTable.gh** - Metaball table generation
9. **QuadPanelAperture.gh** - Quad panel with apertures
10. **rnd_lattice.gh** - Random lattice generation
11. **rnd_node.gh** - Random node placement
12. **SampleGHConvertTo3dm.gh** - Convert to 3DM format
13. **srf_kmeans.gh** - Surface K-means clustering
14. **value_list.gh** - Value list processing

## Grasshopper Definition Requirements

For your definitions to work, they must have:

1. **Input parameters** named with `RH_IN:` prefix (e.g., `RH_IN:radius`)
2. **Output parameters** named with `RH_OUT:` prefix (e.g., `RH_OUT:mesh`)
3. **Grouped parameters** - All inputs/outputs should be grouped

## API Key Authentication

The AppServer uses this API key for authentication with Rhino Compute:
- **Header:** `RhinoComputeKey`
- **Value:** `softlyplease-secure-key-2024`

## Monitoring and Logs

### Check AppServer Logs
```bash
heroku logs --tail --app softlyplease-appserver
```

### Monitor Performance
- Visit Heroku dashboard for metrics
- Check response times and error rates
- Monitor memory usage

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check API key is correct: `softlyplease-secure-key-2024`
   - Ensure header is: `RhinoComputeKey` (not `Authorization`)

2. **500 Internal Server Error**
   - Check Rhino Compute server is running
   - Verify compute server URL is accessible
   - Check AppServer logs for detailed error

3. **Definition Not Found**
   - Ensure definition file exists in `/src/files/`
   - Check definition name matches exactly

### Debug Commands

```bash
# Test local AppServer
npm start

# Test production AppServer
npm run start:prod

# Check Heroku config
heroku config --app softlyplease-appserver
```

## Next Steps

1. **Deploy to Heroku** using the script above
2. **Test endpoints** with the available definitions
3. **Update softlyplease.com** to call the AppServer
4. **Add more definitions** by placing `.gh` files in `/src/files/`
5. **Set up caching** by adding MemCachier add-on to Heroku

## Support

For issues or questions:
- Check Heroku logs: `heroku logs --app softlyplease-appserver`
- Verify Rhino Compute server is accessible from Heroku
- Test locally first before deploying

The setup should work seamlessly once deployed! 🚀
