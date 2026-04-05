# Fablo + Fabric-X Integration — Proof of Concept

**Author:** Ritesh Pandit [@Slambot01](https://github.com/Slambot01)
**Mentorship Issue:** [LF-Decentralized-Trust-Mentorships #83](https://github.com/LF-Decentralized-Trust-Mentorships/mentorship-program/issues/83)
**Fablo Issue:** [hyperledger-labs/fablo #611](https://github.com/hyperledger-labs/fablo/issues/611)

## What This Is

This POC demonstrates how Fablo's generation pipeline can be extended to support
Fabric-X's decomposed FSC (Fabric Smart Client) architecture. It is based on
direct analysis of the Fabric-X source repo — not documentation.

## The Core Problem

Fablo currently generates infrastructure for monolithic Fabric components.
Fabric-X is NOT a simple image swap — it introduces a completely different
node model called Fabric Smart Client (FSC).

Classic Fabric:
  [Orderer]     [Peer: Endorser + Validator + Committer]

Fabric-X:
  [Committer Test Node: Orderer + Committer + DB + Query Service]
       ports: 7050 (orderer), 4001 (sidecar), 7001 (query), 5433 (db)
       image: ghcr.io/hyperledger/fabric-x-committer-test-node:0.1.7
       env:   SC_SIDECAR_*, SC_ORDERER_*, SC_QUERY_SERVICE_*

  Connected via websocket P2P mesh to FSC nodes:

  [Endorser1 FSC]   [Issuer FSC]   [Owner1 FSC]
   api:9300          api:9100       api:9500
   p2p:9301          p2p:9101       p2p:9501
   core.yaml         core.yaml      core.yaml
   routing-config    routing-config routing-config

  All FSC nodes: build from context (no pre-built image)
  Config:        fsc.id, fsc.p2p.listenAddress (NOT CORE_PEER_*)
  Driver:        fabric.default.driver: fabricx
  Persistence:   SQLite (file:./data/fts.sqlite)
  P2P:           websocket (NOT gRPC gossip)

## What Fablo Must Generate

1. FSC-style core.yaml per node (completely different from standard Fabric core.yaml)
2. routing-config.yaml per node (defines websocket P2P mesh topology)
3. SC-specific crypto material (Hostname: SC entries in crypto-config.yaml)
4. committer-test-node with SC_SIDECAR_* environment variables
5. Build-from-context endorser services (no registry image available)
6. Custom tools: configtxgen, cryptogen, fxconfig built from Fabric-X Dockerfile

## Repository Structure

| Path | Contents |
|------|----------|
| `docs/architecture-mapping.md` | Classic Fabric vs Fabric-X — every concept mapped |
| `docs/fablo-codebase-changes.md` | Every file in Fablo that needs modification |
| `docs/integration-phases.md` | Phased 12-week implementation plan |
| `schema/fablo-config-fabricx.json` | Proposed user-facing config schema |
| `schema/FabloConfigJson.fabricx.ts` | TypeScript type extensions |
| `generated/docker-compose.yml` | What Fablo would output for a 2-endorser network |
| `generated/conf/endorser1/core.yaml` | FSC core.yaml (based on actual Fabric-X source) |
| `generated/conf/endorser1/routing-config.yaml` | P2P mesh routing |
| `generated/conf/endorser2/core.yaml` | FSC core.yaml for endorser2 |
| `generated/conf/endorser2/routing-config.yaml` | P2P mesh routing |
| `templates/docker-compose-fabricx.ejs` | EJS template for compose generation |
| `templates/fsc-core-yaml.ejs` | EJS template for FSC core.yaml generation |
| `templates/routing-config.ejs` | EJS template for routing config generation |

## Key Findings From Source Analysis

1. **No pre-built endorser image** — unlike `hyperledger/fabric-peer`, Fabric-X
   endorser/issuer/owner nodes build from the same Dockerfile context using
   `NODE_TYPE` build arg. Fablo must handle build-from-context.

2. **FSC core.yaml is unrelated to Fabric core.yaml** — it uses `fsc.id`,
   `fsc.p2p.listenAddress`, `fsc.persistences`, and `fsc.endpoint.resolvers`
   with certificate paths. Standard CORE_PEER_* vars do not apply.

3. **routing-config.yaml drives the mesh** — every FSC node needs one, listing
   all other nodes by logical name mapped to host:port websocket addresses.

4. **SC-specific crypto required** — crypto-config.yaml must include
   `Hostname: SC` entries to generate sidecar identity certificates.

5. **Custom tool chain** — Fabric-X builds its own configtxgen, cryptogen,
   fxconfig, and idemixgen from source. These are not the standard
   hyperledger/fabric-tools binaries.

6. **Token layer is optional** — the samples include a full token management
   system (zkatdlog driver, idemixgen, public parameters JSON) but this is
   application-level, not required for basic network operation.

## Related Work

- BFT validation PR: https://github.com/hyperledger-labs/fablo/pull/668
- Fablo issue #611: https://github.com/hyperledger-labs/fablo/issues/611
- Mentorship issue #83: https://github.com/LF-Decentralized-Trust-Mentorships/mentorship-program/issues/83
