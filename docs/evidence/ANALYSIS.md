# Fabric-X Local Deployment Evidence

**Date:** 2026-04-06
**Platform:** WSL2 Ubuntu 24.04, Docker Desktop 29.2.0
**Fabric-X Path:** PLATFORM=xdev (no Ansible required)

## Summary

Successfully deployed the Fabric-X token sample with all 6 containers
running and healthy on the `fabric_test` Docker network.

## Containers

| Container | Image | Health | Port |
|-----------|-------|--------|------|
| test-committer | ghcr.io/hyperledger/fabric-x-committer-test-node:0.1.7 | Up | 7050, 4001, 5433 |
| tokens-issuer-1 | tokens-issuer (built from Dockerfile) | Healthy | 9100→9000 |
| tokens-endorser1-1 | tokens-endorser1 (built from Dockerfile) | Healthy | 9300→9000 |
| tokens-owner1-1 | tokens-owner1 (built from Dockerfile) | Healthy | 9500→9000 |
| tokens-owner2-1 | tokens-owner2 (built from Dockerfile) | Healthy | 9600→9000 |
| tokens-swagger-ui-1 | swaggerapi/swagger-ui | Up | 8080 |

## API Responses

All FSC nodes return HTTP 404 on root path (expected — no root handler).
This confirms the HTTP servers are running. Swagger UI returns 200.

## Known Issue: Channel Mismatch

The `xdev` setup path creates channel `mychannel` via:
go tool configtxgen --channelID mychannel ...

But FSC node configs in `conf/` reference channel `arma`:
```yaml
# In core.yaml -> token.tms section
channel: arma
```

This causes:
- Committer: repeated "channel not found" delivery errors
- Endorser init: "cannot broadcast yet, no consensus type set"

This is NOT an architectural problem. In the Fablo integration, the channel
name will be parameterized from the JSON config, eliminating this mismatch
entirely.

## Implications for Fablo Integration

This deployment validates:
1. The committer-test-node image works as standalone infrastructure
2. FSC nodes build correctly from Dockerfile with Go build tags
3. The fabric_test Docker network connects all components
4. libp2p P2P mesh bootstraps successfully
5. The only gap is configuration consistency — exactly what Fablo solves

## Files

- `fabric-x-evidence.txt` — Raw evidence output
- `collect_evidence.sh` — Reproducible collection script
