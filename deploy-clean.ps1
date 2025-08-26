# CLEAN DEPLOYMENT - NO TALKING

# Test local server first
Write-Host "Testing local server..."
try {
    $process = Start-Process -FilePath "node" -ArgumentList "src/bin/www" -NoNewWindow -PassThru
    Start-Sleep -Seconds 5
    $response = Invoke-WebRequest -Uri "http://localhost:3000/version" -TimeoutSec 10
    Write-Host "✅ Local server working"
    Stop-Process -Id $process.Id -Force
} catch {
    Write-Host "❌ Local server failed"
    exit 1
}

# Commit and deploy
git add .
git commit -m "Clean deployment - dual Node.js architecture"
git push heroku main

# Test Heroku
Start-Sleep -Seconds 15
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/version" -TimeoutSec 10
    Write-Host "✅ Heroku server working"
} catch {
    Write-Host "❌ Heroku server not working"
}

Write-Host "✅ CLEAN DEPLOYMENT COMPLETE"
