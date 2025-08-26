#!/bin/bash

# SoftlyPlease Complete System Diagnosis Script
# Run this from your local machine to check all components

echo "🚨 SOFTLYPLEASE.COM COMPLETE SYSTEM DIAGNOSIS"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CHECKING HEROKU APPSERVER ===${NC}"
echo "Testing: https://softlyplease-appserver.herokuapp.com/version"

heroku_status=$(curl -s -w "%{http_code}" -o /dev/null https://softlyplease-appserver.herokuapp.com/version)
if [ "$heroku_status" = "200" ]; then
    echo -e "${GREEN}✅ Heroku AppServer: WORKING (HTTP $heroku_status)${NC}"
else
    echo -e "${RED}❌ Heroku AppServer: DOWN (HTTP $heroku_status)${NC}"
fi

echo ""
echo -e "${BLUE}=== CHECKING AZURE VM PORT 80 (Node.js AppServer) ===${NC}"
echo "Testing: http://4.248.252.92:80/version"

azure80_status=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 http://4.248.252.92:80/version)
if [ "$azure80_status" = "200" ]; then
    echo -e "${GREEN}✅ Azure VM Port 80: WORKING (HTTP $azure80_status)${NC}"
    # Get the actual response
    azure80_response=$(curl -s http://4.248.252.92:80/version)
    echo "   Response: ${azure80_response:0:100}..."
else
    echo -e "${RED}❌ Azure VM Port 80: DOWN (HTTP $azure80_status)${NC}"
fi

echo ""
echo -e "${BLUE}=== CHECKING AZURE VM PORT 6500 (Rhino Compute) ===${NC}"
echo "Testing: http://4.248.252.92:6500/version"

azure6500_status=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 http://4.248.252.92:6500/version)
if [ "$azure6500_status" = "200" ]; then
    echo -e "${GREEN}✅ Azure VM Port 6500: WORKING (HTTP $azure6500_status)${NC}"
    # Get the actual response
    azure6500_response=$(curl -s http://4.248.252.92:6500/version)
    echo "   Response: ${azure6500_response:0:100}..."
else
    echo -e "${RED}❌ Azure VM Port 6500: DOWN (HTTP $azure6500_status)${NC}"
fi

echo ""
echo -e "${BLUE}=== CHECKING FULL PIPELINE ===${NC}"
echo "Testing: https://softlyplease-appserver.herokuapp.com/solve/BranchNodeRnd.gh?Radius=5&Count=51&Length=5"

pipeline_status=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 30 "https://softlyplease-appserver.herokuapp.com/solve/BranchNodeRnd.gh?Radius=5&Count=51&Length=5")
if [ "$pipeline_status" = "200" ]; then
    echo -e "${GREEN}✅ Full Pipeline: WORKING (HTTP $pipeline_status)${NC}"
else
    echo -e "${RED}❌ Full Pipeline: DOWN (HTTP $pipeline_status)${NC}"
fi

echo ""
echo -e "${BLUE}=== CHECKING MAIN WEBSITE ===${NC}"
echo "Testing: https://softlyplease.com/"

website_status=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 https://softlyplease.com/)
if [ "$website_status" = "200" ]; then
    echo -e "${GREEN}✅ Main Website: WORKING (HTTP $website_status)${NC}"
else
    echo -e "${RED}❌ Main Website: DOWN (HTTP $website_status)${NC}"
fi

echo ""
echo -e "${BLUE}=== DIAGNOSIS SUMMARY ===${NC}"

# Count working components
working_count=0
if [ "$heroku_status" = "200" ]; then ((working_count++)); fi
if [ "$azure80_status" = "200" ]; then ((working_count++)); fi
if [ "$azure6500_status" = "200" ]; then ((working_count++)); fi
if [ "$pipeline_status" = "200" ]; then ((working_count++)); fi
if [ "$website_status" = "200" ]; then ((working_count++)); fi

echo "Working Components: $working_count/5"
echo ""

if [ $working_count -eq 5 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
    echo "softlyplease.com is fully functional."
else
    echo -e "${RED}🔥 SYSTEMS DOWN - REQUIRES IMMEDIATE ATTENTION${NC}"
    echo ""
    echo -e "${YELLOW}ISSUES FOUND:${NC}"

    if [ "$heroku_status" != "200" ]; then
        echo "❌ Heroku AppServer is DOWN (needs redeployment)"
    fi

    if [ "$azure80_status" != "200" ]; then
        echo "❌ Azure VM Node.js AppServer is DOWN (service not running)"
    fi

    if [ "$azure6500_status" != "200" ]; then
        echo "❌ Azure VM Rhino Compute is DOWN (service not running)"
    fi

    if [ "$pipeline_status" != "200" ]; then
        echo "❌ Compute pipeline is broken (services can't communicate)"
    fi

    if [ "$website_status" != "200" ]; then
        echo "❌ Main website is not accessible"
    fi
fi

echo ""
echo -e "${BLUE}=== RECOMMENDED FIX ORDER ===${NC}"
echo "1. Run the Azure VM service restart script (most critical)"
echo "2. Redeploy Heroku app if still down"
echo "3. Test all endpoints again"
echo "4. Verify DNS and firewall settings"

echo ""
echo -e "${BLUE}=== QUICK FIX SCRIPTS ===${NC}"
echo "Azure VM (run as Administrator):"
echo "   C:\Users\YourUsername\compute-sp\scripts\azure\restart-services.ps1"
echo ""
echo "Heroku Redeploy:"
echo "   cd /Users/petersancho/compute-sp && ./scripts/heroku/heroku-deploy.sh"

echo ""
echo "Run this diagnosis script again after fixes:"
echo "   ./diagnose-issues.sh"
