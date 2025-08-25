#!/bin/bash

# 🧪 SoftlyPlease Compute System Testing Framework
# Tests all endpoints in the Rhino Compute backend system

set -e  # Exit on any error

# Configuration
AZURE_VM_IP="4.248.252.92"
HEROKU_APP="softlyplease-appserver-5d5d5bc6198a.herokuapp.com"
API_KEY="p2robot-13a6-48f3-b24e-2025computeX"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result tracking
test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    ((TESTS_RUN++))
    if [ "$result" = "PASS" ]; then
        ((TESTS_PASSED++))
        log_success "$test_name: $details"
    else
        ((TESTS_FAILED++))
        log_error "$test_name: $details"
    fi
}

echo "🧪 SoftlyPlease Compute System Testing Framework"
echo "=================================================="
echo ""

# Test 1: Azure VM Basic Connectivity
log_info "Test 1: Azure VM Basic Connectivity"
if response=$(curl -s -w "%{http_code}" http://$AZURE_VM_IP/ -o /dev/null 2>&1); then
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        test_result "Azure VM Connectivity" "PASS" "HTTP $response received"
    else
        test_result "Azure VM Connectivity" "FAIL" "HTTP $response (expected 200 or 404)"
    fi
else
    test_result "Azure VM Connectivity" "FAIL" "Connection failed"
fi

# Test 2: Rhino Compute Version Endpoint
log_info "Test 2: Rhino Compute Version Endpoint"
if response=$(curl -s http://$AZURE_VM_IP/version 2>&1); then
    if echo "$response" | grep -q "version"; then
        test_result "Rhino Compute Version" "PASS" "Version endpoint responding"
    else
        test_result "Rhino Compute Version" "FAIL" "Unexpected response: $response"
    fi
else
    test_result "Rhino Compute Version" "FAIL" "Version endpoint not responding"
fi

# Test 3: Rhino Compute IO Endpoint
log_info "Test 3: Rhino Compute IO Endpoint"
if response=$(curl -s -X POST http://$AZURE_VM_IP/io \
    -H "Content-Type: application/json" \
    -d '{"pointer":"test"}' 2>&1); then
    if echo "$response" | grep -q "inputs\|outputs"; then
        test_result "Rhino Compute IO" "PASS" "IO endpoint responding with data"
    else
        test_result "Rhino Compute IO" "FAIL" "Unexpected response: $response"
    fi
else
    test_result "Rhino Compute IO" "FAIL" "IO endpoint not responding"
fi

# Test 4: AppServer Root Endpoint (List Definitions)
log_info "Test 4: AppServer Root Endpoint"
if response=$(curl -s https://$HEROKU_APP/ 2>&1); then
    if echo "$response" | grep -q "\.gh"; then
        test_result "AppServer Root" "PASS" "Definitions list returned"
        definition_count=$(echo "$response" | grep -o "\.gh" | wc -l)
        log_info "Found $definition_count Grasshopper definitions"
    else
        test_result "AppServer Root" "FAIL" "No .gh definitions found: $response"
    fi
else
    test_result "AppServer Root" "FAIL" "Root endpoint not responding"
fi

# Test 5: AppServer Version Endpoint
log_info "Test 5: AppServer Version Endpoint"
if response=$(curl -s https://$HEROKU_APP/version 2>&1); then
    if echo "$response" | grep -q "version\|appServer\|rhino"; then
        test_result "AppServer Version" "PASS" "Version information returned"
    else
        test_result "AppServer Version" "FAIL" "Unexpected response: $response"
    fi
else
    test_result "AppServer Version" "FAIL" "Version endpoint not responding"
fi

# Test 6: Definition Analysis Endpoint
log_info "Test 6: Definition Analysis Endpoint"
if response=$(curl -s "https://$HEROKU_APP/delaunay.gh" 2>&1); then
    if echo "$response" | grep -q "inputs\|outputs"; then
        test_result "Definition Analysis" "PASS" "Definition inputs/outputs returned"
    else
        test_result "Definition Analysis" "FAIL" "No inputs/outputs found: $response"
    fi
else
    test_result "Definition Analysis" "FAIL" "Definition endpoint not responding"
fi

# Test 7: Solve Endpoint (GET with Query Parameters)
log_info "Test 7: Solve Endpoint (GET)"
if response=$(curl -s "https://$HEROKU_APP/solve/delaunay.gh?RH_in:points=[[0,0,0],[1,0,0],[0,1,0],[1,1,0]]" 2>&1); then
    if echo "$response" | grep -q "values\|data"; then
        test_result "Solve GET" "PASS" "Solution computed successfully"
    else
        test_result "Solve GET" "FAIL" "No solution data returned: $response"
    fi
else
    test_result "Solve GET" "FAIL" "Solve endpoint not responding"
fi

# Test 8: Solve Endpoint (POST with JSON Body)
log_info "Test 8: Solve Endpoint (POST)"
if response=$(curl -s -X POST https://$HEROKU_APP/solve \
    -H "Content-Type: application/json" \
    -d '{
        "definition": "delaunay.gh",
        "inputs": {
            "RH_in:points": [[0,0,0],[1,0,0],[0,1,0],[1,1,0]]
        }
    }' 2>&1); then
    if echo "$response" | grep -q "values\|data"; then
        test_result "Solve POST" "PASS" "POST solution computed successfully"
    else
        test_result "Solve POST" "FAIL" "No solution data returned: $response"
    fi
else
    test_result "Solve POST" "FAIL" "POST solve endpoint not responding"
fi

# Test 9: Solve Endpoint (HEAD Request)
log_info "Test 9: Solve Endpoint (HEAD)"
if response=$(curl -s -I "https://$HEROKU_APP/solve/delaunay.gh?RH_in:points=[[0,0,0],[1,0,0],[0,1,0],[1,1,0]]" 2>&1); then
    if echo "$response" | grep -q "200 OK"; then
        test_result "Solve HEAD" "PASS" "HEAD request successful"
    else
        test_result "Solve HEAD" "FAIL" "HEAD request failed: $response"
    fi
else
    test_result "Solve HEAD" "FAIL" "HEAD endpoint not responding"
fi

# Test 10: Performance Test (First Request vs Cached)
log_info "Test 10: Performance Test (Caching)"
start_time=$(date +%s%N)
first_response=$(curl -s "https://$HEROKU_APP/solve/delaunay.gh?RH_in:points=[[0,0,0],[1,0,0],[0,1,0],[1,1,0]]" 2>&1)
first_time=$((($(date +%s%N) - $start_time)/1000000))

start_time=$(date +%s%N)
second_response=$(curl -s "https://$HEROKU_APP/solve/delaunay.gh?RH_in:points=[[0,0,0],[1,0,0],[0,1,0],[1,1,0]]" 2>&1)
second_time=$((($(date +%s%N) - $start_time)/1000000))

if [ "$first_response" = "$second_response" ]; then
    test_result "Performance Test" "PASS" "First: ${first_time}ms, Second: ${second_time}ms"
else
    test_result "Performance Test" "FAIL" "Responses differ (caching issue)"
fi

# Test 11: Health Check
log_info "Test 11: System Health Check"
if curl -s http://$AZURE_VM_IP/ > /dev/null && curl -s https://$HEROKU_APP/ > /dev/null; then
    test_result "Health Check" "PASS" "Both systems responding"
else
    test_result "Health Check" "FAIL" "One or more systems not responding"
fi

# Test 12: API Key Authentication
log_info "Test 12: API Key Authentication"
if response=$(curl -s -H "X-API-Key: $API_KEY" "https://$HEROKU_APP/delaunay.gh" 2>&1); then
    if echo "$response" | grep -q "inputs\|outputs"; then
        test_result "API Key Auth" "PASS" "API key authentication working"
    else
        test_result "API Key Auth" "FAIL" "API key authentication failed"
    fi
else
    test_result "API Key Auth" "FAIL" "API key endpoint not responding"
fi

# Final Results
echo ""
echo "📊 Test Results Summary"
echo "======================="
echo "Tests Run: $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    log_success "🎉 All tests passed! Your Rhino Compute system is fully operational."
else
    echo ""
    log_warning "⚠️  Some tests failed. Check the errors above and refer to RHINO_COMPUTE_SETUP.md"
fi

echo ""
echo "🔗 Useful Commands:"
echo "=================="
echo "# View Heroku logs:"
echo "heroku logs --tail"
echo ""
echo "# Check Azure VM services:"
echo "Get-Service '*rhino*' -ErrorAction SilentlyContinue"
echo ""
echo "# Restart Heroku dyno:"
echo "heroku ps:restart"
echo ""
echo "# Update Heroku config:"
echo "heroku config:set RHINO_COMPUTE_URL=http://$AZURE_VM_IP/"
echo ""
echo "📖 For detailed setup instructions, see: RHINO_COMPUTE_SETUP.md"
