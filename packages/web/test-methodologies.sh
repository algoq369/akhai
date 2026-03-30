#!/bin/bash

# Test all 7 methodologies
# Each test sends a query and checks if the methodology is correctly applied

BASE_URL="http://localhost:3003"
API_ENDPOINT="$BASE_URL/api/simple-query"

echo "🧪 Testing AkhAI Methodology Execution"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test a methodology
test_methodology() {
    local TEST_NAME="$1"
    local METHODOLOGY="$2"
    local QUERY="$3"
    local EXPECTED_METHOD="$4"

    echo "📋 Test: $TEST_NAME"
    echo "   Methodology: $METHODOLOGY"
    echo "   Query: \"$QUERY\""

    # Send request
    RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$QUERY\", \"methodology\": \"$METHODOLOGY\"}")

    # Extract methodology used
    METHODOLOGY_USED=$(echo "$RESPONSE" | jq -r '.methodologyUsed // .methodology')

    # Check if response contains expected format indicators
    RESPONSE_TEXT=$(echo "$RESPONSE" | jq -r '.response')

    if [ "$METHODOLOGY_USED" = "$EXPECTED_METHOD" ]; then
        echo -e "   ${GREEN}✓ Methodology: $METHODOLOGY_USED${NC}"
        echo "   Response preview: ${RESPONSE_TEXT:0:100}..."
        echo ""
        ((TESTS_PASSED++))
    else
        echo -e "   ${RED}✗ Expected: $EXPECTED_METHOD, Got: $METHODOLOGY_USED${NC}"
        echo ""
        ((TESTS_FAILED++))
    fi
}

echo "1️⃣  Testing DIRECT methodology"
echo "────────────────────────────────"
test_methodology \
    "Direct - Simple factual query" \
    "direct" \
    "What is Bitcoin?" \
    "direct"

echo ""
echo "2️⃣  Testing COD (Chain of Draft) methodology"
echo "────────────────────────────────────────────"
test_methodology \
    "CoD - Step-by-step explanation" \
    "cod" \
    "Explain how to build a web application step by step" \
    "cod"

echo ""
echo "3️⃣  Testing BOT (Buffer of Thoughts) methodology"
echo "───────────────────────────────────────────────"
test_methodology \
    "BoT - Complex context query" \
    "bot" \
    "Given that I have a budget of 10000 dollars and need to launch in 3 months with these constraints: must use TypeScript, must be scalable, and must have real-time features. What architecture should I use?" \
    "bot"

echo ""
echo "4️⃣  Testing REACT methodology"
echo "──────────────────────────────"
test_methodology \
    "ReAct - Search/research query" \
    "react" \
    "Search for the latest trends in AI research for 2025" \
    "react"

echo ""
echo "5️⃣  Testing POT (Program of Thought) methodology"
echo "────────────────────────────────────────────────"
test_methodology \
    "PoT - Math computation" \
    "pot" \
    "Calculate the compound interest on 10000 dollars at 5% annual rate for 10 years" \
    "pot"

echo ""
echo "6️⃣  Testing TOT (Tree of Thoughts) methodology"
echo "──────────────────────────────────────────────────────"
test_methodology \
    "TOT - Tree of Thoughts analysis" \
    "tot" \
    "Analyze blockchain technology from multiple perspectives and reach a consensus on its future" \
    "tot"

echo ""
echo "7️⃣  Testing AUTO methodology selection"
echo "───────────────────────────────────────"

echo "📋 Test: Auto → Direct (simple query)"
echo "   Query: \"what is 2+2\""
test_methodology \
    "Auto → PoT (math query)" \
    "auto" \
    "what is 2+2" \
    "pot"

echo "📋 Test: Auto → CoD (step-by-step)"
test_methodology \
    "Auto → CoD" \
    "auto" \
    "explain how photosynthesis works step by step" \
    "cod"

echo "📋 Test: Auto → BoT (complex context)"
test_methodology \
    "Auto → BoT" \
    "auto" \
    "Given that Bitcoin uses PoW and requires that all transactions must be validated by miners, assuming network congestion, what is the expected confirmation time?" \
    "bot"

echo ""
echo "========================================"
echo "🎯 Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All methodology tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check output above.${NC}"
    exit 1
fi
