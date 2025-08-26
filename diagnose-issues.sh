#!/bin/bash

# Complete System Diagnosis Script for softlyplease.com
echo "🔍 SOFTLYPLEASE.COM - Complete System Diagnosis"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
total_tests=0
passed_tests=0

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
    ((passed_tests++))
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_step() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

# Function to test HTTP endpoint and show status code
test_endpoint() {
    local url=$1
    local description=$2
    ((total_tests++))

    echo -n "Testing $description... "

    if response=$(curl -s -w "\nHTTPSTATUS:%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        http_code=$(echo "$response" | grep "HTTPSTATUS:" | cut -d: -f2)
        if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
            print_status "$description (HTTP $http_code)"
            return 0
        else
            print_error "$description (HTTP $http_code)"
            return 1
        fi
    else
        print_error "$description (Connection failed)"
        return 1
    fi
}

# Function to test with timeout
test_endpoint_timeout() {
    local url=$1
    local description=$2
    local timeout=$3
    ((total_tests++))

    echo -n "Testing $description... "

    if response=$(timeout $timeout curl -s -w "\nHTTPSTATUS:%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        http_code=$(echo "$response" | grep "HTTPSTATUS:" | cut -d: -f2)
        if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
            print_status "$description (HTTP $http_code)"
            return 0
        else
            print_error "$description (HTTP $http_code)"
            return 1
        fi
    else
        print_error "$description (Timeout/Connection failed)"
        return 1
    fi
}

echo "Starting comprehensive system diagnosis..."
echo

# Test 1: Main Website
print_step "1. Testing Main Website"
test_endpoint "https://softlyplease.com/" "Main Website (softlyplease.com)"

# Test 2: Heroku AppServer
print_step "2. Testing Heroku AppServer"
test_endpoint "https://softlyplease-appserver.herokuapp.com/version" "Heroku AppServer /version"

# Test 3: Azure VM Node.js AppServer
print_step "3. Testing Azure VM Node.js AppServer"
test_endpoint "http://4.248.252.92:80/version" "Azure VM AppServer /version"

# Test 4: Azure VM Rhino Compute
print_step "4. Testing Azure VM Rhino Compute"
test_endpoint_timeout "http://4.248.252.92:6500/version" "Azure VM Rhino Compute /version" 15

# Test 5: Full Pipeline Test (if basic services are working)
print_step "5. Testing Full Pipeline"
if curl -s --max-time 10 "https://softlyplease-appserver.herokuapp.com/solve/BranchNodeRnd.gh?Radius=5&Count=10" > /dev/null 2>&1; then
    print_status "Full Pipeline (Heroku)"
else
    print_warning "Full Pipeline (Heroku) - may need Azure services running"
fi

if curl -s --max-time 30 "http://4.248.252.92:80/solve/BranchNodeRnd.gh?Radius=5&Count=10" > /dev/null 2>&1; then
    print_status "Full Pipeline (Azure VM)"
else
    print_warning "Full Pipeline (Azure VM) - services may not be running"
fi

# Test 6: DNS Resolution
print_step "6. Testing DNS Resolution"
if nslookup softlyplease.com > /dev/null 2>&1; then
    print_status "DNS Resolution (softlyplease.com)"
else
    print_error "DNS Resolution (softlyplease.com)"
fi

# Test 7: Heroku App Status
print_step "7. Testing Heroku App Status"
if command -v heroku &> /dev/null; then
    if heroku apps:info softlyplease-appserver &> /dev/null; then
        print_status "Heroku App Exists"
        echo -e "${BLUE}   App Info:$(heroku apps:info softlyplease-appserver | grep -E "(Status|Web URL|Region)" | head -3)${NC}"
    else
        print_error "Heroku App Not Found"
    fi
else
    print_warning "Heroku CLI not available - cannot check app status"
fi

# Test 8: Azure VM Network Connectivity
print_step "8. Testing Azure VM Network Connectivity"
if ping -c 1 -W 5 4.248.252.92 > /dev/null 2>&1; then
    print_status "Azure VM Ping (4.248.252.92)"
else
    print_warning "Azure VM Ping (4.248.252.92) - may be firewall blocking ICMP"
fi

# Test 9: SSL Certificate (if applicable)
print_step "9. Testing SSL Certificate"
if curl -s -I https://softlyplease.com/ | grep -q "200 OK"; then
    print_status "SSL Certificate (softlyplease.com)"
else
    print_warning "SSL Certificate check inconclusive"
fi

echo
echo "📊 DIAGNOSIS RESULTS"
echo "=================="
echo "Tests Run: $total_tests"
echo "Tests Passed: $passed_tests"
echo "Tests Failed: $((total_tests - passed_tests))"
echo "Success Rate: $((passed_tests * 100 / total_tests))%"
echo

# Component Status Summary
echo "🔴 COMPONENT STATUS SUMMARY"
echo "=========================="

# Main Website
if curl -s --max-time 10 "https://softlyplease.com/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Main Website (softlyplease.com)${NC}"
else
    echo -e "${RED}❌ Main Website (softlyplease.com)${NC}"
fi

# Heroku AppServer
if curl -s --max-time 10 "https://softlyplease-appserver.herokuapp.com/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Heroku AppServer${NC}"
else
    echo -e "${RED}❌ Heroku AppServer${NC}"
fi

# Azure VM AppServer
if curl -s --max-time 10 "http://4.248.252.92:80/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Azure VM Node.js AppServer${NC}"
else
    echo -e "${RED}❌ Azure VM Node.js AppServer${NC}"
fi

# Azure VM Rhino Compute
if timeout 15 curl -s --max-time 10 "http://4.248.252.92:6500/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Azure VM Rhino Compute${NC}"
else
    echo -e "${RED}❌ Azure VM Rhino Compute${NC}"
fi

# Full Pipeline
if curl -s --max-time 30 "http://4.248.252.92:80/solve/BranchNodeRnd.gh?Radius=5&Count=10" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Full Pipeline${NC}"
else
    echo -e "${RED}❌ Full Pipeline${NC}"
fi

echo
echo "🎯 RECOMMENDED FIX ORDER:"
echo "========================"
echo "1. Run: scripts/azure/restart-services.ps1 (on Azure VM)"
echo "2. Run: scripts/heroku/heroku-deploy.sh (on local machine)"
echo "3. Run: ./diagnose-issues.sh (to verify fixes)"
echo
echo "🔧 QUICK MANUAL COMMANDS:"
echo "========================"
echo "Azure VM (PowerShell):"
echo "  Get-Service SoftlyPleaseAppServer, 'Rhino.Compute'"
echo "  Start-Service SoftlyPleaseAppServer"
echo "  Start-Service 'Rhino.Compute'"
echo
echo "Local Machine (Terminal):"
echo "  git add . && git commit -m 'fix' && git push heroku main"
echo "  heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/"
echo
echo "Test Commands:"
echo "  curl http://4.248.252.92:80/version"
echo "  curl http://4.248.252.92:6500/version"
echo "  curl https://softlyplease-appserver.herokuapp.com/version"
echo
echo "🎉 Diagnosis Complete!"
echo "Run the fix scripts in order to restore softlyplease.com"
