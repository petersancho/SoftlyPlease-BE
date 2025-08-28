#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# 0) EDIT THESE VARIABLES
$DOMAIN = "compute.softlyplease.com"
$APP_ORIGIN = "https://www.softlyplease.com"
$BEARER = "<GENERATE_A_LONG_RANDOM_TOKEN>"   # must match Heroku COMPUTE_KEY

Write-Host "🚀 Starting Rhino Compute bootstrap..." -ForegroundColor Green

# 1) Enable Containers + install Docker (Windows)
Write-Host "📦 Enabling Windows Containers feature..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName containers -All -NoRestart | Out-Null

Write-Host "🐳 Installing Docker..." -ForegroundColor Yellow
Install-Module -Name DockerMsftProvider -Repository PSGallery -Force
Install-Package -Name docker -ProviderName DockerMsftProvider -Force
Restart-Service docker
docker version

# 2) Create folder structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow
New-Item -Force -ItemType Directory -Path "C:\softlycompute\caddy" | Out-Null
New-Item -Force -ItemType Directory -Path "C:\softlycompute\compute" | Out-Null
New-Item -Force -ItemType Directory -Path "C:\softlycompute\logs" | Out-Null

# 3) Install Caddy (Windows amd64)
Write-Host "🌐 Installing Caddy..." -ForegroundColor Yellow
Invoke-WebRequest "https://caddyserver.com/api/download?os=windows&arch=amd64" -OutFile "C:\softlycompute\caddy\caddy.exe"

# 4) Write Caddyfile (TLS + auth + proxy to localhost:8081)
Write-Host "📝 Creating Caddy configuration..." -ForegroundColor Yellow
$Caddyfile = @"
{$DOMAIN} {
    encode zstd gzip

    # Require Authorization: Bearer <token> on POST/PUT/PATCH/DELETE; allow GET /version for health
    @needsAuth method POST PUT PATCH DELETE
    route {
        @auth header Authorization "Bearer {$BEARER}"
        handle @needsAuth {
            @badAuth not header Authorization "Bearer {$BEARER}"
            respond @badAuth 401
        }
    }

    # CORS for app origin (mainly for GET /version; appserver calls via server-side)
    header {
        Access-Control-Allow-Origin {$APP_ORIGIN}
        Access-Control-Allow-Methods "GET,POST,OPTIONS"
        Access-Control-Allow-Headers "Authorization,Content-Type"
    }

    reverse_proxy 127.0.0.1:8081
}
"@

$Caddyfile | Set-Content -Path "C:\softlycompute\caddy\Caddyfile" -Encoding UTF8

# 5) Register Caddy as a Windows service
Write-Host "⚙️  Registering Caddy as Windows service..." -ForegroundColor Yellow
sc.exe create caddy binPath= "C:\softlycompute\caddy\caddy.exe run --config C:\softlycompute\caddy\Caddyfile --adapter caddyfile" start= auto
sc.exe start caddy

# 6) Build Rhino Compute container (Windows containers; process isolation)
Write-Host "🏗️  Building Rhino Compute container..." -ForegroundColor Yellow
# Note: Place your Dockerfile in C:\softlycompute\compute\Dockerfile before running this
docker build --isolation=process -t softly/rhino-compute:8 "C:\softlycompute\compute"

# 7) Run container, bind to localhost:8081 only
Write-Host "🐳 Running Rhino Compute container..." -ForegroundColor Yellow
docker run -d --restart=always --name rhino-compute `
  -e ASPNETCORE_URLS="http://*:8081" `
  -p 127.0.0.1:8081:8081 `
  softly/rhino-compute:8

# 8) Windows firewall: allow inbound 80 + 443 for Caddy; block 8081 (loopback only)
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Caddy 80"  -Direction Inbound -LocalPort 80  -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Caddy 443" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

Write-Host "✅ Bootstrap complete!" -ForegroundColor Green
Write-Host "🌐 Point DNS for $DOMAIN to this VM's public IP" -ForegroundColor Yellow
Write-Host "🔓 Ensure ports 80/443 are open in the Azure NSG" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test commands:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:8081/version" -ForegroundColor White
Write-Host "  curl https://$DOMAIN/version" -ForegroundColor White
