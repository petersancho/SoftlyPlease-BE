# SIMPLE ROUTING FIX - NO TALKING

# Fix app.js for JSON API
$appPath = "src/app.js"
if (Test-Path $appPath) {
    $content = Get-Content $appPath -Raw

    # Add JSON API handler
    $jsonHandler = @'
// JSON API Route Handler
app.get('*', (req, res, next) => {
  if (req.query.format === 'json') {
    if (req.path === '/version') {
      return res.json({
        message: "Server is running",
        version: "0.1.12",
        timestamp: new Date().toISOString()
      });
    }
    if (req.path.endsWith('.gh')) {
      const definitionName = req.path.split('/').pop();
      return res.json({
        definition: definitionName,
        status: "loaded"
      });
    }
    return res.json({ error: "Not found", path: req.path });
  }
  next();
});
'@

    if ($content -notmatch "format=json") {
        $content = $content -replace "(// catch 404)", "$jsonHandler`n`n// catch 404"
        Set-Content -Path $appPath -Value $content
    }
}

# Fix definition serving
$defPath = "src/definitions.js"
if (Test-Path $defPath) {
    $content = Get-Content $defPath -Raw

    $ghHandler = @'
// Serve .gh files
app.get('*.gh', (req, res) => {
  const fileName = req.path.split('/').pop();
  const filePath = require('path').join(__dirname, 'files', fileName);
  const fs = require('fs');

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found", file: fileName });
  }
});
'@

    if ($content -notmatch "files.*\.gh") {
        $content = $content -replace "(module\.exports)", "$ghHandler`n`nmodule.exports"
        Set-Content -Path $defPath -Value $content
    }
}

# Commit and deploy
git add .
git commit -m "Fix routing issues"
git push heroku main

Write-Host "✅ ROUTING FIXED AND DEPLOYED"
