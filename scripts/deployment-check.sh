#!/bin/bash

# SoftlyPlease Deployment Verification Script
# Run this after deployment to verify all components are working

echo "🚀 SOFTLYPLEASE DEPLOYMENT VERIFICATION"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to test endpoint
test_endpoint() {
    local url=$1
    local expected=$2
    local description=$3

    echo -e "${BLUE}Testing: $description${NC}"
    echo "URL: $url"

    if curl -s -w "HTTP_STATUS:%{http_code}" "$url" | grep -q "HTTP_STATUS:200"; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
    echo ""
}

# Test Heroku AppServer
echo -e "${YELLOW}=== HEROKU APPSERVER TESTS ===${NC}"
test_endpoint "https://softlyplease-appserver.herokuapp.com/version" "200" "Heroku AppServer /version"

# Test Main Domain
echo -e "${YELLOW}=== MAIN DOMAIN TESTS ===${NC}"
test_endpoint "https://softlyplease.com/version" "200" "Main Domain /version"
test_endpoint "https://softlyplease.com/BranchNodeRnd.gh" "200" "Definition Access"
test_endpoint "https://softlyplease.com/?format=json" "200" "JSON API"

# Test Azure VM (if accessible)
echo -e "${YELLOW}=== AZURE VM TESTS ===${NC}"
if timeout 5 curl -s "http://4.248.252.92:6500/version" > /dev/null 2>&1; then
    test_endpoint "http://4.248.252.92:6500/version" "200" "Rhino Compute Service"
else
    echo -e "${RED}❌ Rhino Compute Service: NOT ACCESSIBLE${NC}"
fi

echo ""
echo -e "${GREEN}=== VERIFICATION COMPLETE ===${NC}"
echo "Check the results above. All endpoints should return SUCCESS."
