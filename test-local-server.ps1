# Test local server
Start-Process -FilePath "node" -ArgumentList "src/bin/www" -NoNewWindow -PassThru
Start-Sleep -Seconds 5

# Test endpoints
curl "http://localhost:3000/version"
curl "http://localhost:3000/?format=json"
curl "http://localhost:3000/BranchNodeRnd.gh"

# Kill the server
Stop-Process -Name "node" -Force
