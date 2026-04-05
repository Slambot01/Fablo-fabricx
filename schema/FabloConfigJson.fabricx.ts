/**
 * Proposed type extensions for Fabric-X support in Fablo.
 * These would be added to src/types/FabloConfigJson.ts
 *
 * Based on direct analysis of Fabric-X samples/tokens/:
 * - compose.yml: committer-test-node + FSC nodes
 * - conf/endorser1/core.yaml: FSC config (fsc.id, fsc.p2p, fabric.default.driver)
 * - conf/endorser1/routing-config.yaml: websocket P2P mesh routing
 * - crypto-config.yaml: SC-specific cert generation
 */

// ─────────────────────────────────────────────
// Extend GlobalJson
// ─────────────────────────────────────────────

interface GlobalJsonExtended {
  fabricVersion: string;
  engine?: "fabric" | "fabric-x";  // NEW: defaults to "fabric"
  tls: boolean;
  fabricXImages?: {
    // Only pre-built image available — others build from context
    committerTestNode: string;  // "ghcr.io/hyperledger/fabric-x-committer-test-node:0.1.7"
    toolsBaseImage: string;     // "registry.access.redhat.com/ubi9/ubi-minimal:9.6"
  };
}

// ─────────────────────────────────────────────
// Committer Test Node (Sidecar)
// Bundles: Orderer + Committer + DB + Query Service
// ─────────────────────────────────────────────

interface CommitterPortsJson {
  sidecar: number;       // 4001 — FSC nodes connect here for tx submission
  orderer: number;       // 7050 — ordering service
  queryService: number;  // 7001 — ledger queries
  database: number;      // 5433 — internal database
}

interface CommitterSidecarJson {
  channelId: string;         // SC_SIDECAR_ORDERER_CHANNEL_ID
  blockSize: number;         // SC_ORDERER_BLOCK_SIZE
  signedEnvelopes: boolean;  // SC_SIDECAR_ORDERER_SIGNED_ENVELOPES
  mspDir: string;            // SC_SIDECAR_ORDERER_IDENTITY_MSP_DIR
  mspId: string;             // SC_SIDECAR_ORDERER_IDENTITY_MSP_ID
}

interface CommitterLoggingJson {
  sidecar: string;      // SC_SIDECAR_LOGGING_LEVEL
  queryService: string; // SC_QUERY_SERVICE_LOGGING_LEVEL
  coordinator: string;  // SC_COORDINATOR_LOGGING_LEVEL
  orderer: string;      // SC_ORDERER_LOGGING_LEVEL
  vc: string;           // SC_VC_LOGGING_LEVEL
  verifier: string;     // SC_VERIFIER_LOGGING_LEVEL
}

interface CommitterJson {
  name: string;
  mode: "bundled";  // "bundled" = committer-test-node image
  ports: CommitterPortsJson;
  sidecar: CommitterSidecarJson;
  logging: CommitterLoggingJson;
}

// ─────────────────────────────────────────────
// FSC Node (Endorser / Issuer / Owner)
// NOT standard Fabric peers — Fabric Smart Client nodes
// Build from context using NODE_TYPE build arg (no pre-built image)
// ─────────────────────────────────────────────

interface FscPortsJson {
  api: number;  // External port mapping to container port 9000
  p2p: number;  // Websocket P2P port (must be unique per node)
}

interface FscConfigJson {
  id: string;                // fsc.id in core.yaml
  p2pListenAddress: string;  // fsc.p2p.listenAddress: /ip4/0.0.0.0/tcp/PORT
  driver: "fabricx";         // fabric.default.driver
}

interface FscDbJson {
  type: "sqlite";
  datasource: string;  // "file:./data/fts.sqlite"
}

interface FscNodeJson {
  name: string;
  nodeType: "endorser" | "issuer" | "owner";
  ports: FscPortsJson;
  fsc: FscConfigJson;
  db: FscDbJson;
}

// ─────────────────────────────────────────────
// Extend OrgJson
// ─────────────────────────────────────────────

interface OrgJsonExtended {
  organization: {
    name: string;
    domain: string;
    mspName: string;
  };
  ca?: CaJson;
  // Classic Fabric (mutually exclusive with Fabric-X fields):
  peers?: PeerJson[];
  orderers?: OrdererJson[];
  // Fabric-X (mutually exclusive with classic Fabric fields):
  committers?: CommitterJson[];
  endorsers?: FscNodeJson[];
}

// ─────────────────────────────────────────────
// Validation Rules (enforced in validate/index.ts)
// ─────────────────────────────────────────────

// 1. engine === "fabric-x" requires committers[] and endorsers[]
// 2. engine === "fabric-x" blocks peers[] and orderers[]
// 3. All FSC node P2P ports must be unique across the network
// 4. Each fsc.id must be unique across the network
// 5. crypto-config.yaml must include Hostname: SC for sidecar identity
// 6. Minimum 1 committer and 1 endorser required per org

export {
  GlobalJsonExtended,
  CommitterJson,
  CommitterPortsJson,
  CommitterSidecarJson,
  CommitterLoggingJson,
  FscNodeJson,
  FscPortsJson,
  FscConfigJson,
  FscDbJson,
  OrgJsonExtended,
};
