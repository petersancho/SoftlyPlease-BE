# FINAL FIX - NO MORE TALKING

# Fix package.json paths
$content = Get-Content package.json -Raw
$content = $content -replace '"./bin/www"', '"./src/bin/www"'
$content = $content -replace '"\.src/bin/www"', '"./src/bin/www"'
Set-Content package.json -Value $content

# Commit and deploy
git add .
git commit -m "Fix package.json paths for Heroku"
git push heroku main

# Test
Start-Sleep -Seconds 10
curl "https://softlyplease-appserver.herokuapp.com/version"
