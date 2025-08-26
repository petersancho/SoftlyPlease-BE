#!/bin/bash

# Rhino Compute Endpoint Testing Script
# Run this script to test all endpoints in your system

echo "🧪 Rhino Compute Endpoint Testing Script"
echo "========================================"

# Configuration
HEROKU_APP_URL="https://softlyplease-appserver.herokuapp.com"
AZURE_VM_URL="http://4.248.252.92"
API_KEY="p2robot-13a6-48f3-b24e-2025computeX"

echo "Testing Azure VM Rhino Compute Server..."
echo "=========================================="

# Test 1: Azure VM Basic Connectivity
echo "1. Testing Azure VM connectivity..."
if curl -s --max-time 10 "$AZURE_VM_URL" > /dev/null; then
    echo "✅ Azure VM is responding"
else
    echo "❌ Azure VM not responding - Check if Rhino Compute is running"
fi

# Test 2: Azure VM Version Endpoint
echo "2. Testing Azure VM version endpoint..."
if curl -s --max-time 10 "$AZURE_VM_URL/version" > /dev/null; then
    echo "✅ Azure VM version endpoint working"
else
    echo "❌ Azure VM version endpoint not responding"
fi

# Test 3: Azure VM IO Endpoint
echo "3. Testing Azure VM IO endpoint..."
response=$(curl -s -X POST "$AZURE_VM_URL/io" \
    -H "Content-Type: application/json" \
    -d '{"pointer":"test"}' \
    --max-time 10)

if [[ $response == *"error"* ]] || [[ $response == *"Error"* ]]; then
    echo "❌ Azure VM IO endpoint error: $response"
else
    echo "✅ Azure VM IO endpoint working"
fi

echo ""
echo "Testing Heroku AppServer..."
echo "============================"

# Test 4: Heroku AppServer Root Endpoint
echo "4. Testing Heroku AppServer root endpoint..."
response=$(curl -s "$HEROKU_APP_URL/" --max-time 10)
if [ -n "$response" ]; then
    echo "✅ Heroku AppServer root endpoint working"
    echo "   Available definitions: $response"
else
    echo "❌ Heroku AppServer root endpoint not responding"
fi

# Test 5: Heroku AppServer View Endpoint
echo "5. Testing Heroku AppServer view endpoint..."
if curl -s "$HEROKU_APP_URL/view" > /dev/null; then
    echo "✅ Heroku AppServer view endpoint working"
else
    echo "❌ Heroku AppServer view endpoint not responding"
fi

# Test 6: Heroku AppServer Version Endpoint
echo "6. Testing Heroku AppServer version endpoint..."
if curl -s "$HEROKU_APP_URL/version" > /dev/null; then
    echo "✅ Heroku AppServer version endpoint working"
else
    echo "❌ Heroku AppServer version endpoint not responding"
fi

echo ""
echo "Testing Definition Endpoints..."
echo "==============================="

# Test 7: Sample Definition Endpoint (if exists)
echo "7. Testing sample definition endpoints..."
definitions=("BranchNodeRnd.gh" "SampleGHConvertTo3dm.gh" "delaunay.gh")

for def in "${definitions[@]}"; do
    if curl -s "$HEROKU_APP_URL/$def" > /dev/null; then
        echo "✅ Definition $def endpoint working"

        # Test the IO endpoint for this definition
        response=$(curl -s "$HEROKU_APP_URL/$def" --max-time 10)
        if [[ $response == *"RH_in"* ]] || [[ $response == *"inputs"* ]]; then
            echo "   📥 Definition has inputs: $response"
        fi
        if [[ $response == *"RH_out"* ]] || [[ $response == *"outputs"* ]]; then
            echo "   📤 Definition has outputs: $response"
        fi
    else
        echo "❌ Definition $def endpoint not found"
    fi
done

echo ""
echo "Testing Solve Endpoints..."
echo "==========================="

# Test 8: Solve Endpoint with Sample Data
echo "8. Testing solve endpoint (BranchNodeRnd.gh)..."

# Test GET method with query parameters
if curl -s "$HEROKU_APP_URL/solve/BranchNodeRnd.gh?Radius=5&Count=51&Length=5" > /dev/null; then
    echo "✅ Solve GET endpoint working"
else
    echo "❌ Solve GET endpoint not responding"
fi

# Test POST method with JSON
solve_response=$(curl -s -X POST "$HEROKU_APP_URL/solve" \
    -H "Content-Type: application/json" \
    -d '{
        "definition": "BranchNodeRnd.gh",
        "inputs": {
            "Radius": [5],
            "Count": [51],
            "Length": [5]
        }
    }' \
    --max-time 30)

if [[ $solve_response == *"error"* ]] || [[ $solve_response == *"Error"* ]]; then
    echo "❌ Solve POST endpoint error: $solve_response"
elif [ -n "$solve_response" ]; then
    echo "✅ Solve POST endpoint working"
    echo "   Response: $(echo $solve_response | cut -c1-100)..."
else
    echo "⚠️  Solve POST endpoint returned empty response"
fi

echo ""
echo "Performance Testing..."
echo "======================"

# Test 9: Caching Performance
echo "9. Testing caching performance..."
start_time=$(date +%s%N)
curl -s "$HEROKU_APP_URL/BranchNodeRnd.gh" > /dev/null
first_request=$((($(date +%s%N) - $start_time)/1000000))

start_time=$(date +%s%N)
curl -s "$HEROKU_APP_URL/BranchNodeRnd.gh" > /dev/null
cached_request=$((($(date +%s%N) - $start_time)/1000000))

echo "   First request: ${first_request}ms"
echo "   Cached request: ${cached_request}ms"

if [ $cached_request -lt $first_request ]; then
    echo "✅ Caching is working (cached request is faster)"
else
    echo "⚠️  Caching may not be working optimally"
fi

echo ""
echo "System Health Check..."
echo "======================"

# Test 10: System Health
echo "10. Testing system health..."

# Check if both services are running
azure_health=$(curl -s --max-time 5 "$AZURE_VM_URL/health" || echo "no-health")
heroku_health=$(curl -s --max-time 5 "$HEROKU_APP_URL/health" || echo "no-health")

if [ "$azure_health" != "no-health" ]; then
    echo "✅ Azure VM health endpoint responding"
else
    echo "⚠️  Azure VM health endpoint not available"
fi

if [ "$heroku_health" != "no-health" ]; then
    echo "✅ Heroku AppServer health endpoint responding"
else
    echo "⚠️  Heroku AppServer health endpoint not available"
fi

echo ""
echo "Summary Report"
echo "=============="
echo "🖥️  Azure VM: $AZURE_VM_URL"
echo "🌐 Heroku App: $HEROKU_APP_URL"
echo "🔑 API Key: ${API_KEY:0:10}..."
echo ""
echo "Next Steps:"
echo "- Check individual endpoint responses for detailed data"
echo "- Verify Grasshopper definitions have correct RH_in:/RH_out: parameters"
echo "- Monitor logs on both Azure VM and Heroku for errors"
echo "- Test with actual geometry data (base64 encoded)"
echo ""
echo "Testing complete! 🎉"
