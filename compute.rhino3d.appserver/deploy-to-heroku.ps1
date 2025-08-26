# PowerShell script to deploy AppServer to Heroku for softlyplease.com

# Set your Heroku app name
$HEROKU_APP_NAME = "softlyplease-appserver"

# Your Rhino Compute server details
$COMPUTE_URL = "http://4.248.252.92/"  # Update with your actual IP
$COMPUTE_API_KEY = "softlyplease-secure-key-2024"

Write-Host "🚀 Deploying AppServer to Heroku for softlyplease.com..."
Write-Host "App: $HEROKU_APP_NAME"
Write-Host "Compute URL: $COMPUTE_URL"

# Login to Heroku (if not already logged in)
heroku login

# Create Heroku app (if it doesn't exist)
heroku create $HEROKU_APP_NAME

# Set environment variables
heroku config:set RHINO_COMPUTE_URL=$COMPUTE_URL --app $HEROKU_APP_NAME
heroku config:set RHINO_COMPUTE_KEY=$COMPUTE_API_KEY --app $HEROKU_APP_NAME
heroku config:set NODE_ENV=production --app $HEROKU_APP_NAME

# Deploy to Heroku
git push heroku main

# Open the app
heroku open --app $HEROKU_APP_NAME

Write-Host "✅ Deployment complete!"
Write-Host "🌐 Your app should be available at: https://$HEROKU_APP_NAME.herokuapp.com"
