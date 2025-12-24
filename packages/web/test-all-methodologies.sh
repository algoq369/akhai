#!/bin/bash

echo "=== Testing All 7 Methodologies ==="
echo ""

METHODOLOGIES=(
  "direct:What is 2+2?"
  "pot:Calculate 15*23"
  "cod:Explain AI step by step"
  "bot:Compare React vs Vue"
  "react:Search for news"
  "gtp:Should I learn Python?"
  "auto:100 divided by 5"
)

for test in "${METHODOLOGIES[@]}"; do
  IFS=':' read -r method query <<< "$test"
  echo "Testing $method: $query"
  
  response=$(curl -s -X POST http://localhost:3003/api/simple-query \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"methodology\": \"$method\"}" \
    -w "\nHTTP_STATUS:%{http_code}")
  
  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | grep -v "HTTP_STATUS")
  
  if [ "$http_status" = "200" ]; then
    echo "  ✅ Status: $http_status"
    methodology=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('methodologyUsed', 'N/A'))" 2>/dev/null)
    echo "  ✅ Methodology Used: $methodology"
  else
    echo "  ❌ Status: $http_status"
    echo "  ❌ Response: $body"
  fi
  echo ""
done

echo "=== Test Complete ==="

