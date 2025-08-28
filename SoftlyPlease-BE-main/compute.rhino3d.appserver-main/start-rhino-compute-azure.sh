#!/usr/bin/env bash

echo "🚀 Starting Rhino Compute on Azure VM (4.248.252.92:6001)"
echo "=========================================================="
echo ""
echo "📋 You need to SSH into your Azure VM and run these commands:"
echo ""
echo "1️⃣ SSH into your Azure VM:"
echo "   ssh your-username@4.248.252.92"
echo ""
echo "2️⃣ Once connected, run these PowerShell commands as Administrator:"
echo ""

cat << 'EOF'
# PowerShell Commands to run on Azure VM:
# ======================================

# 1. Check if Rhino Compute is already running
netstat -ano | findstr :6001

# 2. If nothing is listening on port 6001, start Rhino Compute
# Navigate to your Rhino Compute directory (adjust path as needed)
cd C:\compute-sp\SoftlyPlease-BE-main\compute.rhino3d-8.x\src\rhino.compute\bin\Debug\net6.0

# 3. Set environment variable for URL binding
$env:ASPNETCORE_URLS = "http://0.0.0.0:6001"

# 4. Start Rhino Compute
.\Rhino.Compute.exe

# Alternative: If you have it as a Windows Service
# Start-Service -Name "RhinoCompute"

# 5. Verify it's running (in a new PowerShell window)
netstat -ano | findstr :6001
curl -sS http://localhost:6001/version
curl -sS http://localhost:6001/healthcheck

EOF

echo ""
echo "3️⃣ After starting Rhino Compute, test external connectivity:"
echo "   curl -sS http://4.248.252.92:6001/version"
echo "   curl -sS http://4.248.252.92:6001/healthcheck"
echo ""
echo "4️⃣ Once Compute is running, run the geometry test:"
echo "   chmod +x test-geometry.sh && ./test-geometry.sh"
echo ""
echo "🔥 IMPORTANT: Rhino Compute must be running BEFORE testing geometry!"
echo ""
echo "💡 Troubleshooting:"
echo "   • Make sure port 6001 is open in Azure NSG"
echo "   • Verify Rhino 8 is installed on the VM"
echo "   • Check Windows Firewall isn't blocking port 6001"
echo "   • Look for errors in Rhino Compute console output"
