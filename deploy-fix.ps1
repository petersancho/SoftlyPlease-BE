# PowerShell script to fix softlyplease.com deployment
Write-Host "🔧 Starting softlyplease.com deployment fix..." -ForegroundColor Green

# Check if heroku CLI is installed
try {
    heroku --version
    Write-Host "✅ Heroku CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Installing..." -ForegroundColor Red
    # Install Heroku CLI
    Invoke-WebRequest -Uri https://cli-assets.heroku.com/install.ps1 -UseBasicParsing | Invoke-Expression
}

# Login to Heroku (this might require user interaction)
Write-Host "🔑 Logging into Heroku..." -ForegroundColor Yellow
heroku login

# Create or check Heroku app
Write-Host "📦 Creating Heroku app..." -ForegroundColor Yellow
heroku create softlyplease-appserver --region us

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor Yellow
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/
heroku config:set RHINO_COMPUTE_APIKEY=softlyplease-secure-key-2024
heroku config:set NODE_ENV=production
heroku config:set PORT=80

# Deploy
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Green
git add .
git commit -m "Fix softlyplease.com deployment and services"
git push heroku main

# Test deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
curl https://softlyplease-appserver.herokuapp.com/version

Write-Host "✅ Heroku deployment complete!" -ForegroundColor Green
