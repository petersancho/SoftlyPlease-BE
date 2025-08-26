#!/bin/bash

# Heroku AppServer Deployment Script
# This script automates the deployment of your Rhino Compute AppServer to Heroku

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="softlyplease-appserver"
DOMAIN="softlyplease.com"
WWW_DOMAIN="www.softlyplease.com"

echo -e "${BLUE}=== Rhino Compute AppServer Heroku Deployment ===${NC}"
echo "Starting deployment process..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI is not installed!${NC}"
    echo "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Heroku. Please login first.${NC}"
    heroku login
fi

# Step 1: Create or verify Heroku app
echo -e "${BLUE}Step 1: Setting up Heroku app...${NC}"
if heroku apps:info --app $APP_NAME &> /dev/null; then
    echo -e "${GREEN}✓ App '$APP_NAME' already exists${NC}"
else
    echo -e "${YELLOW}Creating new Heroku app: $APP_NAME${NC}"
    heroku create $APP_NAME
fi

# Step 2: Set environment variables
echo -e "${BLUE}Step 2: Setting environment variables...${NC}"

# Use predefined values for automated deployment
VM_IP="4.248.252.92"
API_KEY="p2robot-13a6-48f3-b24e-2025computeX"
PORT="6500"

# Set environment variables
echo -e "${YELLOW}Setting RHINO_COMPUTE_URL...${NC}"
heroku config:set RHINO_COMPUTE_URL="http://${VM_IP}:${PORT}" --app $APP_NAME

echo -e "${YELLOW}Setting RHINO_COMPUTE_APIKEY...${NC}"
heroku config:set RHINO_COMPUTE_APIKEY="$API_KEY" --app $APP_NAME

echo -e "${YELLOW}Setting NODE_ENV...${NC}"
heroku config:set NODE_ENV=production --app $APP_NAME

echo -e "${YELLOW}Setting PORT...${NC}"
heroku config:set PORT=5000 --app $APP_NAME

# Display current configuration
echo -e "${GREEN}✓ Environment variables set${NC}"
echo -e "${BLUE}Current configuration:${NC}"
heroku config --app $APP_NAME

# Step 3: Add Heroku remote if not exists
echo -e "${BLUE}Step 3: Setting up Git remote...${NC}"
if ! git remote | grep -q heroku; then
    echo -e "${YELLOW}Adding Heroku remote...${NC}"
    heroku git:remote -a $APP_NAME
else
    echo -e "${GREEN}✓ Heroku remote already exists${NC}"
fi

# Step 4: Deploy the application
echo -e "${BLUE}Step 4: Deploying application...${NC}"
echo -e "${YELLOW}Checking git status...${NC}"
if git status --porcelain | grep -q .; then
    echo -e "${YELLOW}Committing changes...${NC}"
    git add .
    git commit -m "Deploy to Heroku - $(date)"
else
    echo -e "${GREEN}✓ No changes to commit${NC}"
fi

echo -e "${YELLOW}Pushing to Heroku...${NC}"
git push heroku main

# Step 5: Verify deployment
echo -e "${BLUE}Step 5: Verifying deployment...${NC}"
echo -e "${YELLOW}Checking app status...${NC}"
heroku ps --app $APP_NAME

echo -e "${YELLOW}Opening app in browser...${NC}"
heroku open --app $APP_NAME

# Step 6: Configure custom domain
echo -e "${BLUE}Step 6: Configuring custom domain...${NC}"
echo -e "${YELLOW}Adding custom domain: $DOMAIN${NC}"
heroku domains:add $DOMAIN --app $APP_NAME

echo -e "${YELLOW}Adding www subdomain: $WWW_DOMAIN${NC}"
heroku domains:add $WWW_DOMAIN --app $APP_NAME

echo -e "${GREEN}✓ Custom domains added${NC}"
echo -e "${BLUE}Current domains:${NC}"
heroku domains --app $APP_NAME

# Step 7: Test the deployment
echo -e "${BLUE}Step 7: Testing deployment...${NC}"
echo -e "${YELLOW}Testing homepage...${NC}"
curl -s "https://$APP_NAME.herokuapp.com/" | head -n 5

echo -e "${YELLOW}Testing API endpoint...${NC}"
curl -s "https://$APP_NAME.herokuapp.com/?format=json" | head -n 5

# Step 8: Display final information
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "${BLUE}Your AppServer is now accessible at:${NC}"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo -e "${GREEN}https://$WWW_DOMAIN${NC}"
echo -e "${GREEN}https://$APP_NAME.herokuapp.com${NC}"

echo -e "${BLUE}Next steps:${NC}"
echo -e "${YELLOW}1. Configure DNS records for $DOMAIN to point to Heroku${NC}"
echo -e "${YELLOW}2. Test interactive examples at: https://$DOMAIN/examples/spikyThing/${NC}"
echo -e "${YELLOW}3. Monitor logs with: heroku logs --tail --app $APP_NAME${NC}"

echo -e "${BLUE}Useful commands:${NC}"
echo -e "${GRAY}heroku logs --tail --app $APP_NAME${NC}"
echo -e "${GRAY}heroku ps --app $APP_NAME${NC}"
echo -e "${GRAY}heroku config --app $APP_NAME${NC}"
echo -e "${GRAY}heroku restart --app $APP_NAME${NC}"

echo -e "${GREEN}Deployment completed successfully! 🎉${NC}"
