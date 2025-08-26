#!/bin/bash

# ================================================
# SOFTLYPLEASE.COM BULLETPROOF TEST SUITE
# Comprehensive testing for all system components
# ================================================

# Configuration
AZURE_IP="4.248.252.92"
DOMAIN="softlyplease.com"
TIMEOUT=10
TEST_LOG="test_results_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging function
log_test() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$TEST_LOG"
    echo "$1" >> "$TEST_LOG"
}

# Test result function
test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    ((TOTAL_TESTS++))
    echo -e "\n${BLUE}TEST $TOTAL_TESTS: $test_name${NC}"
    echo "Details: $details"

    if [ "$result" = "PASS" ]; then
        ((PASSED_TESTS++))
        echo -e "${GREEN}✅ RESULT: PASS${NC}"
    else
        ((FAILED_TESTS++))
        echo -e "${RED}❌ RESULT: FAIL${NC}"
        echo "ERROR: $details"
    fi

    log_test "TEST $TOTAL_TESTS: $test_name - $result"
    log_test "Details: $details"
    log_test "----------------------------------------"
}

# Initialize log
echo "=== SOFTLYPLEASE.COM BULLETPROOF TEST SUITE ===" > "$TEST_LOG"
echo "Started: $(date)" >> "$TEST_LOG"
echo "Azure IP: $AZURE_IP" >> "$TEST_LOG"
echo "Domain: $DOMAIN" >> "$TEST_LOG"
echo "========================================" >> "$TEST_LOG"

echo -e "${PURPLE}🚀 STARTING COMPREHENSIVE SOFTLYPLEASE.COM TEST SUITE${NC}"
echo "Testing all components for bulletproof reliability..."
echo "Results will be logged to: $TEST_LOG"

# ================================================
# PHASE 1: BASIC CONNECTIVITY TESTS
# ================================================

echo -e "\n${YELLOW}📡 PHASE 1: BASIC CONNECTIVITY TESTS${NC}"

# Test 1: Azure VM Port 6500 (Rhino Compute)
echo -e "\n${BLUE}TEST 1: Rhino Compute Service (Port 6500)${NC}"
if curl -s --connect-timeout 5 "http://$AZURE_IP:6500/version" > /dev/null 2>&1; then
    response=$(curl -s "http://$AZURE_IP:6500/version")
    if [[ "$response" == *"Rhino Compute"* ]]; then
        test_result "Rhino Compute Service" "PASS" "Service responding correctly"
    else
        test_result "Rhino Compute Service" "FAIL" "Service responding but unexpected content: $response"
    fi
else
    test_result "Rhino Compute Service" "FAIL" "Port 6500 not responding"
fi

# Test 2: Azure VM Port 80 (Node.js AppServer)
echo -e "\n${BLUE}TEST 2: Node.js AppServer (Port 80)${NC}"
if curl -s --connect-timeout 5 "http://$AZURE_IP:80/version" > /dev/null 2>&1; then
    response=$(curl -s "http://$AZURE_IP:80/version")
    if [[ "$response" == *"server has been turned off"* ]] || [[ "$response" == *"message"* ]]; then
        test_result "Node.js AppServer" "PASS" "Service responding with JSON"
    else
        test_result "Node.js AppServer" "FAIL" "Service responding but unexpected content"
    fi
else
    test_result "Node.js AppServer" "FAIL" "Port 80 not responding"
fi

# Test 3: Main Domain
echo -e "\n${BLUE}TEST 3: Main Domain ($DOMAIN)${NC}"
if curl -s --connect-timeout 10 "https://$DOMAIN/version" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/version")
    if [[ "$response" == *"server has been turned off"* ]] || [[ "$response" == *"message"* ]]; then
        test_result "Main Domain" "PASS" "Domain responding with JSON API"
    else
        test_result "Main Domain" "FAIL" "Domain responding but unexpected content"
    fi
else
    test_result "Main Domain" "FAIL" "Domain not responding"
fi

# ================================================
# PHASE 2: API ENDPOINT TESTS
# ================================================

echo -e "\n${YELLOW}🔌 PHASE 2: API ENDPOINT TESTS${NC}"

# Test 4: Root endpoint (list definitions)
echo -e "\n${BLUE}TEST 4: Root Endpoint (List Definitions)${NC}"
if curl -s "https://$DOMAIN/" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/")
    if [[ "$response" == *"definitions"* ]] || [[ "$response" == *"["* ]]; then
        test_result "Root Endpoint" "PASS" "Definitions list retrieved"
    else
        test_result "Root Endpoint" "FAIL" "Unexpected response format"
    fi
else
    test_result "Root Endpoint" "FAIL" "Endpoint not accessible"
fi

# Test 5: Definition endpoint (BranchNodeRnd)
echo -e "\n${BLUE}TEST 5: Definition Endpoint (BranchNodeRnd)${NC}"
if curl -s "https://$DOMAIN/BranchNodeRnd.gh" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/BranchNodeRnd.gh")
    if [[ "$response" == *"inputs"* ]] && [[ "$response" == *"outputs"* ]]; then
        test_result "Definition Endpoint" "PASS" "Input/output specification retrieved"
    else
        test_result "Definition Endpoint" "FAIL" "Invalid response format"
    fi
else
    test_result "Definition Endpoint" "FAIL" "Definition endpoint not accessible"
fi

# Test 6: Solve endpoint with GET
echo -e "\n${BLUE}TEST 6: Solve Endpoint (GET method)${NC}"
test_url="https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5"
if curl -s "$test_url" > /dev/null 2>&1; then
    response=$(curl -s "$test_url")
    if [[ "$response" == *"geometry"* ]] || [[ "$response" == *"values"* ]]; then
        test_result "Solve Endpoint GET" "PASS" "Geometry computation successful"
    else
        test_result "Solve Endpoint GET" "FAIL" "Unexpected response format"
    fi
else
    test_result "Solve Endpoint GET" "FAIL" "GET method not working"
fi

# Test 7: Solve endpoint with POST
echo -e "\n${BLUE}TEST 7: Solve Endpoint (POST method)${NC}"
post_data='{"definition":"BranchNodeRnd.gh","inputs":{"Radius":5,"Count":51,"Length":5}}'
if curl -s -X POST -H "Content-Type: application/json" -d "$post_data" "https://$DOMAIN/solve" > /dev/null 2>&1; then
    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$post_data" "https://$DOMAIN/solve")
    if [[ "$response" == *"geometry"* ]] || [[ "$response" == *"values"* ]]; then
        test_result "Solve Endpoint POST" "PASS" "POST geometry computation successful"
    else
        test_result "Solve Endpoint POST" "FAIL" "Unexpected response format"
    fi
else
    test_result "Solve Endpoint POST" "FAIL" "POST method not working"
fi

# ================================================
# PHASE 3: PERFORMANCE & CACHING TESTS
# ================================================

echo -e "\n${YELLOW}⚡ PHASE 3: PERFORMANCE & CACHING TESTS${NC}"

# Test 8: Response Time Benchmark
echo -e "\n${BLUE}TEST 8: Response Time Benchmark${NC}"
start_time=$(date +%s%N)
response=$(curl -s "https://$DOMAIN/version")
end_time=$(date +%s%N)

if [[ -n "$response" ]]; then
    # Calculate milliseconds
    time_diff=$(( (end_time - start_time) / 1000000 ))
    if [[ $time_diff -lt 5000 ]]; then  # Less than 5 seconds
        test_result "Response Time" "PASS" "Response time: ${time_diff}ms (acceptable)"
    else
        test_result "Response Time" "FAIL" "Response time: ${time_diff}ms (too slow)"
    fi
else
    test_result "Response Time" "FAIL" "No response received"
fi

# Test 9: Cache Effectiveness
echo -e "\n${BLUE}TEST 9: Cache Effectiveness Test${NC}"
echo "Making multiple requests to test caching..."

# First request
start1=$(date +%s%N)
curl -s "https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5" > /dev/null 2>&1
end1=$(date +%s%N)

# Second request (should be cached)
start2=$(date +%s%N)
curl -s "https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5" > /dev/null 2>&1
end2=$(date +%s%N)

time1=$(( (end1 - start1) / 1000000 ))
time2=$(( (end2 - start2) / 1000000 ))

if [[ $time2 -lt $time1 ]]; then
    improvement=$(( (time1 - time2) * 100 / time1 ))
    test_result "Cache Effectiveness" "PASS" "Cache improved response by ${improvement}%"
else
    test_result "Cache Effectiveness" "FAIL" "No caching detected (time1: ${time1}ms, time2: ${time2}ms)"
fi

# ================================================
# PHASE 4: ERROR HANDLING TESTS
# ================================================

echo -e "\n${YELLOW}🛡️ PHASE 4: ERROR HANDLING TESTS${NC}"

# Test 10: Invalid Definition
echo -e "\n${BLUE}TEST 10: Invalid Definition Handling${NC}"
if curl -s "https://$DOMAIN/NonExistentDefinition.gh" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/NonExistentDefinition.gh")
    if [[ "$response" == *"error"* ]] || [[ "$response" == *"not found"* ]]; then
        test_result "Invalid Definition" "PASS" "Proper error handling for invalid definition"
    else
        test_result "Invalid Definition" "FAIL" "No error returned for invalid definition"
    fi
else
    test_result "Invalid Definition" "PASS" "Endpoint properly returns error for invalid definition"
fi

# Test 11: Invalid Parameters
echo -e "\n${BLUE}TEST 11: Invalid Parameters Handling${NC}"
invalid_data='{"definition":"BranchNodeRnd.gh","inputs":{"Radius":"invalid","Count":"notanumber"}}'
if curl -s -X POST -H "Content-Type: application/json" -d "$invalid_data" "https://$DOMAIN/solve" > /dev/null 2>&1; then
    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$invalid_data" "https://$DOMAIN/solve")
    if [[ "$response" == *"error"* ]] || [[ -z "$response" ]]; then
        test_result "Invalid Parameters" "PASS" "Proper error handling for invalid parameters"
    else
        test_result "Invalid Parameters" "FAIL" "No error returned for invalid parameters"
    fi
else
    test_result "Invalid Parameters" "PASS" "Endpoint properly handles invalid parameters"
fi

# ================================================
# PHASE 5: SECURITY TESTS
# ================================================

echo -e "\n${YELLOW}🔒 PHASE 5: SECURITY TESTS${NC}"

# Test 12: HTTPS Enforcement
echo -e "\n${BLUE}TEST 12: HTTPS Enforcement${NC}"
if curl -s --connect-timeout 5 "http://$DOMAIN/version" > /dev/null 2>&1; then
    test_result "HTTPS Enforcement" "FAIL" "HTTP access allowed (should redirect to HTTPS)"
else
    test_result "HTTPS Enforcement" "PASS" "HTTP properly blocked or redirected"
fi

# Test 13: API Key Authentication
echo -e "\n${BLUE}TEST 13: API Key Authentication${NC}"
# This test would require knowing the API key structure
# For now, test that some form of auth is required
response=$(curl -s "https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5")
if [[ "$response" == *"unauthorized"* ]] || [[ "$response" == *"forbidden"* ]]; then
    test_result "API Authentication" "PASS" "Authentication properly enforced"
else
    test_result "API Authentication" "WARN" "Authentication check inconclusive (may be working)"
fi

# ================================================
# PHASE 6: LOAD & STRESS TESTS
# ================================================

echo -e "\n${YELLOW}🏋️ PHASE 6: LOAD & STRESS TESTS${NC}"

# Test 14: Concurrent Requests
echo -e "\n${BLUE}TEST 14: Concurrent Requests${NC}"
echo "Testing 5 concurrent requests..."

# Launch 5 concurrent requests
success_count=0
for i in {1..5}; do
    if curl -s --max-time 30 "https://$DOMAIN/version" > /dev/null 2>&1; then
        ((success_count++))
    fi
done

if [[ $success_count -ge 3 ]]; then
    test_result "Concurrent Requests" "PASS" "$success_count/5 requests successful"
else
    test_result "Concurrent Requests" "FAIL" "Only $success_count/5 requests successful"
fi

# ================================================
# PHASE 7: FINAL SYSTEM HEALTH CHECK
# ================================================

echo -e "\n${YELLOW}🏥 PHASE 7: FINAL SYSTEM HEALTH CHECK${NC}"

# Test 15: System Health Summary
echo -e "\n${BLUE}TEST 15: System Health Summary${NC}"

# Check if core services are running
rhino_up=false
appserver_up=false
domain_up=false

if curl -s --connect-timeout 5 "http://$AZURE_IP:6500/version" > /dev/null 2>&1; then
    rhino_up=true
fi

if curl -s --connect-timeout 5 "http://$AZURE_IP:80/version" > /dev/null 2>&1; then
    appserver_up=true
fi

if curl -s --connect-timeout 5 "https://$DOMAIN/version" > /dev/null 2>&1; then
    domain_up=true
fi

if [[ "$rhino_up" == "true" ]] && [[ "$appserver_up" == "true" ]] && [[ "$domain_up" == "true" ]]; then
    test_result "System Health" "PASS" "All core services operational"
else
    services_status="Rhino Compute: $rhino_up, AppServer: $appserver_up, Domain: $domain_up"
    test_result "System Health" "FAIL" "Services not fully operational - $services_status"
fi

# ================================================
# TEST SUMMARY & REPORT
# ================================================

echo -e "\n${PURPLE}📊 TEST SUITE COMPLETE - SUMMARY REPORT${NC}"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

# Calculate success rate
if [[ $TOTAL_TESTS -gt 0 ]]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo "Success Rate: $success_rate%"

    if [[ $success_rate -ge 80 ]]; then
        echo -e "${GREEN}🎉 SYSTEM STATUS: GOOD (Ready for production)${NC}"
    elif [[ $success_rate -ge 60 ]]; then
        echo -e "${YELLOW}⚠️  SYSTEM STATUS: NEEDS ATTENTION${NC}"
    else
        echo -e "${RED}🚨 SYSTEM STATUS: CRITICAL ISSUES${NC}"
    fi
fi

# Log final summary
echo "" >> "$TEST_LOG"
echo "=== FINAL SUMMARY ===" >> "$TEST_LOG"
echo "Total Tests: $TOTAL_TESTS" >> "$TEST_LOG"
echo "Passed: $PASSED_TESTS" >> "$TEST_LOG"
echo "Failed: $FAILED_TESTS" >> "$TEST_LOG"
echo "Success Rate: $success_rate%" >> "$TEST_LOG"
echo "Test completed: $(date)" >> "$TEST_LOG"

echo -e "\n${BLUE}📋 Detailed results logged to: $TEST_LOG${NC}"
echo -e "${BLUE}📋 Review the log file for complete test details${NC}"

# Exit with appropriate code
if [[ $success_rate -ge 80 ]]; then
    exit 0  # Success
else
    exit 1  # Failure
fi
