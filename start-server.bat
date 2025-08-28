@echo off
echo Starting Rhino Compute AppServer for softlyplease.com...
echo.

REM Set environment variables
set NODE_ENV=development
set PORT=3000
set RHINO_COMPUTE_URL=https://softlyplease.canadacentral.cloudapp.azure.com:8443/
set RHINO_COMPUTE_KEY=p2robot-13a6-48f3-b24e-2025computeX

echo Environment variables set:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%
echo RHINO_COMPUTE_URL=%RHINO_COMPUTE_URL%
echo RHINO_COMPUTE_KEY=%RHINO_COMPUTE_KEY%
echo.

REM Change to the appserver directory
cd SoftlyPlease-BE-main\compute.rhino3d.appserver-main

echo Starting server from: %CD%
echo.

REM Start the server
npm start

pause
