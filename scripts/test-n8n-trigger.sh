#!/usr/bin/env bash
# Test analyze API with n8n trigger (test mode).
# Usage: ./scripts/test-n8n-trigger.sh [path-to-file]
# Example: ./scripts/test-n8n-trigger.sh demo-data/csv/critical_waste.csv
set -e
FILE="${1:-demo-data/csv/critical_waste.csv}"
if [ ! -f "$FILE" ]; then
  echo "Run: npm run seed"
  echo "Then: ./scripts/test-n8n-trigger.sh demo-data/csv/critical_waste.csv"
  exit 1
fi
curl -s -X POST http://localhost:3000/api/analyze \
  -F "files=@$FILE" \
  -F "envMode=test" \
  -F "allowTrigger=true" | jq .
