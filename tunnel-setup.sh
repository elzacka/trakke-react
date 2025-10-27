#!/bin/bash
# Quick tunnel setup for remote mobile testing

echo "🚀 Setting up tunnel for mobile testing..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."

    # Detect OS and install
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflare/cloudflare/cloudflared
    else
        echo "❌ Unsupported OS. Please install cloudflared manually."
        exit 1
    fi
fi

echo "✅ Cloudflared installed"
echo ""
echo "🌐 Starting tunnel to localhost:3000..."
echo "📱 Open the URL below on your iPhone Safari:"
echo ""

# Start the tunnel
cloudflared tunnel --url http://localhost:3000
