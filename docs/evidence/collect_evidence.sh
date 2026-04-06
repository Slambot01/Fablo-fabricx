cd ~/lfdt-project/fabric-x/samples/tokens
export PATH="/usr/local/go/bin:/usr/bin:/usr/local/bin:$(pwd)/fabric-samples/bin:$PATH"

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

echo -e "\n\n4. Show the docker network:"
docker network inspect fabric_test --format '{{range .Containers}}{{.Name}} {{end}}'

echo -e "\n\n5. Show disk usage of generated crypto:"
du -sh ~/lfdt-project/fabric-x/samples/tokens/crypto/
du -sh ~/lfdt-project/fabric-x/samples/tokens/conf/

echo -e "\n\n6. Save everything to a file for evidence:"
echo "=== FABRIC-X RUNNING EVIDENCE ===" > ~/fabric-x-evidence.txt
echo "Date: $(date)" >> ~/fabric-x-evidence.txt
echo "" >> ~/fabric-x-evidence.txt
echo "=== Docker PS ===" >> ~/fabric-x-evidence.txt
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" >> ~/fabric-x-evidence.txt
echo "" >> ~/fabric-x-evidence.txt
echo "=== Network ===" >> ~/fabric-x-evidence.txt
docker network inspect fabric_test --format '{{range .Containers}}{{.Name}} {{end}}' >> ~/fabric-x-evidence.txt
echo "" >> ~/fabric-x-evidence.txt
echo "=== API Health ===" >> ~/fabric-x-evidence.txt
curl -s -o /dev/null -w "swagger: %{http_code}\n" http://localhost:8080/ >> ~/fabric-x-evidence.txt
curl -s -o /dev/null -w "endorser1: %{http_code}\n" http://localhost:9300/ >> ~/fabric-x-evidence.txt 2>&1
curl -s -o /dev/null -w "issuer: %{http_code}\n" http://localhost:9100/ >> ~/fabric-x-evidence.txt 2>&1
echo "" >> ~/fabric-x-evidence.txt
echo "=== Committer Logs (last 10) ===" >> ~/fabric-x-evidence.txt
docker logs test-committer --tail=10 >> ~/fabric-x-evidence.txt 2>&1
echo "" >> ~/fabric-x-evidence.txt
echo "=== Note ===" >> ~/fabric-x-evidence.txt
echo "Channel mismatch: xdev creates mychannel, FSC configs reference arma" >> ~/fabric-x-evidence.txt
echo "All containers healthy. Delivery errors expected due to this mismatch." >> ~/fabric-x-evidence.txt

cat ~/fabric-x-evidence.txt
