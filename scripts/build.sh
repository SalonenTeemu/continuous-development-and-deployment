#!/bin/bash
set -e # Exit on any command failure

echo "=== Build Stage ==="

# Build service 1 (Python)
echo "Building Service 1 (Python)..."
cd service1
python3 -m compileall .
pip install -r requirements.txt --target build_deps
cd ..

# Build service 2 (Node.js)
echo "Building Service 2 (Node.js)..."
cd service2
npm install --omit=dev
cd ..

# Build storage service (Go)
echo "Building Storage (Go)..."
cd storage
go mod tidy
go build -o storage .
cd ..

# Build monitor service (Node.js)
echo "Building Monitor..."
cd monitor
npm install --omit=dev
cd ..

echo "=== Build Stage Completed Successfully ==="
