# TEST COMPLETE SOFTLYPLEASE PIPELINE
# Tests frontend → Heroku → Rhino Compute

Write-Host "🧪 TESTING COMPLETE SOFTLYPLEASE PIPELINE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

# Step 1: Test Rhino Compute Server
Write-Host "`n1. Testing Rhino Compute Server..." -ForegroundColor Cyan
Write-Host "   URL: http://4.248.252.92:6500/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Rhino Compute responding: HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Unexpected status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Rhino Compute not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure the Rhino compute service is running on your Azure VM" -ForegroundColor Yellow
}

# Step 2: Test Heroku AppServer
Write-Host "`n2. Testing Heroku AppServer..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease-appserver.herokuapp.com/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Heroku AppServer responding: HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Unexpected status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Heroku AppServer not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test JSON API on Heroku
Write-Host "`n3. Testing Heroku JSON API..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease-appserver.herokuapp.com/?format=json" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/?format=json" -TimeoutSec 15 -ErrorAction Stop
    $contentType = $response.Headers.'Content-Type'

    if ($response.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        Write-Host "   ✅ Heroku JSON API working: HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ JSON API not working properly" -ForegroundColor Red
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Heroku JSON API not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test Definition File Access
Write-Host "`n4. Testing Definition File Access..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease-appserver.herokuapp.com/BranchNodeRnd.gh" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/BranchNodeRnd.gh" -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Definition file accessible: HTTP $($response.StatusCode)" -ForegroundColor Green
        $contentLength = $response.Content.Length
        Write-Host "   📄 File size: $contentLength bytes" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Definition file not accessible: HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Definition file error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test Pipeline Communication
Write-Host "`n5. Testing Pipeline Communication..." -ForegroundColor Cyan
Write-Host "   Testing Heroku → Rhino Compute connection" -ForegroundColor White

# This would require a proper Grasshopper definition to test
# For now, we'll test the solve endpoint with minimal data
try {
    $testData = @{
        definition = "test"
        inputs = @{}
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/solve" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Pipeline endpoint responding: HTTP $($response.StatusCode)" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 404) {
        Write-Host "   ⚠️ Pipeline endpoint returns 404 (definition not found - normal)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Unexpected pipeline response: HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Pipeline test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test Frontend Connection
Write-Host "`n6. Testing Frontend Connection..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease.com/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 15 -ErrorAction Stop
    $contentType = $response.Headers.'Content-Type'

    if ($response.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        Write-Host "   ✅ Frontend connected to backend: HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Frontend not properly connected" -ForegroundColor Red
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
        Write-Host "   💡 Make sure softlyplease.com points to your Azure VM IP (4.248.252.92)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure the Node.js service is running on your Azure VM" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📊 PIPELINE TEST SUMMARY" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

$summary = @()

# Check each component
$rhinoTest = $false
try {
    $test = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 5 -ErrorAction Stop
    if ($test.StatusCode -eq 200) { $rhinoTest = $true }
} catch {}

$herokuTest = $false
try {
    $test = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 5 -ErrorAction Stop
    if ($test.StatusCode -eq 200) { $herokuTest = $true }
} catch {}

$frontendTest = $false
try {
    $test = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 5 -ErrorAction Stop
    $contentType = $test.Headers.'Content-Type'
    if ($test.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        $frontendTest = $true
    }
} catch {}

Write-Host "Rhino Compute Server: $(if ($rhinoTest) { "✅ WORKING" } else { "❌ FAILED" })" -ForegroundColor $(if ($rhinoTest) { "Green" } else { "Red" })
Write-Host "Heroku AppServer:     $(if ($herokuTest) { "✅ WORKING" } else { "❌ FAILED" })" -ForegroundColor $(if ($herokuTest) { "Green" } else { "Red" })
Write-Host "Frontend (Azure VM):  $(if ($frontendTest) { "✅ WORKING" } else { "❌ FAILED" })" -ForegroundColor $(if ($frontendTest) { "Green" } else { "Red" })

$workingCount = 0
if ($rhinoTest) { $workingCount++ }
if ($herokuTest) { $workingCount++ }
if ($frontendTest) { $workingCount++ }

Write-Host "`n🎯 Overall Status: $workingCount/3 components working" -ForegroundColor $(if ($workingCount -eq 3) { "Green" } elseif ($workingCount -eq 2) { "Yellow" } else { "Red" })

if ($workingCount -eq 3) {
    Write-Host "`n🎉 CONGRATULATIONS! Complete pipeline is working!" -ForegroundColor Green
    Write-Host "softlyplease.com should now have full functionality!" -ForegroundColor Green
} else {
    Write-Host "`n🔧 Components that need fixing:" -ForegroundColor Yellow
    if (-not $rhinoTest) { Write-Host "  - Rhino Compute Server (port 6500)" -ForegroundColor Red }
    if (-not $herokuTest) { Write-Host "  - Heroku AppServer" -ForegroundColor Red }
    if (-not $frontendTest) { Write-Host "  - Azure VM Node.js service (port 80)" -ForegroundColor Red }
}

Write-Host "`n📋 Quick Test Commands:" -ForegroundColor Cyan
Write-Host "curl http://4.248.252.92:6500/version          # Rhino Compute" -ForegroundColor White
Write-Host "curl https://softlyplease-appserver.herokuapp.com/version  # Heroku" -ForegroundColor White
Write-Host "curl https://softlyplease.com/version        # Frontend" -ForegroundColor White

Write-Host "`n🧪 Test complete!" -ForegroundColor Green
