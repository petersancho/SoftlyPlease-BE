# SoftlyPlease Deployment Guide

## Overview
This guide explains how to deploy the SoftlyPlease computational design platform with Rhino Compute backend and Node.js frontend.

## Current Setup (Local Development)
- **Rhino Compute**: Running on `http://localhost:6500/`
- **Backend API**: Running on `http://localhost:3000/`
- **Frontend**: Heroku app `softlyplease-appserver`
- **Domain**: `www.softlyplease.com`

## For Production Deployment

### Option 1: Local Machine as Server (Current Setup)
If you want to keep Rhino Compute running on this machine:

1. **Make Rhino Compute accessible externally:**
   - Configure your router/firewall to forward port 6500
   - Find your public IP address
   - Update `RHINO_COMPUTE_URL` in Heroku environment variables

2. **Set Heroku Environment Variables:**
   ```
   RHINO_COMPUTE_URL=http://YOUR_PUBLIC_IP:6500/
   RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
   ```

### Option 2: Move to Azure VM (Recommended for Production)

1. **Set up Azure VM with Rhino Compute:**
   - Install Rhino 8 and Rhino Compute on Azure VM
   - Run the bootstrap script from `compute.rhino3d-8.x/script/bootstrap-server.ps1`
   - Make sure port 6500 is accessible

2. **Update Heroku Environment Variables:**
   ```
   RHINO_COMPUTE_URL=http://YOUR_AZURE_VM_IP:6500/
   RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
   ```

## Quick Start Commands

### Start Services Locally:
```bash
# Start Rhino Compute
npm run start-rhino

# Start Backend (in new terminal)
npm start
```

### Stop Services:
```bash
npm run stop-rhino
```

### Restart Everything:
```bash
npm run restart
```

## Testing the Setup

1. **Test Rhino Compute:**
   ```bash
   curl http://localhost:6500/version
   ```

2. **Test Backend API:**
   ```bash
   curl http://localhost:3000/version
   ```

3. **Test Definitions:**
   ```bash
   curl http://localhost:3000/definition
   ```

## Heroku Deployment

Your Heroku app `softlyplease-appserver` should have these environment variables:

```bash
RHINO_COMPUTE_URL=http://localhost:6500/  # Update this with your actual server IP
RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
NODE_ENV=production
```

## Domain Configuration

1. **Namecheap DNS Settings:**
   - Add A record: `www` → Your server's IP address
   - Add CNAME record: `@` → `softlyplease-appserver.herokuapp.com`

2. **Heroku Domain Settings:**
   - Add custom domain: `www.softlyplease.com`
   - Add custom domain: `softlyplease.com`

## Available Endpoints

- `GET /` - Home page
- `GET /version` - API and Rhino Compute version info
- `GET /definition` - List all available Grasshopper definitions
- `POST /solve` - Solve a Grasshopper definition
- `GET /view` - Interactive viewer for definitions
- `GET /examples/` - Static examples directory

## Grasshopper Definitions

Currently loaded definitions:
- beam_mod.gh
- Bending_gridshell.gh
- BranchNodeRnd.gh
- dresser3.gh
- rnd_lattice.gh
- rnd_node.gh
- srf_kmeans.gh
- value_list.gh
- And more...

## Troubleshooting

### Common Issues:

1. **"Connection refused" on /version endpoint:**
   - Make sure Rhino Compute is running on port 6500
   - Check that RHINO_COMPUTE_URL environment variable is correct

2. **Definitions not loading:**
   - Ensure Grasshopper files are in `assets/gh-definitions/` directory
   - Check that compute.geometry.exe has access to the files

3. **Heroku connection issues:**
   - Verify RHINO_COMPUTE_URL points to accessible server
   - Check firewall settings for port 6500
   - Ensure RHINO_COMPUTE_KEY matches the server's API key

## Security Notes

- The API key `p2robot-13a6-48f3-b24e-2025computeX` should be kept secure
- Consider setting up proper authentication for production
- Monitor usage to prevent abuse

## Next Steps

1. Test the current local setup
2. Configure external access for Rhino Compute
3. Update Heroku environment variables
4. Test the complete frontend-backend connection
5. Set up domain DNS properly
