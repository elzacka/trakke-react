#!/bin/bash

# Tråkke Development Server - Robust Startup Script
# This script ensures reliable server startup with proper error handling

echo "🚀 Starting Tråkke development server..."

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to clean up processes
cleanup() {
    echo "🧹 Cleaning up any existing processes..."
    pkill -f "vite" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 2
}

# Check Node.js and npm versions
echo "📋 Checking Node.js environment..."
node_version=$(node --version)
npm_version=$(npm --version)
echo "Node.js: $node_version"
echo "npm: $npm_version"

# Clean up any existing processes
cleanup

# Check ports
check_port 3000
check_port 3001

# Clear Vite cache if startup fails previously
if [ -d "node_modules/.vite" ]; then
    echo "🗑️  Clearing Vite cache..."
    rm -rf node_modules/.vite
fi

# Start the development server
echo "🎯 Starting Vite development server..."
echo "📍 URL: http://localhost:3000"
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start with error handling
if npm run dev; then
    echo "✅ Server started successfully"
else
    echo "❌ Server failed to start"
    echo "🔧 Try running: npm install && ./dev-server.sh"
    exit 1
fi