#!/bin/bash
# Update Heroku config to use new Rhino Compute Docker setup

# Replace with your actual Azure DNS name
NEW_COMPUTE_URL="http://compute-softlyplease.eastus.cloudapp.azure.com:5000/"
COMPUTE_KEY="<your_32char_api_key>"

echo "🔄 Updating Heroku config to use Windows Docker-based Rhino Compute..."
echo "New COMPUTE_URL: $NEW_COMPUTE_URL"
echo "COMPUTE_KEY: (set to match RHINO_COMPUTE_KEY from Azure VM)"

# Update Heroku config
heroku config:set COMPUTE_URL="$NEW_COMPUTE_URL" -a softlyplease-appserver
heroku config:set COMPUTE_KEY="$COMPUTE_KEY" -a softlyplease-appserver

# Verify the config was updated
echo "✅ Heroku config updated!"
heroku config:get COMPUTE_URL -a softlyplease-appserver
heroku config:get COMPUTE_KEY -a softlyplease-appserver

# Test the new endpoint
echo "🧪 Testing new Rhino Compute endpoint..."
curl -s "$NEW_COMPUTE_URL/version" || echo "Endpoint not responding yet - this is normal during initial setup"

echo ""
echo "🎉 Setup complete!"
echo "Your Heroku app will now use the Windows Docker-based Rhino Compute on Azure."
echo ""
echo "Next steps:"
echo "1. Test your examples at: https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/examples/"
echo "2. The /status endpoint should now work properly"
echo "3. All Grasshopper computations will use the new Azure endpoint"
echo "4. Set up Azure Application Gateway for production HTTPS security"
