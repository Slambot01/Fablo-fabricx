#!/bin/bash
# Evidence collection script for Fabric-X token sample deployment
# Usage: Run from the fabric-x/samples/tokens/ directory
set -e

echo "1. Full docker ps:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n2. Try endorser init:"
curl -s -X POST http://localhost:9300/endorser/init || echo "endorser init failed (expected due to channel mismatch)"

echo -e "\n3. Check all API endpoints are responding:"
curl -s -o /dev/null -w "issuer API: %{http_code}\n" http://localhost:9100/ || echo "issuer not responding"
curl -s -o /dev/null -w "endorser1 API: %{http_code}\n" http://localhost:9300/ || echo "endorser1 not responding"
curl -s -o /dev/null -w "owner1 API: %{http_code}\n" http://localhost:9500/ || echo "owner1 not responding"
curl -s -o /dev/null -w "owner2 API: %{http_code}\n" http://localhost:9600/ || echo "owner2 not responding"
curl -s -o /dev/null -w "swagger: %{http_code}\n" http://localhost:8080/

echo -e "\n4. Show the docker network:"
docker network inspect fabric_test --format '{{range .Containers}}{{.Name}} {{end}}'

echo -e "\n5. Show disk usage of generated crypto:"
du -sh crypto/ 2>/dev/null || echo "No crypto/ directory found"
du -sh conf/ 2>/dev/null || echo "No conf/ directory found"

echo -e "\n6. Save everything to evidence file:"
EVIDENCE_FILE="./fabric-x-evidence.txt"
echo "=== FABRIC-X RUNNING EVIDENCE ===" > "$EVIDENCE_FILE"
echo "Date: $(date)" >> "$EVIDENCE_FILE"
echo "" >> "$EVIDENCE_FILE"
echo "=== Docker PS ===" >> "$EVIDENCE_FILE"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" >> "$EVIDENCE_FILE"
echo "" >> "$EVIDENCE_FILE"
echo "=== Network ===" >> "$EVIDENCE_FILE"
docker network inspect fabric_test --format '{{range .Containers}}{{.Name}} {{end}}' >> "$EVIDENCE_FILE"
echo "" >> "$EVIDENCE_FILE"
echo "=== API Health ===" >> "$EVIDENCE_FILE"
curl -s -o /dev/null -w "swagger: %{http_code}\n" http://localhost:8080/ >> "$EVIDENCE_FILE"
curl -s -o /dev/null -w "endorser1: %{http_code}\n" http://localhost:9300/ >> "$EVIDENCE_FILE" 2>&1
curl -s -o /dev/null -w "issuer: %{http_code}\n" http://localhost:9100/ >> "$EVIDENCE_FILE" 2>&1
echo "" >> "$EVIDENCE_FILE"
echo "=== Committer Logs (last 10) ===" >> "$EVIDENCE_FILE"
docker logs test-committer --tail=10 >> "$EVIDENCE_FILE" 2>&1
cat "$EVIDENCE_FILE"
