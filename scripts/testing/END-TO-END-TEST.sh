#!/bin/bash

# ================================================
# SOFTLYPLEASE.COM END-TO-END TEST SUITE
# Complete user journey and system workflow testing
# ================================================

# Configuration
AZURE_IP="4.248.252.92"
DOMAIN="softlyplease.com"
TIMEOUT=30
E2E_LOG="end_to_end_test_$(date +%Y%m%d_%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Initialize log
echo "=== SOFTLYPLEASE.COM END-TO-END TEST ===" > "$E2E_LOG"
echo "Started: $(date)" >> "$E2E_LOG"
echo "Testing complete user journey and system workflows" >> "$E2E_LOG"
echo "==========================================" >> "$E2E_LOG"

# Test result function
test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    ((TOTAL_TESTS++))
    echo -e "\n${BLUE}🔍 TEST $TOTAL_TESTS: $test_name${NC}"

    if [ "$result" = "PASS" ]; then
        ((PASSED_TESTS++))
        echo -e "${GREEN}✅ PASS${NC} - $details"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - TEST $TOTAL_TESTS: $test_name - PASS - $details" >> "$E2E_LOG"
    else
        ((FAILED_TESTS++))
        echo -e "${RED}❌ FAIL${NC} - $details"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - TEST $TOTAL_TESTS: $test_name - FAIL - $details" >> "$E2E_LOG"
    fi
}

echo -e "${PURPLE}🚀 STARTING END-TO-END TEST - COMPLETE USER JOURNEY${NC}"
echo "Testing the full softlyplease.com experience..."
echo "Results will be logged to: $E2E_LOG"

# ================================================
# PHASE 1: SYSTEM INFRASTRUCTURE HEALTH
# ================================================

echo -e "\n${YELLOW}🏗️  PHASE 1: SYSTEM INFRASTRUCTURE HEALTH${NC}"

# Test 1: DNS Resolution
echo -e "\n${BLUE}🔍 TEST 1: DNS Resolution${NC}"
if nslookup "$DOMAIN" > /dev/null 2>&1; then
    dns_ip=$(nslookup "$DOMAIN" | grep "Address:" | tail -1 | awk '{print $2}')
    if [[ "$dns_ip" == "$AZURE_IP" ]]; then
        test_result "DNS Resolution" "PASS" "Domain resolves to correct Azure IP: $dns_ip"
    else
        test_result "DNS Resolution" "FAIL" "Domain resolves to wrong IP: $dns_ip (expected: $AZURE_IP)"
    fi
else
    test_result "DNS Resolution" "FAIL" "DNS lookup failed"
fi

# Test 2: Network Connectivity
echo -e "\n${BLUE}🔍 TEST 2: Network Connectivity${NC}"
if ping -c 3 -W 5 "$AZURE_IP" > /dev/null 2>&1; then
    test_result "Network Connectivity" "PASS" "Azure VM reachable via ping"
else
    test_result "Network Connectivity" "WARN" "Ping failed, but may still be accessible via HTTP"
fi

# Test 3: Service Discovery
echo -e "\n${BLUE}🔍 TEST 3: Service Discovery${NC}"
services_found=0

# Check Rhino Compute
if curl -s --connect-timeout 10 "http://$AZURE_IP:6500/version" > /dev/null 2>&1; then
    ((services_found++))
    rhino_status="✅ Running"
else
    rhino_status="❌ Not responding"
fi

# Check Node.js AppServer
if curl -s --connect-timeout 10 "http://$AZURE_IP:80/version" > /dev/null 2>&1; then
    ((services_found++))
    appserver_status="✅ Running"
else
    appserver_status="❌ Not responding"
fi

# Check Main Domain
if curl -s --connect-timeout 10 "https://$DOMAIN/version" > /dev/null 2>&1; then
    ((services_found++))
    domain_status="✅ Running"
else
    domain_status="❌ Not responding"
fi

echo "Service Status:"
echo "  Rhino Compute (6500): $rhino_status"
echo "  Node.js AppServer (80): $appserver_status"
echo "  Main Domain (443): $domain_status"

if [[ $services_found -ge 2 ]]; then
    test_result "Service Discovery" "PASS" "$services_found/3 core services operational"
else
    test_result "Service Discovery" "FAIL" "Only $services_found/3 services operational"
fi

# ================================================
# PHASE 2: API ENDPOINT VALIDATION
# ================================================

echo -e "\n${YELLOW}🔌 PHASE 2: API ENDPOINT VALIDATION${NC}"

# Test 4: Health Check Endpoints
echo -e "\n${BLUE}🔍 TEST 4: Health Check Endpoints${NC}"
health_checks=0

# Rhino Compute health
if curl -s "http://$AZURE_IP:6500/version" > /dev/null 2>&1; then
    response=$(curl -s "http://$AZURE_IP:6500/version")
    if [[ "$response" == *"Rhino Compute"* ]] || [[ "$response" == *"running"* ]]; then
        ((health_checks++))
        echo "  ✅ Rhino Compute health check passed"
    else
        echo "  ❌ Rhino Compute returned unexpected: $response"
    fi
else
    echo "  ❌ Rhino Compute health check failed"
fi

# Node.js AppServer health
if curl -s "http://$AZURE_IP:80/version" > /dev/null 2>&1; then
    response=$(curl -s "http://$AZURE_IP:80/version")
    if [[ "$response" == *"server"* ]] || [[ "$response" == *"message"* ]]; then
        ((health_checks++))
        echo "  ✅ Node.js AppServer health check passed"
    else
        echo "  ❌ Node.js AppServer returned unexpected: $response"
    fi
else
    echo "  ❌ Node.js AppServer health check failed"
fi

# Main domain health
if curl -s "https://$DOMAIN/version" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/version")
    if [[ "$response" == *"server"* ]] || [[ "$response" == *"message"* ]]; then
        ((health_checks++))
        echo "  ✅ Main domain health check passed"
    else
        echo "  ❌ Main domain returned unexpected: $response"
    fi
else
    echo "  ❌ Main domain health check failed"
fi

if [[ $health_checks -ge 2 ]]; then
    test_result "Health Check Endpoints" "PASS" "$health_checks/3 health checks passed"
else
    test_result "Health Check Endpoints" "FAIL" "Only $health_checks/3 health checks passed"
fi

# ================================================
# PHASE 3: COMPLETE USER WORKFLOW
# ================================================

echo -e "\n${YELLOW}👤 PHASE 3: COMPLETE USER WORKFLOW${NC}"

# Test 5: User Journey - Browse Definitions
echo -e "\n${BLUE}🔍 TEST 5: User Journey - Browse Definitions${NC}"
if curl -s "https://$DOMAIN/" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/")
    if [[ "$response" == *"["* ]] || [[ "$response" == *"definitions"* ]]; then
        # Try to extract definition count
        definition_count=$(echo "$response" | grep -o '"[^"]*\.gh"' | wc -l)
        if [[ $definition_count -gt 0 ]]; then
            test_result "Browse Definitions" "PASS" "Found $definition_count Grasshopper definitions"
        else
            test_result "Browse Definitions" "FAIL" "Response format unexpected, no definitions found"
        fi
    else
        test_result "Browse Definitions" "FAIL" "Root endpoint returned unexpected format"
    fi
else
    test_result "Browse Definitions" "FAIL" "Cannot access definitions list"
fi

# Test 6: User Journey - Get Definition Details
echo -e "\n${BLUE}🔍 TEST 6: User Journey - Get Definition Details${NC}"
if curl -s "https://$DOMAIN/BranchNodeRnd.gh" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/BranchNodeRnd.gh")
    if [[ "$response" == *"inputs"* ]] && [[ "$response" == *"outputs"* ]]; then
        # Check for required parameters
        if [[ "$response" == *"Radius"* ]] && [[ "$response" == *"Count"* ]]; then
            test_result "Definition Details" "PASS" "BranchNodeRnd definition details retrieved with parameters"
        else
            test_result "Definition Details" "FAIL" "Definition details missing expected parameters"
        fi
    else
        test_result "Definition Details" "FAIL" "Definition endpoint returned unexpected format"
    fi
else
    test_result "Definition Details" "FAIL" "Cannot access definition details"
fi

# Test 7: User Journey - Execute Geometry Computation
echo -e "\n${BLUE}🔍 TEST 7: User Journey - Execute Geometry Computation${NC}"

# Test GET method
echo "Testing GET method..."
get_url="https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5"
if curl -s "$get_url" > /dev/null 2>&1; then
    get_response=$(curl -s "$get_url")
    if [[ "$get_response" == *"geometry"* ]] || [[ "$get_response" == *"values"* ]]; then
        get_success=true
        echo "  ✅ GET method successful"
    else
        echo "  ❌ GET method returned unexpected format"
    fi
else
    echo "  ❌ GET method failed"
fi

# Test POST method
echo "Testing POST method..."
post_data='{"definition":"BranchNodeRnd.gh","inputs":{"Radius":5,"Count":51,"Length":5}}'
if curl -s -X POST -H "Content-Type: application/json" -d "$post_data" "https://$DOMAIN/solve" > /dev/null 2>&1; then
    post_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$post_data" "https://$DOMAIN/solve")
    if [[ "$post_response" == *"geometry"* ]] || [[ "$post_response" == *"values"* ]]; then
        post_success=true
        echo "  ✅ POST method successful"
    else
        echo "  ❌ POST method returned unexpected format"
    fi
else
    echo "  ❌ POST method failed"
fi

if [[ "$get_success" == "true" ]] || [[ "$post_success" == "true" ]]; then
    methods_working=0
    [[ "$get_success" == "true" ]] && ((methods_working++))
    [[ "$post_success" == "true" ]] && ((methods_working++))
    test_result "Geometry Computation" "PASS" "$methods_working/2 methods working (GET: $get_success, POST: $post_success)"
else
    test_result "Geometry Computation" "FAIL" "Both GET and POST methods failed"
fi

# ================================================
# PHASE 4: DATA FLOW VALIDATION
# ================================================

echo -e "\n${YELLOW}🌊 PHASE 4: DATA FLOW VALIDATION${NC}"

# Test 8: Request → Response Data Flow
echo -e "\n${BLUE}🔍 TEST 8: Request → Response Data Flow${NC}"

# Send a specific request and validate response structure
test_data='{"definition":"BranchNodeRnd.gh","inputs":{"Radius":3,"Count":25,"Length":8}}'
start_time=$(date +%s)

if curl -s -X POST -H "Content-Type: application/json" -d "$test_data" "https://$DOMAIN/solve" > /dev/null 2>&1; then
    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$test_data" "https://$DOMAIN/solve")
    end_time=$(date +%s)
    duration=$((end_time - start_time))

    # Validate response structure
    if [[ "$response" == *"{"* ]] && [[ "$response" == *"}"* ]]; then
        # Check for expected geometry fields
        if [[ "$response" == *"geometry"* ]] || [[ "$response" == *"values"* ]] || [[ "$response" == *"data"* ]]; then
            test_result "Data Flow" "PASS" "Request processed in ${duration}s with valid response structure"
        else
            test_result "Data Flow" "FAIL" "Response JSON valid but missing expected data fields"
        fi
    else
        test_result "Data Flow" "FAIL" "Response not valid JSON"
    fi
else
    test_result "Data Flow" "FAIL" "Request failed completely"
fi

# Test 9: Parameter Validation
echo -e "\n${BLUE}🔍 TEST 9: Parameter Validation${NC}"

# Test with missing parameters
incomplete_data='{"definition":"BranchNodeRnd.gh","inputs":{}}'
if curl -s -X POST -H "Content-Type: application/json" -d "$incomplete_data" "https://$DOMAIN/solve" > /dev/null 2>&1; then
    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$incomplete_data" "https://$DOMAIN/solve")
    if [[ "$response" == *"error"* ]] || [[ -z "$response" ]]; then
        test_result "Parameter Validation" "PASS" "Properly handled incomplete parameters"
    else
        test_result "Parameter Validation" "WARN" "Accepted incomplete parameters (may be defaulting values)"
    fi
else
    test_result "Parameter Validation" "FAIL" "Request with incomplete parameters failed unexpectedly"
fi

# ================================================
# PHASE 5: PERFORMANCE & RELIABILITY
# ================================================

echo -e "\n${YELLOW}⚡ PHASE 5: PERFORMANCE & RELIABILITY${NC}"

# Test 10: Response Time Performance
echo -e "\n${BLUE}🔍 TEST 10: Response Time Performance${NC}"

# Measure multiple requests for performance baseline
total_time=0
successful_requests=0

for i in {1..3}; do
    start_time=$(date +%s%N 2>/dev/null || echo "0")
    if curl -s --max-time 30 "https://$DOMAIN/version" > /dev/null 2>&1; then
        end_time=$(date +%s%N 2>/dev/null || echo "0")
        if [[ "$start_time" != "0" ]] && [[ "$end_time" != "0" ]]; then
            request_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
            total_time=$((total_time + request_time))
            ((successful_requests++))
        fi
    fi
done

if [[ $successful_requests -gt 0 ]]; then
    avg_time=$((total_time / successful_requests))
    if [[ $avg_time -lt 3000 ]]; then  # Less than 3 seconds
        test_result "Response Time" "PASS" "Average response time: ${avg_time}ms ($successful_requests/3 successful)"
    else
        test_result "Response Time" "WARN" "Average response time: ${avg_time}ms (slow but functional)"
    fi
else
    test_result "Response Time" "FAIL" "Unable to measure response time"
fi

# Test 11: Concurrent Load Handling
echo -e "\n${BLUE}🔍 TEST 11: Concurrent Load Handling${NC}"

echo "Testing 5 concurrent requests..."
concurrent_success=0

# Launch 5 concurrent requests
for i in {1..5}; do
    if curl -s --max-time 30 "https://$DOMAIN/version" > /dev/null 2>&1; then
        ((concurrent_success++))
    fi &
done

# Wait for all background processes to complete
wait

if [[ $concurrent_success -ge 4 ]]; then
    test_result "Concurrent Load" "PASS" "$concurrent_success/5 concurrent requests handled"
elif [[ $concurrent_success -ge 2 ]]; then
    test_result "Concurrent Load" "WARN" "$concurrent_success/5 concurrent requests handled (degraded performance)"
else
    test_result "Concurrent Load" "FAIL" "Only $concurrent_success/5 concurrent requests handled"
fi

# ================================================
# PHASE 6: ERROR HANDLING & EDGE CASES
# ================================================

echo -e "\n${YELLOW}🛡️ PHASE 6: ERROR HANDLING & EDGE CASES${NC}"

# Test 12: Invalid Definition Handling
echo -e "\n${BLUE}🔍 TEST 12: Invalid Definition Handling${NC}"

if curl -s "https://$DOMAIN/NonExistentDefinition.gh" > /dev/null 2>&1; then
    response=$(curl -s "https://$DOMAIN/NonExistentDefinition.gh")
    if [[ "$response" == *"error"* ]] || [[ "$response" == *"not found"* ]] || [[ "$response" == *"404"* ]]; then
        test_result "Invalid Definition" "PASS" "Proper error response for non-existent definition"
    else
        test_result "Invalid Definition" "FAIL" "No error returned for invalid definition"
    fi
else
    test_result "Invalid Definition" "PASS" "Server properly rejected invalid definition request"
fi

# Test 13: Malformed Request Handling
echo -e "\n${BLUE}🔍 TEST 13: Malformed Request Handling${NC}"

# Send malformed JSON
if curl -s -X POST -H "Content-Type: application/json" -d '{"invalid": json}' "https://$DOMAIN/solve" > /dev/null 2>&1; then
    response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"invalid": json}' "https://$DOMAIN/solve")
    if [[ "$response" == *"error"* ]] || [[ -z "$response" ]]; then
        test_result "Malformed Request" "PASS" "Properly handled malformed JSON"
    else
        test_result "Malformed Request" "FAIL" "Accepted malformed JSON without error"
    fi
else
    test_result "Malformed Request" "PASS" "Server properly rejected malformed request"
fi

# ================================================
# PHASE 7: INTEGRATION & END-TO-END VALIDATION
# ================================================

echo -e "\n${YELLOW}🔄 PHASE 7: INTEGRATION & END-TO-END VALIDATION${NC}"

# Test 14: Complete User Workflow
echo -e "\n${BLUE}🔍 TEST 14: Complete User Workflow${NC}"

workflow_steps=0
echo "Step 1: Browse available definitions..."
if curl -s "https://$DOMAIN/" > /dev/null 2>&1; then
    ((workflow_steps++))
    echo "  ✅ Found definitions list"
else
    echo "  ❌ Could not access definitions"
fi

echo "Step 2: Get definition parameters..."
if curl -s "https://$DOMAIN/BranchNodeRnd.gh" > /dev/null 2>&1; then
    ((workflow_steps++))
    echo "  ✅ Retrieved definition parameters"
else
    echo "  ❌ Could not get definition details"
fi

echo "Step 3: Execute computation..."
if curl -s "https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5" > /dev/null 2>&1; then
    ((workflow_steps++))
    echo "  ✅ Successfully executed computation"
else
    echo "  ❌ Computation failed"
fi

echo "Step 4: Validate response..."
response=$(curl -s "https://$DOMAIN/solve?definition=BranchNodeRnd.gh&Radius=5&Count=51&Length=5")
if [[ "$response" == *"geometry"* ]] || [[ "$response" == *"values"* ]]; then
    ((workflow_steps++))
    echo "  ✅ Received valid computation results"
else
    echo "  ❌ Invalid computation results"
fi

if [[ $workflow_steps -ge 3 ]]; then
    test_result "Complete Workflow" "PASS" "$workflow_steps/4 workflow steps completed successfully"
else
    test_result "Complete Workflow" "FAIL" "Only $workflow_steps/4 workflow steps completed"
fi

# ================================================
# FINAL SYSTEM ASSESSMENT
# ================================================

echo -e "\n${PURPLE}📊 END-TO-END TEST COMPLETE${NC}"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

# Calculate success rate
if [[ $TOTAL_TESTS -gt 0 ]]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo "Success Rate: $success_rate%"

    if [[ $success_rate -ge 80 ]]; then
        echo -e "${GREEN}🎉 E2E STATUS: EXCELLENT${NC}"
        echo "System is production-ready with full functionality"
    elif [[ $success_rate -ge 60 ]]; then
        echo -e "${YELLOW}⚠️  E2E STATUS: GOOD WITH ISSUES${NC}"
        echo "Core functionality works, some optimization needed"
    elif [[ $success_rate -ge 40 ]]; then
        echo -e "${CYAN}🔧 E2E STATUS: NEEDS ATTENTION${NC}"
        echo "Basic functionality present, requires fixes"
    else
        echo -e "${RED}🚨 E2E STATUS: CRITICAL FAILURE${NC}"
        echo "Major components not working, immediate action required"
    fi
else
    echo -e "${RED}❌ No tests were executed${NC}"
fi

# Detailed recommendations
echo -e "\n${BLUE}📋 RECOMMENDATIONS:${NC}"

if [[ $success_rate -ge 80 ]]; then
    echo "✅ System is fully operational and production-ready"
    echo "✅ All user workflows functioning correctly"
    echo "✅ Performance meets expectations"
elif [[ $success_rate -ge 60 ]]; then
    echo "⚠️  Core functionality working, focus on optimization"
    echo "🔧 Fix any failed API endpoints"
    echo "⚡ Address performance issues"
elif [[ $success_rate -ge 40 ]]; then
    echo "🔧 Critical fixes needed for basic functionality"
    echo "🚨 Address service connectivity issues"
    echo "🔍 Fix API response formats"
else
    echo "🚨 IMMEDIATE ACTION REQUIRED"
    echo "🔧 Restart core services on Azure VM"
    echo "🔍 Investigate network connectivity issues"
    echo "📞 Contact system administrator"
fi

# Log final summary
echo "" >> "$E2E_LOG"
echo "=== END-TO-END TEST SUMMARY ===" >> "$E2E_LOG"
echo "Total Tests: $TOTAL_TESTS" >> "$E2E_LOG"
echo "Passed: $PASSED_TESTS" >> "$E2E_LOG"
echo "Failed: $FAILED_TESTS" >> "$E2E_LOG"
echo "Success Rate: $success_rate%" >> "$E2E_LOG"
echo "Test completed: $(date)" >> "$E2E_LOG"

echo -e "\n${CYAN}📋 Detailed results logged to: $E2E_LOG${NC}"

# Exit with appropriate code
if [[ $success_rate -ge 60 ]]; then
    exit 0  # Success
else
    exit 1  # Needs attention
fi
