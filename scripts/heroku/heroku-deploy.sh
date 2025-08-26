#!/bin/bash

# Heroku Redeploy Script for softlyplease.com
echo "🔧 SOFTLYPLEASE.COM - Heroku Redeployment Script"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${YELLOW}🔧 Step $1: $2${NC}"
}

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        print_status "$description responding"
        return 0
    else
        print_error "$description not responding"
        return 1
    fi
}

# Step 1: Check Heroku CLI
print_step "1" "Checking Heroku CLI installation..."
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI not found. Installing..."
    curl https://cli-assets.heroku.com/install.sh | sh
    if ! command -v heroku &> /dev/null; then
        print_error "Failed to install Heroku CLI. Please install manually."
        exit 1
    fi
else
    print_status "Heroku CLI found"
fi

# Step 2: Login to Heroku
print_step "2" "Checking Heroku login status..."
if ! heroku whoami &> /dev/null; then
    print_warning "Not logged into Heroku. Please login:"
    heroku login
    if ! heroku whoami &> /dev/null; then
        print_error "Failed to login to Heroku"
        exit 1
    fi
else
    print_status "Already logged into Heroku as: $(heroku whoami)"
fi

# Step 3: Create/reconnect Heroku app
print_step "3" "Creating/connecting Heroku app..."
if heroku apps:info softlyplease-appserver &> /dev/null; then
    print_status "Heroku app 'softlyplease-appserver' already exists"
else
    print_warning "Creating new Heroku app..."
    heroku create softlyplease-appserver --region us
fi

# Step 4: Set environment variables
print_step "4" "Setting environment variables..."
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=softlyplease-secure-key-2024 --app softlyplease-appserver
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set PORT=80 --app softlyplease-appserver

# Step 5: Deploy to Heroku
print_step "5" "Deploying to Heroku..."
git add .
git commit -m "Fix softlyplease.com deployment and services"
git push heroku main

# Step 6: Wait for deployment
print_step "6" "Waiting for deployment to complete..."
sleep 10

# Step 7: Test Heroku app
print_step "7" "Testing Heroku deployment..."
if test_endpoint "https://softlyplease-appserver.herokuapp.com/version" "Heroku AppServer"; then
    print_status "Heroku deployment successful!"
else
    print_error "Heroku deployment failed. Checking logs..."
    heroku logs --tail --app softlyplease-appserver
    exit 1
fi

# Step 8: Test full pipeline
print_step "8" "Testing full pipeline..."
if test_endpoint "https://softlyplease-appserver.herokuapp.com/solve/BranchNodeRnd.gh?Radius=5&Count=10" "Full Pipeline"; then
    print_status "Full pipeline working!"
else
    print_warning "Full pipeline not working yet - may need Azure VM services to be running"
fi

# Step 9: Show app info
print_step "9" "Getting app information..."
heroku apps:info --app softlyplease-appserver

# Final status
echo
print_status "HEROKU DEPLOYMENT COMPLETE!"
echo "==============================================="
echo "Next steps:"
echo "1. Run the Azure VM restart script on your Windows server"
echo "2. Test softlyplease.com once both are running"
echo "3. Run the diagnosis script to verify everything works"
echo
echo "Heroku App URL: https://softlyplease-appserver.herokuapp.com"
echo "Main Site URL: https://softlyplease.com"
