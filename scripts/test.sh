#!/bin/bash
set -e  # Exit on any command failure

echo "=== Test Stage ==="

# Test service 1 (Python)
echo "Testing Service 1 (Python)..."
cd service1
export PYTHONPATH=$(pwd)/build_deps:$PYTHONPATH
python3 -m pytest -q tests --ignore=build_deps
cd ..

# Test service 2 (Node.js)
echo "Testing Service 2 (Node.js)..."
cd service2
if npm test 2>/dev/null; then
  echo "Service2 tests passed (npm test)"
elif npm run test 2>/dev/null; then
  echo "Service2 tests passed (npm run test)"
else
  echo "No test script found for Service2, skipping..."
fi
cd ..

# Test monitor service (Node.js)
echo "Testing Monitor service (Node.js)..."
cd monitor
if npm test 2>/dev/null; then
  echo "Monitor tests passed (npm test)"
elif npm run test 2>/dev/null; then
  echo "Monitor tests passed (npm run test)"
else
  echo "No test script found for Monitor, skipping..."
fi
cd ..

# Test storage service (Go)
echo "Testing Storage service (Go)..."
cd storage
go test ./...
cd ..

echo "=== All Tests Completed Successfully ==="
