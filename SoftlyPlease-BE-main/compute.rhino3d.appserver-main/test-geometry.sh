#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Testing McNeel Examples Geometry Visibility"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Compute server first
echo -e "\n${YELLOW}1. Testing Compute Server Connection...${NC}"
if curl -sS http://4.248.252.92:6001/version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compute server is running${NC}"
    COMPUTE_VERSION=$(curl -sS http://4.248.252.92:6001/version)
    echo "   Version: $COMPUTE_VERSION"
else
    echo -e "${RED}❌ Compute server is NOT running${NC}"
    echo "   Please start Rhino Compute on Azure VM first"
    echo "   Run: ./start-rhino-compute-azure.sh"
    exit 1
fi

# Test AppServer connection
echo -e "\n${YELLOW}2. Testing AppServer Connection...${NC}"
if curl -sSI https://www.softlyplease.com/examples/ | grep -q "200 OK"; then
    echo -e "${GREEN}✅ AppServer is responding${NC}"
else
    echo -e "${RED}❌ AppServer is not responding${NC}"
    exit 1
fi

# Test solve endpoint with actual geometry
echo -e "\n${YELLOW}3. Testing Geometry Generation (BranchNodeRnd)...${NC}"
SOLVE_RESPONSE=$(curl -sS -X POST https://www.softlyplease.com/solve/ \
  -H "Content-Type: application/json" \
  -d '{"definition":"BranchNodeRnd.gh","inputs":{"Count":10,"Radius":5,"Length":3}}' 2>/dev/null || echo "ERROR")

if [[ "$SOLVE_RESPONSE" == "ERROR" ]]; then
    echo -e "${RED}❌ Solve endpoint failed${NC}"
    echo "   Check Heroku logs: heroku logs --tail -a softlyplease-appserver"
elif [[ "$SOLVE_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}❌ Geometry computation error${NC}"
    echo "   Response: $SOLVE_RESPONSE"
else
    echo -e "${GREEN}✅ Geometry computation successful${NC}"
    echo "   Response length: ${#SOLVE_RESPONSE} characters"
fi

# Test McNeel examples page
echo -e "\n${YELLOW}4. Testing McNeel Examples Page...${NC}"
EXAMPLES_HTML=$(curl -sS https://www.softlyplease.com/mcneel-examples 2>/dev/null || echo "ERROR")

if [[ "$EXAMPLES_HTML" == "ERROR" ]]; then
    echo -e "${RED}❌ McNeel examples page not accessible${NC}"
else
    EXAMPLE_COUNT=$(echo "$EXAMPLES_HTML" | grep -c "href=\"/examples/")
    if [[ $EXAMPLE_COUNT -gt 0 ]]; then
        echo -e "${GREEN}✅ McNeel examples page working${NC}"
        echo "   Found $EXAMPLE_COUNT examples listed"
    else
        echo -e "${RED}❌ No examples found on page${NC}"
    fi
fi

# Test specific example (spikyThing)
echo -e "\n${YELLOW}5. Testing SpikyThing Example...${NC}"
SPIKY_HTML=$(curl -sS https://www.softlyplease.com/examples/spikyThing/ 2>/dev/null || echo "ERROR")

if [[ "$SPIKY_HTML" == "ERROR" ]]; then
    echo -e "${RED}❌ SpikyThing example not accessible${NC}"
else
    if echo "$SPIKY_HTML" | grep -q "/loader.js"; then
        echo -e "${GREEN}✅ SpikyThing using new loader system${NC}"
    else
        echo -e "${YELLOW}⚠️  SpikyThing may be using old loading system${NC}"
    fi

    if echo "$SPIKY_HTML" | grep -q "BranchNodeRnd.gh"; then
        echo -e "${GREEN}✅ SpikyThing configured with correct definition${NC}"
    else
        echo -e "${RED}❌ SpikyThing definition not found${NC}"
    fi
fi

# Summary
echo -e "\n${YELLOW}📋 SUMMARY${NC}"
echo "================================================"
echo "Compute Server: $(curl -sS http://4.248.252.92:6001/version > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Down")"
echo "AppServer: $(curl -sSI https://www.softlyplease.com/examples/ | grep -q "200 OK" && echo "✅ Responding" || echo "❌ Down")"
echo "Solve API: $(curl -sS -X POST https://www.softlyplease.com/solve/ -H "Content-Type: application/json" -d '{"definition":"BranchNodeRnd.gh","inputs":{"Count":1}}' > /dev/null 2>&1 && echo "✅ Working" || echo "❌ Failing")"
echo "Examples Page: $(curl -sS https://www.softlyplease.com/mcneel-examples > /dev/null 2>&1 && echo "✅ Accessible" || echo "❌ Down")"

echo -e "\n${GREEN}🎯 If geometry is still not visible:${NC}"
echo "1. Check browser console for JavaScript errors"
echo "2. Verify Three.js is loading: window.THREE should exist"
echo "3. Check Compute server logs on Azure VM"
echo "4. Test with: curl -sS http://4.248.252.92:6001/version"
echo "5. Check Heroku logs: heroku logs --tail -a softlyplease-appserver"
