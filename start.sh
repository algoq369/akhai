#!/bin/bash

# AkhAI Environment Setup & Launch Script
# Run this to start your development environment

echo "◊ AKHAI - Environment Setup"
echo "==========================="
echo ""

# Check Node.js
echo "Checking Node.js..."
node --version || { echo "❌ Node.js not found. Please install Node.js 20+"; exit 1; }
echo "✅ Node.js installed"
echo ""

# Check pnpm
echo "Checking pnpm..."
pnpm --version || { echo "❌ pnpm not found. Installing..."; npm install -g pnpm; }
echo "✅ pnpm installed"
echo ""

# Navigate to web package
cd /Users/sheirraza/akhai/packages/web

# Check .env.local
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
else
    echo "❌ .env.local missing. Creating from example..."
    cp .env.example .env.local
    echo "⚠️  Please add your ANTHROPIC_API_KEY to .env.local"
fi
echo ""

# Install dependencies
echo "Installing dependencies..."
pnpm install
echo ""

# Start development server
echo "Starting AkhAI development server..."
echo "Server will be available at http://localhost:3004"
echo ""
pnpm dev
