#!/bin/bash

# Commercial Truck Dealership Market - Investor Dashboard Setup Script
# This script sets up the development environment and starts the dashboard

echo "🚛 Commercial Truck Dealership Market - Investor Dashboard Setup"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if pnpm is installed, if not install it
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project to verify everything works
echo "🔨 Building project to verify setup..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful"

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "📊 Dashboard will be available at: http://localhost:5173"
echo "🔧 Press Ctrl+C to stop the server"
echo ""

pnpm run dev --host

echo "👋 Thanks for using the Commercial Truck Dealership Market Dashboard!"

