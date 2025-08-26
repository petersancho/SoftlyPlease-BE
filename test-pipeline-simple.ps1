# SIMPLE PIPELINE TEST
# Tests all softlyplease.com components

Write-Host "🧪 TESTING SOFTLYPLEASE.COM PIPELINE" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Yellow

# Test 1: Rhino Compute Server
Write-Host "`n1. Testing Rhino Compute Server..." -ForegroundColor Cyan
Write-Host "   URL: http://4.248.252.92:6500/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ WORKING - HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ NOT RESPONDING - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Heroku AppServer
Write-Host "`n2. Testing Heroku AppServer..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease-appserver.herokuapp.com/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ WORKING - HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ NOT RESPONDING - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Frontend (Azure VM)
Write-Host "`n3. Testing Frontend (Azure VM)..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease.com/version" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 15 -ErrorAction Stop
    $contentType = $response.Headers.'Content-Type'

    if ($response.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        Write-Host "   ✅ WORKING - JSON API - HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ NOT WORKING - HTTP $($response.StatusCode)" -ForegroundColor Red
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ NOT RESPONDING - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: JSON API
Write-Host "`n4. Testing JSON API..." -ForegroundColor Cyan
Write-Host "   URL: https://softlyplease-appserver.herokuapp.com/?format=json" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/?format=json" -TimeoutSec 15 -ErrorAction Stop
    $contentType = $response.Headers.'Content-Type'

    if ($response.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        Write-Host "   ✅ WORKING - JSON API - HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ NOT WORKING - HTTP $($response.StatusCode)" -ForegroundColor Red
        Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ NOT RESPONDING - $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 SUMMARY" -ForegroundColor Green
Write-Host "========" -ForegroundColor Green

$tests = @(
    @{name = "Rhino Compute"; url = "http://4.248.252.92:6500/version"},
    @{name = "Heroku AppServer"; url = "https://softlyplease-appserver.herokuapp.com/version"},
    @{name = "Frontend JSON"; url = "https://softlyplease.com/version"; json = $true}
)

$working = 0

foreach ($test in $tests) {
    try {
        $response = Invoke-WebRequest -Uri $test.url -TimeoutSec 5 -ErrorAction Stop
        $isWorking = $response.StatusCode -eq 200

        if ($test.json) {
            $contentType = $response.Headers.'Content-Type'
            $isWorking = $isWorking -and $contentType -and $contentType.Contains('application/json')
        }

        if ($isWorking) {
            $working++
            Write-Host "$($test.name): ✅ WORKING" -ForegroundColor Green
        } else {
            Write-Host "$($test.name): ❌ FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "$($test.name): ❌ FAILED" -ForegroundColor Red
    }
}

Write-Host "`n🎯 STATUS: $working/3 components working" -ForegroundColor $(if ($working -eq 3) { "Green" } elseif ($working -eq 2) { "Yellow" } else { "Red" })

if ($working -eq 3) {
    Write-Host "`n🎉 CONGRATULATIONS! Complete pipeline working!" -ForegroundColor Green
    Write-Host "softlyplease.com should be fully functional!" -ForegroundColor Green
} else {
    Write-Host "`n🔧 Still need to fix:" -ForegroundColor Yellow
    Write-Host "1. Make sure Azure VM Node.js service is running on port 80" -ForegroundColor White
    Write-Host "2. Check Heroku AppServer configuration" -ForegroundColor White
    Write-Host "3. Verify Rhino Compute is accessible from Heroku" -ForegroundColor White
}

Write-Host "`n🧪 Test complete!" -ForegroundColor Green
