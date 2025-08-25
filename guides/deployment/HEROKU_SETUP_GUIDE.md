# Complete Heroku Setup Guide for SoftlyPlease Compute Backend

This comprehensive guide will walk you through setting up and deploying the SoftlyPlease Compute Node.js backend API server to Heroku. This guide is designed to be given to your developer and includes all necessary steps from account setup to production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Heroku Account Setup](#heroku-account-setup)
3. [Install Heroku CLI](#install-heroku-cli)
4. [Project Preparation](#project-preparation)
5. [Create Heroku App](#create-heroku-app)
6. [Configure Environment Variables](#configure-environment-variables)
7. [Database Setup (Optional)](#database-setup-optional)
8. [Build Configuration](#build-configuration)
9. [Deploy to Heroku](#deploy-to-heroku)
10. [Domain Configuration](#domain-configuration)
11. [Post-Deployment Testing](#post-deployment-testing)
12. [Monitoring and Logs](#monitoring-and-logs)
13. [Troubleshooting](#troubleshooting)
14. [Security Best Practices](#security-best-practices)
15. [Maintenance](#maintenance)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or higher (currently using 18.x)
- **Git**: Latest version
- **Heroku CLI**: Latest version
- **Package Manager**: npm (comes with Node.js)
- **Dependencies**: All packages in package.json (including md5-file, compute-rhino3d, memjs, camelcase-keys)

### Verify Prerequisites
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

### Required Files in Your Project
Ensure these files exist in your project root:
- `package.json` - Contains dependencies and scripts
- `Procfile` - Defines how Heroku runs your app
- `src/app.js` - Main application file
- `src/bin/www` - Server startup file

## Heroku Account Setup

### 1. Create Heroku Account
1. Go to [heroku.com](https://heroku.com)
2. Click "Sign Up" and create a new account
3. Verify your email address

### 2. Add Payment Information (Optional but Recommended)
- Heroku offers a free tier, but adding payment info unlocks additional features
- Go to Account Settings → Billing → Add Credit Card
- This enables more dynos, custom domains, and better support

## Install Heroku CLI

### Windows Installation
```powershell
# Using Chocolatey (recommended)
choco install heroku-cli

# Or download from: https://devcenter.heroku.com/articles/heroku-cli#download-and-install
```

### macOS Installation
```bash
# Using Homebrew (recommended)
brew tap heroku/brew && brew install heroku

# Or using npm
npm install -g heroku
```

### Linux Installation
```bash
# Using snap
sudo snap install --classic heroku

# Or using npm
npm install -g heroku
```

### Verify Installation
```bash
heroku --version
```

### Login to Heroku
```bash
heroku login
```
This will open your browser for authentication. Alternatively:
```bash
heroku login -i  # Login via terminal
```

## Project Preparation

### 1. Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit for Heroku deployment"
```

### 2. Verify Package.json Configuration
Ensure your `package.json` has:
```json
{
  "name": "@mcneel/compute.rhino3d.appserver",
  "version": "0.1.12",
  "engines": {
    "node": "16.x"
  },
  "scripts": {
    "start": "node ./src/bin/www",
    "start:production": "NODE_ENV=production node ./src/bin/www"
  }
}
```

### 3. Verify Procfile
Your `Procfile` should contain:
```
web: npm run start
```

### 4. Check Node.js Engine Compatibility
Your project is configured for Node.js 16.x. Heroku supports:
- Node.js 16.x (your current setting)
- Node.js 18.x (recommended for new projects)
- Node.js 20.x (latest LTS)

To update to Node.js 18.x, modify `package.json`:
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

## Create Heroku App

### Option 1: Create New App via CLI
```bash
# Create app with specific name
heroku create softlyplease-appserver

# Or let Heroku generate a name
heroku create
```

### Option 2: Create via Heroku Dashboard
1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Click "New" → "Create new app"
3. Enter app name: `softlyplease-appserver`
4. Choose region: United States (or Europe, depending on your needs)
5. Click "Create app"

### Connect Local Repository to Heroku App
```bash
# Add Heroku remote
heroku git:remote -a softlyplease-appserver

# Verify remote was added
git remote -v
```

## Configure Environment Variables

### Critical Environment Variables

Set these environment variables in Heroku:

```bash
# Set environment variables via CLI
heroku config:set RHINO_COMPUTE_URL="http://localhost:6500/"
heroku config:set RHINO_COMPUTE_KEY="p2robot-13a6-48f3-b24e-2025computeX"
heroku config:set NODE_ENV="production"
heroku config:set CORS_ORIGIN="https://www.softlyplease.com"
heroku config:set PORT="3000"
```

### Alternative: Set via Heroku Dashboard
1. Go to Heroku Dashboard → Your App → Settings → Config Vars
2. Add the following variables:
   - **Key**: `RHINO_COMPUTE_URL` → **Value**: `http://localhost:6500/`
   - **Key**: `RHINO_COMPUTE_KEY` → **Value**: `p2robot-13a6-48f3-b24e-2025computeX`
   - **Key**: `NODE_ENV` → **Value**: `production`
   - **Key**: `CORS_ORIGIN` → **Value**: `https://www.softlyplease.com`
   - **Key**: `PORT` → **Value**: `3000`

### For Production with External Rhino Compute Server

If you're using an Azure VM or external server for Rhino Compute:

```bash
# Replace YOUR_SERVER_IP with actual IP address
heroku config:set RHINO_COMPUTE_URL="http://YOUR_SERVER_IP:6500/"
```

## Database Setup (Optional)

Your current application doesn't appear to require a database, but if you add one later:

### Add PostgreSQL Database
```bash
# Add Heroku Postgres
heroku addons:create heroku-postgresql:hobby-dev

# Or via Dashboard: Resources → Add-ons → Heroku Postgres
```

### Database Environment Variables
```bash
# Set database URL (automatically set by Heroku)
heroku config:set DATABASE_URL="your-database-url"
```

## Build Configuration

### 1. Node.js Buildpack
Heroku should automatically detect Node.js. Verify:
```bash
heroku buildpacks
```

If not set, configure it:
```bash
heroku buildpacks:set heroku/nodejs
```

### 2. Optimize Dependencies
Ensure your `package.json` has production dependencies:
```json
{
  "dependencies": {
    "express": "~4.16.1",
    "cors": "2.8.5",
    "compute-rhino3d": "^0.13.0-beta",
    // ... other dependencies
  }
}
```

### 3. Add .env File for Local Development
Create `.env` file in project root:
```
RHINO_COMPUTE_URL=http://localhost:6500/
RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Important**: Add `.env` to `.gitignore`:
```
# .gitignore
.env
node_modules/
```

## Deploy to Heroku

### 1. Prepare for Deployment
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Heroku deployment"

# Push to Heroku
git push heroku main
```

### 2. Monitor Deployment
```bash
# Check deployment status
heroku releases

# View build logs
heroku logs --tail
```

### 3. Scale the Application
```bash
# Set dyno type (free tier)
heroku ps:scale web=1

# Check dyno status
heroku ps
```

## Domain Configuration

### 1. Add Custom Domain to Heroku
```bash
# Add domains
heroku domains:add www.softlyplease.com
heroku domains:add softlyplease.com
```

### 2. Configure DNS Settings

#### Namecheap DNS Configuration:
1. Go to Namecheap Dashboard → Domain List → Manage
2. Go to Advanced DNS
3. Add the following records:

**For www.softlyplease.com:**
- **Type**: CNAME
- **Host**: www
- **Value**: `softlyplease-appserver.herokuapp.com`
- **TTL**: 300

**For softlyplease.com (root domain):**
- **Type**: A Record
- **Host**: @
- **Value**: Get the IP from Heroku:
  ```bash
  heroku domains
  ```
- **TTL**: 300

### 3. Verify Domain Configuration
```bash
# Check Heroku domain status
heroku domains

# Test DNS propagation
nslookup www.softlyplease.com
```

## Post-Deployment Testing

### 1. Test Basic Endpoints
```bash
# Test main endpoint
curl https://softlyplease-appserver.herokuapp.com/

# Test version endpoint
curl https://softlyplease-appserver.herokuapp.com/version

# Test definitions endpoint
curl https://softlyplease-appserver.herokuapp.com/definition
```

### 2. Test with Custom Domain
```bash
# Test custom domain
curl https://www.softlyplease.com/
curl https://www.softlyplease.com/version
```

### 3. Test Rhino Compute Connection
```bash
# Check if app can connect to Rhino Compute
curl https://www.softlyplease.com/version
```

## Monitoring and Logs

### View Application Logs
```bash
# View recent logs
heroku logs

# Stream logs in real-time
heroku logs --tail

# View logs for specific dyno
heroku logs --dyno web.1

# View logs from last 24 hours
heroku logs --num 1500
```

### Monitor Application Performance
```bash
# Check dyno status
heroku ps

# View application metrics
heroku metrics

# Check memory usage
heroku ps:info web.1
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Crashes on Startup
```bash
# Check logs for errors
heroku logs --tail

# Check if all dependencies are installed
heroku run npm list
```

#### 2. "Connection Refused" Errors
This usually means the Rhino Compute server is not accessible:
```bash
# Check environment variables
heroku config

# Test connection from Heroku dyno
heroku run curl http://localhost:6500/version
```

#### 3. Build Failures
```bash
# Check build logs
heroku builds

# Clear build cache and redeploy
heroku builds:cache:purge
git push heroku main --force
```

#### 4. Port Binding Issues
Heroku assigns a random port via `PORT` environment variable:
```javascript
// In src/bin/www, ensure you're using process.env.PORT
const port = normalizePort(process.env.PORT || '3000')
```

#### 5. Memory Issues
```bash
# Upgrade dyno type if needed
heroku ps:resize web=hobby

# Check memory usage
heroku metrics:memory
```

### Quick Debug Commands
```bash
# Open remote console
heroku run bash

# Check Node.js version on Heroku
heroku run node --version

# Test network connectivity
heroku run curl -I http://localhost:6500/
```

## Security Best Practices

### 1. Environment Variables Security
- Never commit sensitive data to Git
- Use different API keys for development and production
- Rotate keys regularly

### 2. Network Security
```bash
# Enable HTTPS redirect (if needed)
heroku config:set FORCE_HTTPS=true
```

### 3. Access Control
- Implement authentication if needed
- Use API keys for external services
- Monitor access logs

### 4. Dependencies
```bash
# Keep dependencies updated
npm audit
npm update

# Check for security vulnerabilities
npm audit fix
```

## Maintenance

### Regular Maintenance Tasks

#### 1. Update Dependencies
```bash
# Update package.json
npm update

# Test locally
npm test

# Deploy updates
git add .
git commit -m "Update dependencies"
git push heroku main
```

#### 2. Monitor Performance
```bash
# Check response times
heroku metrics:response-time

# Monitor errors
heroku logs --num 100 | grep -i error
```

#### 3. Backup Configuration
```bash
# Backup environment variables
heroku config > config_backup.txt

# Backup app settings
heroku apps:info > app_info_backup.txt
```

#### 4. Cost Optimization
```bash
# Check current usage
heroku ps

# Scale down during low traffic
heroku ps:scale web=1

# Set up auto-scaling if needed
heroku dyno:auto
```

## Advanced Configuration

### Custom Build Steps
Add `heroku-postbuild` script to `package.json`:
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

### Worker Processes
For better performance, use multiple workers:
```javascript
// In src/bin/www
const throng = require('throng')
const WORKERS = process.env.WEB_CONCURRENCY || 1

throng({
  workers: WORKERS,
  lifetime: Infinity,
  start: startWorker
})
```

### Health Check Endpoint
Add a health check endpoint for monitoring:
```javascript
// In src/app.js or routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

## Support Resources

### Heroku Documentation
- [Heroku Node.js Documentation](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku CLI Reference](https://devcenter.heroku.com/articles/heroku-cli-commands)
- [Heroku Deployment Best Practices](https://devcenter.heroku.com/articles/deploying-nodejs)

### Getting Help
```bash
# Heroku CLI help
heroku help

# Specific command help
heroku help create

# Heroku support
heroku support
```

### Community Resources
- [Heroku Dev Center](https://devcenter.heroku.com)
- [Stack Overflow - Heroku Tag](https://stackoverflow.com/questions/tagged/heroku)
- [Heroku Status Page](https://status.heroku.com)

---

## Quick Reference Commands

```bash
# Create and deploy
heroku create softlyplease-appserver
git push heroku main

# Set environment variables
heroku config:set RHINO_COMPUTE_URL="http://localhost:6500/"
heroku config:set NODE_ENV="production"

# View logs
heroku logs --tail

# Scale application
heroku ps:scale web=1

# Open app in browser
heroku open

# View app info
heroku apps:info
```

## Final Checklist

Before going live, verify:
- [ ] Heroku app is created and configured
- [ ] Environment variables are set correctly
- [ ] Domain is configured and DNS is propagated
- [ ] Application deploys successfully
- [ ] All endpoints are accessible
- [ ] Rhino Compute connection is working
- [ ] SSL certificate is active (Heroku provides this automatically)
- [ ] Monitoring is set up
- [ ] Backup procedures are in place

This guide provides everything needed to set up and maintain the SoftlyPlease Compute frontend on Heroku. Follow each section carefully, and don't hesitate to refer back to the troubleshooting section if you encounter issues.
