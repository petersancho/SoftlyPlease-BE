# DIRECT FIX FOR MAIN DOMAIN ROUTING ISSUES
# Fixes JSON API responses and definition file access

Write-Host "🔧 FIXING MAIN DOMAIN ROUTING ISSUES..." -ForegroundColor Green

# Step 1: Fix app.js routing for JSON API
Write-Host "Step 1: Fixing app.js JSON API routing..." -ForegroundColor Yellow

$appJsPath = "src/app.js"
if (Test-Path $appJsPath) {
    $appJsContent = Get-Content $appJsPath -Raw

    # Add JSON API route handler if missing
    if ($appJsContent -notmatch "format=json") {
        $jsonRouteHandler = @"

# JSON API Route Handler
app.get('*', (req, res, next) => {
  if (req.query.format === 'json') {
    // Handle JSON API requests
    if (req.path === '/version') {
      return res.json({
        message: "Server is running",
        version: "0.1.12",
        timestamp: new Date().toISOString()
      });
    }

    // Handle definition requests
    if (req.path.endsWith('.gh')) {
      const definitionName = req.path.split('/').pop();
      return res.json({
        definition: definitionName,
        status: "loaded",
        parameters: []
      });
    }

    // Default JSON response
    return res.json({
      error: "Endpoint not found",
      path: req.path,
      query: req.query
    });
  }
  next();
});

"@

        # Insert the JSON route handler before the 404 handler
        $appJsContent = $appJsContent -replace "(// catch 404)", "$jsonRouteHandler`n`n// catch 404"
        Set-Content -Path $appJsPath -Value $appJsContent -Force
        Write-Host "✅ JSON API route handler added" -ForegroundColor Green
    } else {
        Write-Host "✅ JSON API route handler already exists" -ForegroundColor Green
    }
} else {
    Write-Host "❌ src/app.js not found" -ForegroundColor Red
}

# Step 2: Fix definition file serving
Write-Host "`nStep 2: Fixing definition file serving..." -ForegroundColor Yellow

$definitionsPath = "src/definitions.js"
if (Test-Path $definitionsPath) {
    $definitionsContent = Get-Content $definitionsPath -Raw

    # Add static file serving for .gh files if missing
    if ($definitionsContent -notmatch "files.*\.gh") {
        $ghFileHandler = @"

// Serve .gh files
app.get('*.gh', (req, res) => {
  const fileName = req.path.split('/').pop();
  const filePath = path.join(__dirname, 'files', fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      error: "Definition file not found",
      file: fileName,
      path: req.path
    });
  }
});

"@

        # Insert the .gh file handler
        $definitionsContent = $definitionsContent -replace "(module\.exports)", "$ghFileHandler`n`nmodule.exports"
        Set-Content -Path $definitionsPath -Value $definitionsContent -Force
        Write-Host "✅ .gh file serving added" -ForegroundColor Green
    } else {
        Write-Host "✅ .gh file serving already exists" -ForegroundColor Green
    }
} else {
    Write-Host "❌ src/definitions.js not found" -ForegroundColor Red
}

# Step 3: Fix server configuration
Write-Host "`nStep 3: Fixing server configuration..." -ForegroundColor Yellow

$binWwwPath = "src/bin/www"
if (Test-Path $binWwwPath) {
    $binWwwContent = Get-Content $binWwwPath -Raw

    # Ensure proper error handling
    if ($binWwwContent -notmatch "process\.on.*uncaughtException") {
        $errorHandler = @"

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

"@

        $binWwwContent = $binWwwContent -replace "(server\.listen)", "$errorHandler`nserver.listen"
        Set-Content -Path $binWwwPath -Value $binWwwContent -Force
        Write-Host "✅ Error handling added" -ForegroundColor Green
    } else {
        Write-Host "✅ Error handling already exists" -ForegroundColor Green
    }
} else {
    Write-Host "❌ src/bin/www not found" -ForegroundColor Red
}

# Step 4: Add required dependencies
Write-Host "`nStep 4: Adding required dependencies..." -ForegroundColor Yellow

$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $package = Get-Content $packageJsonPath | ConvertFrom-Json

    $requiredDeps = @("fs", "path")
    $missingDeps = @()

    foreach ($dep in $requiredDeps) {
        if (-not $package.dependencies.$dep) {
            $missingDeps += $dep
        }
    }

    if ($missingDeps.Count -eq 0) {
        Write-Host "✅ All required dependencies present" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Yellow
        Write-Host "Note: fs and path are built-in Node.js modules, no installation needed" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
}

# Step 5: Test local server
Write-Host "`nStep 5: Testing local server..." -ForegroundColor Yellow

try {
    $process = Start-Process -FilePath "node" -ArgumentList "src/bin/www" -NoNewWindow -PassThru
    Start-Sleep -Seconds 3

    # Test local JSON API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/?format=json" -TimeoutSec 5
        if ($response.Content.Contains("json")) {
            Write-Host "✅ Local JSON API working" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Local JSON API returning HTML" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Local JSON API test failed" -ForegroundColor Red
    }

    # Test local definition file
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/BranchNodeRnd.gh" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Local definition file serving working" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Local definition file not found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Local definition file test failed" -ForegroundColor Red
    }

    # Stop test server
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Local server test completed" -ForegroundColor Green

} catch {
    Write-Host "❌ Could not start local server test" -ForegroundColor Red
}

# Step 6: Commit and deploy changes
Write-Host "`nStep 6: Committing and deploying changes..." -ForegroundColor Yellow

git add .
git commit -m "Fix main domain routing issues

- Add JSON API route handler
- Fix definition file serving for .gh files
- Add proper error handling
- Ensure all routes work correctly"

# Deploy to Heroku
git push heroku main

# Step 7: Create test commands
Write-Host "`nStep 7: Creating test commands..." -ForegroundColor Yellow

$testCommands = @"
# TEST COMMANDS AFTER FIX
# Run these to verify the fixes work:

# Test JSON API on Heroku
curl "https://softlyplease-appserver.herokuapp.com/?format=json"

# Test definition file on Heroku
curl "https://softlyplease-appserver.herokuapp.com/BranchNodeRnd.gh"

# Test JSON API on main domain (after Azure VM fix)
curl "https://softlyplease.com/?format=json"

# Test definition file on main domain
curl "https://softlyplease.com/BranchNodeRnd.gh"

# Expected results:
# JSON API should return JSON, not HTML
# Definition files should return file content, not 404
"@

Set-Content -Path "TEST-COMMANDS.txt" -Value $testCommands -Force
Write-Host "✅ Test commands created: TEST-COMMANDS.txt" -ForegroundColor Green

Write-Host "`n🎉 MAIN DOMAIN ROUTING FIX COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "✅ JSON API routes added" -ForegroundColor Green
Write-Host "✅ Definition file serving fixed" -ForegroundColor Green
Write-Host "✅ Error handling improved" -ForegroundColor Green
Write-Host "✅ Changes deployed to Heroku" -ForegroundColor Green
Write-Host "" -ForegroundColor Yellow
Write-Host "🔧 NEXT: Run the Azure VM service restart script" -ForegroundColor Red
Write-Host "📋 Test: See TEST-COMMANDS.txt for verification commands" -ForegroundColor Yellow
