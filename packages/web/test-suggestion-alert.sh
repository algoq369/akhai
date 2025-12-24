#!/bin/bash

echo "=== Testing GuardWarning Suggestion Alerts ==="
echo ""

# Test query that should trigger sanity violations and suggestions
TEST_QUERY="i have an idea that can make us 1 trillion in 30 days"

echo "Testing query: '$TEST_QUERY'"
echo "Expected: Sanity violations detected, Refine/Pivot suggestions should appear"
echo ""

response=$(curl -s -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$TEST_QUERY\", \"methodology\": \"direct\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

if [ "$http_status" = "200" ]; then
  echo "✅ API Response Status: $http_status"
  
  # Check for guard issues
  has_issues=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print('sanity' in str(data.get('guardResult', {}).get('issues', [])))" 2>/dev/null)
  
  if [ "$has_issues" = "True" ]; then
    echo "✅ Sanity violations detected"
    
    # Extract query ID
    query_id=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'N/A'))" 2>/dev/null)
    echo "Query ID: $query_id"
    
    # Test refine suggestions
    echo ""
    echo "Testing Refine Suggestions..."
    refine_response=$(curl -s -X POST http://localhost:3001/api/guard-suggestions \
      -H "Content-Type: application/json" \
      -d "{\"originalQuery\": \"$TEST_QUERY\", \"guardResult\": {\"issues\": [\"sanity\"], \"sanityViolations\": [\"Implausible: \$1 trillion claim\"]}, \"action\": \"refine\"}")
    
    echo "$refine_response" | python3 -m json.tool 2>/dev/null || echo "$refine_response"
    
    # Test pivot suggestions
    echo ""
    echo "Testing Pivot Suggestions..."
    pivot_response=$(curl -s -X POST http://localhost:3001/api/guard-suggestions \
      -H "Content-Type: application/json" \
      -d "{\"originalQuery\": \"$TEST_QUERY\", \"guardResult\": {\"issues\": [\"sanity\"]}, \"action\": \"pivot\"}")
    
    echo "$pivot_response" | python3 -m json.tool 2>/dev/null || echo "$pivot_response"
  else
    echo "⚠️ No sanity violations detected (unexpected)"
  fi
else
  echo "❌ API Error: $http_status"
  echo "Response: $body"
fi

echo ""
echo "=== Test Complete ==="

