#!/bin/bash
# AkhAI Development Server Launcher
# Ensures port 3000 is always used for consistency

echo "🚀 AkhAI Development Server"
echo "=================================="
echo ""

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use"
    echo ""
    read -p "Kill existing process and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔪 Killing process on port 3000..."
        kill $(lsof -t -i:3000)
        sleep 1
    else
        echo "❌ Cancelled. Please free port 3000 manually."
        exit 1
    fi
fi

echo "✅ Port 3000 is available"
echo "🔧 Starting Next.js development server..."
echo ""

# Start dev server on port 3000
pnpm dev

# This keeps the script running
wait
