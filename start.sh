#!/bin/bash

# Kill existing processes on common ports
echo "Stopping existing servers..."
lsof -ti:3456 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 1

echo "Starting cc-manager..."
echo "Server: http://localhost:3456"
echo "Web: http://localhost:5173"

# Start dev server
pnpm dev
