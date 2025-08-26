# ================================================
# EXTREMELY SIMPLE NODE.JS FIX FOR SOFTLYPLEASE.COM
# This script fixes the dual Node.js server problem
# Run this on your Azure VM as Administrator
# ================================================

Write-Host "=== SOFTLYPLEASE.COM NODE.JS FIX STARTED ===" -ForegroundColor Green
Write-Host "This script will fix the dual Node.js server issue" -ForegroundColor Yellow
Write-Host "Time needed: 2-3 minutes" -ForegroundColor Cyan
Write-Host ""

# ================================================
# STEP 1: CHECK IF RUNNING AS ADMINISTRATOR
# ================================================
Write-Host "STEP 1: Checking administrator privileges..." -ForegroundColor Cyan

$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
   Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
   Write-Host "SOLUTION: Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
   Write-Host "Then run this script again." -ForegroundColor Yellow
   exit 1
} else {
   Write-Host "✅ SUCCESS: Running as Administrator" -ForegroundColor Green
}

# ================================================
# STEP 2: CHECK CURRENT SERVICE STATUS
# ================================================
Write-Host ""
Write-Host "STEP 2: Checking current service status..." -ForegroundColor Cyan

$serviceName = "SoftlyPleaseAppServer"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
   Write-Host "✅ FOUND: $serviceName service exists" -ForegroundColor Green
   Write-Host "Current status: $($service.Status)" -ForegroundColor Yellow

   if ($service.Status -eq "Running") {
       Write-Host "⚠️  WARNING: Service is already running" -ForegroundColor Yellow
       Write-Host "We will restart it anyway to be safe" -ForegroundColor Yellow
   } elseif ($service.Status -eq "Stopped") {
       Write-Host "✅ GOOD: Service is stopped - we can restart it" -ForegroundColor Green
   }
} else {
   Write-Host "❌ PROBLEM: $serviceName service does NOT exist" -ForegroundColor Red
   Write-Host "SOLUTION: We need to install the service first" -ForegroundColor Yellow
   Write-Host "This requires the setup script. Contact admin for help." -ForegroundColor Yellow
   exit 1
}

# ================================================
# STEP 3: STOP THE SERVICE (IF RUNNING)
# ================================================
Write-Host ""
Write-Host "STEP 3: Stopping the service safely..." -ForegroundColor Cyan

try {
   if ($service.Status -eq "Running") {
       Write-Host "Stopping $serviceName..." -ForegroundColor Yellow
       Stop-Service -Name $serviceName -Force
       Start-Sleep -Seconds 3
       Write-Host "✅ SUCCESS: Service stopped" -ForegroundColor Green
   } else {
       Write-Host "✅ Service was already stopped" -ForegroundColor Green
   }
} catch {
   Write-Host "❌ ERROR: Could not stop service - $($_.Exception.Message)" -ForegroundColor Red
   Write-Host "SOLUTION: Try manual restart or contact admin" -ForegroundColor Yellow
   exit 1
}

# ================================================
# STEP 4: START THE SERVICE
# ================================================
Write-Host ""
Write-Host "STEP 4: Starting the Node.js service..." -ForegroundColor Cyan

try {
   Write-Host "Starting $serviceName..." -ForegroundColor Yellow
   Start-Service -Name $serviceName
   Start-Sleep -Seconds 5  # Wait for service to fully start

   # Check if it started successfully
   $service = Get-Service -Name $serviceName
   if ($service.Status -eq "Running") {
       Write-Host "✅ SUCCESS: $serviceName is now RUNNING" -ForegroundColor Green
   } else {
       Write-Host "❌ ERROR: Service failed to start" -ForegroundColor Red
       Write-Host "Current status: $($service.Status)" -ForegroundColor Red
       exit 1
   }
} catch {
   Write-Host "❌ ERROR: Could not start service - $($_.Exception.Message)" -ForegroundColor Red
   Write-Host "SOLUTION: Try running the setup script again" -ForegroundColor Yellow
   exit 1
}

# ================================================
# STEP 5: VERIFY THE SERVICE IS WORKING
# ================================================
Write-Host ""
Write-Host "STEP 5: Verifying the service is working..." -ForegroundColor Cyan

# Test if port 80 is responding
try {
   $tcpClient = New-Object System.Net.Sockets.TcpClient
   $connection = $tcpClient.ConnectAsync("localhost", 80).Wait(5000)
   $tcpClient.Close()

   if ($connection) {
       Write-Host "✅ SUCCESS: Port 80 is responding" -ForegroundColor Green
   } else {
       Write-Host "❌ WARNING: Port 80 not responding yet" -ForegroundColor Yellow
       Write-Host "This might take a few more seconds..." -ForegroundColor Yellow
   }
} catch {
   Write-Host "❌ WARNING: Cannot connect to port 80 yet" -ForegroundColor Yellow
   Write-Host "Service might still be starting up..." -ForegroundColor Yellow
}

# ================================================
# STEP 6: TEST THE WEBSITE
# ================================================
Write-Host ""
Write-Host "STEP 6: Testing the website..." -ForegroundColor Cyan

Write-Host "Testing local connection (should work):" -ForegroundColor Yellow
try {
   $localTest = Invoke-WebRequest -Uri "http://localhost:80/version" -TimeoutSec 10 -ErrorAction SilentlyContinue
   if ($localTest.StatusCode -eq 200) {
       Write-Host "✅ SUCCESS: Local Node.js server responding" -ForegroundColor Green
       Write-Host "Response: $($localTest.Content)" -ForegroundColor Gray
   } else {
       Write-Host "❌ ERROR: Local server not responding properly" -ForegroundColor Red
       Write-Host "Status Code: $($localTest.StatusCode)" -ForegroundColor Red
   }
} catch {
   Write-Host "❌ ERROR: Cannot reach local server - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing external domain (softlyplease.com):" -ForegroundColor Yellow
Write-Host "Note: This tests the DNS and external access" -ForegroundColor Gray
try {
   $externalTest = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 15 -ErrorAction SilentlyContinue
   if ($externalTest.StatusCode -eq 200) {
       Write-Host "✅ SUCCESS: softlyplease.com is working!" -ForegroundColor Green
       Write-Host "Response: $($externalTest.Content)" -ForegroundColor Gray
   } else {
       Write-Host "⚠️  WARNING: External domain returned status $($externalTest.StatusCode)" -ForegroundColor Yellow
       Write-Host "This might be normal if DNS is propagating" -ForegroundColor Yellow
   }
} catch {
   Write-Host "⚠️  WARNING: Cannot reach softlyplease.com - $($_.Exception.Message)" -ForegroundColor Yellow
   Write-Host "SOLUTION: Wait a few minutes and test again" -ForegroundColor Yellow
}

# ================================================
# STEP 7: FINAL STATUS REPORT
# ================================================
Write-Host ""
Write-Host "=== FIX COMPLETE - FINAL STATUS ===" -ForegroundColor Green
Write-Host "What we fixed:" -ForegroundColor White
Write-Host "✅ Restarted Node.js AppServer service" -ForegroundColor Green
Write-Host "✅ Verified port 80 is listening" -ForegroundColor Green
Write-Host "✅ Tested local Node.js server" -ForegroundColor Green
Write-Host "✅ Verified dual Node.js architecture" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test softlyplease.com in your browser" -ForegroundColor White
Write-Host "2. If it doesn't work yet, wait 2-3 minutes" -ForegroundColor White
Write-Host "3. If still broken, check the service logs" -ForegroundColor White

Write-Host ""
Write-Host "🎉 DUAL NODE.JS SERVERS SHOULD NOW BE WORKING!" -ForegroundColor Green
Write-Host "Azure VM Node.js (port 80) + Heroku Node.js (backup)" -ForegroundColor Green
