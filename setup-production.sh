#!/bin/bash

echo "🚀 Setting up Rhino Compute AppServer for Production"
echo "================================================="

# Check if .env file exists and has been configured
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create it first."
    exit 1
fi

# Check if .env has been configured (not default values)
if grep -q "your-azure-vm-ip" .env || grep -q "your-api-key-here" .env; then
    echo "⚠️  Please configure your .env file with actual Azure VM details:"
    echo "   - RHINO_COMPUTE_URL=http://your-azure-vm-ip:6500/"
    echo "   - RHINO_COMPUTE_KEY=your-actual-api-key"
    echo ""
    echo "Current .env content:"
    cat .env
    exit 1
fi

echo "✅ .env file looks configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test configuration
echo "🧪 Testing configuration..."
node -e "require('dotenv').config(); console.log('RHINO_COMPUTE_URL:', process.env.RHINO_COMPUTE_URL); console.log('RHINO_COMPUTE_KEY:', process.env.RHINO_COMPUTE_KEY ? 'Set' : 'Not set');"

echo ""
echo "🎯 Configuration complete!"
echo "To start in production mode:"
echo "  npm run start:prod"
echo ""
echo "To check status:"
echo "  npm run status"
echo ""
echo "To view logs:"
echo "  npm run logs"
echo ""
echo "To stop:"
echo "  npm run stop:prod"
