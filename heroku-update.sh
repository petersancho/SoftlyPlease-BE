#!/bin/bash
# Update Heroku config to use new Rhino Compute Docker setup

# Replace with your actual Azure DNS name
NEW_COMPUTE_URL="http://compute-softlyplease.eastus.cloudapp.azure.com:5000/"
COMPUTE_KEY="<your_32char_api_key>"

echo "🔄 Updating Heroku config to use Windows Docker-based Rhino Compute..."
echo "New COMPUTE_URL: $NEW_COMPUTE_URL"
echo "COMPUTE_KEY: (set to match RHINO_COMPUTE_KEY from Azure VM)"

# Update Heroku config (using consistent RHINO_COMPUTE_* naming)
heroku config:set RHINO_COMPUTE_URL="$NEW_COMPUTE_URL" -a softlyplease-appserver
heroku config:set RHINO_COMPUTE_KEY="$COMPUTE_KEY" -a softlyplease-appserver

# Remove old inconsistent variables if they exist
heroku config:unset COMPUTE_URL -a softlyplease-appserver 2>/dev/null || true
heroku config:unset COMPUTE_KEY -a softlyplease-appserver 2>/dev/null || true

# Verify the config was updated
echo "✅ Heroku config updated!"
heroku config:get RHINO_COMPUTE_URL -a softlyplease-appserver
heroku config:get RHINO_COMPUTE_KEY -a softlyplease-appserver

# Test the new endpoint
echo "🧪 Testing new Rhino Compute endpoint..."
curl -s "$NEW_COMPUTE_URL/version" || echo "Endpoint not responding yet - this is normal during initial setup"

echo ""
echo "🎉 Setup complete!"
echo "Your Heroku app will now use the Windows Docker-based Rhino Compute on Azure."
echo ""
echo "🚀 Deployment Options for Your Heroku App:"
echo ""
echo "📦 Option 1: Traditional Heroku (current - buildpack based)"
echo "   git push heroku main"
echo ""
echo "🐳 Option 2: Docker Container (recommended - more control)"
echo "   heroku container:login"
echo "   heroku container:push web -a softlyplease-appserver"
echo "   heroku container:release web -a softlyplease-appserver"
echo ""
echo "🧪 Testing (after deployment):"
echo "1. Status: curl https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/status"
echo "2. Examples: https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/examples/"
echo "3. Solve: curl -X POST https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/solve \\"
echo "          -H 'Content-Type: application/json' \\"
echo "          -d '{\"definition\":\"BranchNodeRnd.gh\",\"inputs\":{\"Count\":3}}'"
echo ""
echo "💡 Docker Benefits for Heroku App:"
echo "   • Reproducible builds (same image locally & on Heroku)"
echo "   • Full dependency control (no buildpack quirks)"
echo "   • Built-in health checks"
echo "   • Security (non-root user)"
echo "   • Easy portability to other platforms"
echo ""
echo "🔒 Production Security:"
echo "4. Set up Azure Application Gateway for HTTPS + API key auth"
echo "5. Configure CORS to only allow your Heroku app"
