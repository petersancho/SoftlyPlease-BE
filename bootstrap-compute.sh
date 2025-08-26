#!/bin/bash
# McNeel Rhino Compute AppServer Bootstrap Script
# Following the official McNeel compute.rhino3d.appserver guide

echo "=== McNeel Rhino Compute AppServer Bootstrap ==="

# Set default environment variables for McNeel architecture
export RHINO_COMPUTE_URL="${RHINO_COMPUTE_URL:-http://localhost:6500/}"
export RHINO_COMPUTE_APIKEY="${RHINO_COMPUTE_APIKEY:-}"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"
export HOST="${HOST:-0.0.0.0}"

# Bootstrap 1: Set environment variables, token, API key
echo "Setting environment variables..."
echo "RHINO_COMPUTE_URL: $RHINO_COMPUTE_URL"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "HOST: $HOST"

# Set Rhino Compute URL which tells Rhino Compute that it's going to be running on http and listening on all interfaces
export COMPUTE_URL="${COMPUTE_URL:-http://0.0.0.0:80}"
export APPSERVER_URL="${APPSERVER_URL:-http://localhost:3000}"

echo "COMPUTE_URL: $COMPUTE_URL"
echo "APPSERVER_URL: $APPSERVER_URL"

# Set API key for authorizing clients that will call Rhino Compute
if [ -z "$RHINO_COMPUTE_APIKEY" ]; then
    echo "WARNING: RHINO_COMPUTE_APIKEY is not set!"
    echo "Please set your API key for authentication:"
    echo "export RHINO_COMPUTE_APIKEY='your-api-key-here'"
fi

# Bootstrap 2: Test connectivity to Rhino Compute server
echo "Testing connection to Rhino Compute server..."
if curl -s "$RHINO_COMPUTE_URL/version" > /dev/null; then
    echo "✓ Rhino Compute server is accessible at $RHINO_COMPUTE_URL"
else
    echo "✗ Cannot connect to Rhino Compute server at $RHINO_COMPUTE_URL"
    echo "Please ensure Rhino Compute is running and accessible"
fi

# Bootstrap 3: Start the AppServer
echo "Starting McNeel Rhino Compute AppServer..."
echo "===================================================="
npm run start:prod
