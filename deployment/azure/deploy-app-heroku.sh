#!/bin/bash

# App Server Heroku Deployment Script
# Based on McNeel App Server Workshop

echo "=== App Server Heroku Deployment Script ==="
echo "Make sure you have:"
echo "  - Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli"
echo "  - Heroku account with app created"
echo "  - Rhino Compute server running and accessible"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "ERROR: Heroku CLI is not installed"
    echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "Logging into Heroku..."
heroku login

# Create Heroku app (if not exists)
read -p "Enter your Heroku app name: " APP_NAME

echo "Creating Heroku app: $APP_NAME"
heroku create $APP_NAME

# Set environment variables
echo "Setting environment variables..."

# Set your Rhino Compute server URL
read -p "Enter your Rhino Compute server URL (e.g., http://your-aws-server:8081): " COMPUTE_URL

# Generate API key for security
API_KEY=$(openssl rand -hex 32)
echo "Generated API key: $API_KEY"

# Set environment variables on Heroku
heroku config:set COMPUTE_URL="$COMPUTE_URL" --app $APP_NAME
heroku config:set COMPUTE_API_KEY="$API_KEY" --app $APP_NAME

# Configure for production
heroku config:set NODE_ENV="production" --app $APP_NAME

# Add memcached for caching (optional but recommended)
echo "Adding memcached for caching..."
heroku addons:create memcachedcloud:30 --app $APP_NAME

# The memcached environment variables are automatically set by the add-on

echo "Environment variables set:"
echo "  COMPUTE_URL: $COMPUTE_URL"
echo "  COMPUTE_API_KEY: $API_KEY"
echo "  NODE_ENV: production"
echo ""

# Deploy the application
echo "Deploying application..."
git push heroku main

# Open the application
echo "Opening application..."
heroku open --app $APP_NAME

echo ""
echo "=== Deployment Complete! ==="
echo "Your App Server is now running at: https://$APP_NAME.herokuapp.com"
echo ""
echo "Test endpoints:"
echo "  - List definitions: https://$APP_NAME.herokuapp.com/"
echo "  - Get definition info: https://$APP_NAME.herokuapp.com/your-definition-name"
echo "  - Solve definition: POST to https://$APP_NAME.herokuapp.com/solve"
echo ""
echo "Make sure your Rhino Compute server is accessible from Heroku!"
echo "You may need to configure security groups/firewall on your AWS server."
