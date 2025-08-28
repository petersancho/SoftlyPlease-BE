# Acceptance Tests for Rhino Compute Setup
# Run this after deployment to verify everything is working

$DOMAIN = "compute.softlyplease.com"
$HEROKU_APP = "softlyplease-appserver"
$RHINO_COMPUTE_KEY = "<your_compute_key>"  # Same as in bootstrap.ps1

Write-Host "🧪 Running Acceptance Tests..." -ForegroundColor Green

# Test 1: Rhino Compute health check (local on VM)
Write-Host "1. Testing Rhino Compute health (localhost:8081)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Rhino Compute health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Rhino Compute health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Rhino Compute health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Public HTTPS endpoint (should work without auth for GET /version)
Write-Host "2. Testing public HTTPS endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/version" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Public HTTPS endpoint works" -ForegroundColor Green
        $version = $response.Content | ConvertFrom-Json
        Write-Host "   Version info: $($version | ConvertTo-Json)" -ForegroundColor White
    } else {
        Write-Host "❌ Public HTTPS endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Public HTTPS endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Authentication (should block POST without token)
Write-Host "3. Testing authentication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/solve" -Method POST -Body '{"test": "data"}' -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 401) {
        Write-Host "✅ Authentication correctly blocks unauthorized requests" -ForegroundColor Green
    } else {
        Write-Host "❌ Authentication failed: expected 401, got $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Authentication correctly blocks unauthorized requests" -ForegroundColor Green
    } else {
        Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3b: Authentication with valid token (should work)
Write-Host "3b. Testing authentication with valid token..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/solve" -Method POST -Body '{"test": "data"}' -ContentType "application/json" -Headers @{"Authorization" = "Bearer $RHINO_COMPUTE_KEY"} -UseBasicParsing
    Write-Host "✅ Authentication with valid token works" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication with valid token failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Heroku status endpoint
Write-Host "4. Testing Heroku status endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$HEROKU_APP.herokuapp.com/status" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Heroku status endpoint works" -ForegroundColor Green
        $status = $response.Content | ConvertFrom-Json
        Write-Host "   Status: compute=$($status.compute), ok=$($status.ok)" -ForegroundColor White
    } else {
        Write-Host "❌ Heroku status endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Heroku status endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Heroku solve endpoint (should fail gracefully if no Compute)
Write-Host "5. Testing Heroku solve endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$HEROKU_APP.herokuapp.com/solve" -Method POST -Body '{"definition":"test.gh","inputs":{"param":1}}' -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Heroku solve endpoint works" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 503) {
        Write-Host "⚠️  Heroku solve endpoint returned 503 (Compute not configured yet)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Heroku solve endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -eq 503) {
        Write-Host "⚠️  Heroku solve endpoint returned 503 (Compute not configured yet - this is expected)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Heroku solve endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Examples page
Write-Host "6. Testing examples page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$HEROKU_APP.herokuapp.com/examples/" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Examples page loads successfully" -ForegroundColor Green
        if ($response.Content -match "McNeel Examples") {
            Write-Host "✅ Examples page contains expected content" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Examples page loaded but content may be different" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Examples page failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Examples page failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Test Summary:" -ForegroundColor Cyan
Write-Host "• Rhino Compute should be accessible at: https://$DOMAIN" -ForegroundColor White
Write-Host "• Heroku app should be accessible at: https://$HEROKU_APP.herokuapp.com" -ForegroundColor White
Write-Host "• Run this script on the Azure VM after deployment" -ForegroundColor White
Write-Host ""
Write-Host "📞 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure DNS: $DOMAIN → Azure VM public IP" -ForegroundColor White
Write-Host "2. Update Heroku: COMPUTE_URL=https://$DOMAIN" -ForegroundColor White
Write-Host "3. Test again after DNS propagates" -ForegroundColor White
