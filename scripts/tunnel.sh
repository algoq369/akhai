#!/bin/bash
# AkhAI ngrok Tunnel Script
# Keeps tunnel running persistently

# Kill existing ngrok processes
pkill -f ngrok 2>/dev/null

# Start ngrok in background (port 3003 for AkhAI)
nohup ngrok http 3003 > /dev/null 2>&1 &

# Wait for ngrok to start
sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo "ngrok tunnel active: $NGROK_URL"
    echo "Dashboard: http://localhost:4040"
else
    echo "Failed to start ngrok. Check if ngrok is installed."
    echo "Install: brew install ngrok"
fi
