#!/bin/bash

echo "==============================================="
echo "Elderly Care Menu Generator - Setup Script"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys!"
else
    echo "✓ .env file already exists"
fi

echo "Installing backend dependencies..."
npm install

echo "✓ Backend setup complete"
echo ""

# Frontend Setup
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f .env.local ]; then
    echo "Creating .env.local file from example..."
    cp .env.local.example .env.local
else
    echo "✓ .env.local file already exists"
fi

echo "Installing frontend dependencies..."
npm install

echo "✓ Frontend setup complete"
echo ""

# Final Instructions
echo "==============================================="
echo "✅ Setup Complete!"
echo "==============================================="
echo ""
echo "IMPORTANT: Edit the following files with your API keys:"
echo "  1. backend/.env"
echo "     - Add your ANTHROPIC_API_KEY"
echo "     - Add your OPENAI_API_KEY"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "==============================================="
