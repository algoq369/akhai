#!/bin/bash

echo "🚀 Starting AkhAI with Cloudflare Tunnel..."
echo ""
echo "This will:"
echo "  1. Start your Next.js dev server (localhost:3001)"
echo "  2. Create a public HTTPS tunnel"
echo "  3. Enable real crypto payments from anywhere"
echo ""

# Start the tunnel in the background
cloudflared tunnel --url http://localhost:3001 &
TUNNEL_PID=$!

echo ""
echo "⏳ Waiting for tunnel to start..."
sleep 5

echo ""
echo "✅ Tunnel is running!"
echo ""
echo "📝 IMPORTANT: Copy the tunnel URL above (https://xxx.trycloudflare.com)"
echo "   Then update packages/web/.env.local:"
echo "   NEXT_PUBLIC_APP_URL=https://your-tunnel-url.trycloudflare.com"
echo ""
echo "Press Ctrl+C to stop the tunnel"

# Wait for Ctrl+C
trap "kill $TUNNEL_PID 2>/dev/null" EXIT
wait $TUNNEL_PID
