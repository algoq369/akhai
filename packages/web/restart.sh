#!/bin/bash
echo "🛑 Stopping server..."
pkill -f "next dev"
sleep 2
echo "🚀 Starting server..."
cd /Users/sheirraza/akhai/packages/web
PORT=3004 pnpm dev > /tmp/akhai-dev.log 2>&1 &
echo "✅ Server started! View logs with: tail -f /tmp/akhai-dev.log"
sleep 3
tail -20 /tmp/akhai-dev.log
