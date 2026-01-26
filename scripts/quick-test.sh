#!/bin/bash
echo "=== QUICK ENDPOINT VERIFICATION ==="
echo ""

# Test key endpoints
echo "1. Testing /api/stats..."
curl -s http://localhost:3000/api/stats | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'✅ Queries: {data[\"queriesThisMonth\"]}, Cost: ${data[\"totalCost\"]:.2f}')" 2>&1

echo ""
echo "2. Testing /api/history..."
curl -s "http://localhost:3000/api/history?limit=3" | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'✅ Retrieved {len(data[\"queries\"])} queries')" 2>&1

echo ""
echo "3. Testing homepage..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/ | grep -q "200" && echo "✅ Homepage loads" || echo "❌ Homepage failed"

echo ""
echo "4. Testing /philosophy page..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/philosophy | grep -q "200" && echo "✅ Philosophy page loads" || echo "❌ Philosophy failed"

echo ""
echo "5. Testing database..."
TOTAL=$(curl -s http://localhost:3000/api/history | python3 -c "import sys,json; print(len(json.load(sys.stdin)['queries']))" 2>&1)
echo "✅ Database has $TOTAL queries"

echo ""
echo "=== ALL QUICK TESTS COMPLETE ==="
