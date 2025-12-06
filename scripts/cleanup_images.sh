#!/bin/sh
set -e

if [ -z "$HARBOR_REGISTRY" ]; then
  echo "Error: HARBOR_REGISTRY must be set"
  exit 1
fi

echo "Cleaning up local images…"

docker rmi "service1:${SERVICE1_TAG}" 2>/dev/null || true
docker rmi "service2:${SERVICE2_TAG}" 2>/dev/null || true
docker rmi "storage:${STORAGE_TAG}" 2>/dev/null || true
docker rmi "monitor:${MONITOR_TAG}" 2>/dev/null || true
docker rmi "api-gateway:${GATEWAY_TAG}" 2>/dev/null || true

echo "Cleaning up Harbor-tagged images…"

docker rmi "${HARBOR_REGISTRY}/service1:${SERVICE1_TAG}" 2>/dev/null || true
docker rmi "${HARBOR_REGISTRY}/service2:${SERVICE2_TAG}" 2>/dev/null || true
docker rmi "${HARBOR_REGISTRY}/storage:${STORAGE_TAG}" 2>/dev/null || true
docker rmi "${HARBOR_REGISTRY}/monitor:${MONITOR_TAG}" 2>/dev/null || true
docker rmi "${HARBOR_REGISTRY}/api-gateway:${GATEWAY_TAG}" 2>/dev/null || true

echo "Cleanup complete."
