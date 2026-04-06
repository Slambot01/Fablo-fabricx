import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT_DIR, 'schema', 'fablo-config-fabricx.json');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const OUTPUT_DIR = path.join(ROOT_DIR, 'generated-output');

function readJsonFile(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

interface FscNodeEntry {
  name: string;
  domain: string;
  ports: { p2p: number; api?: number };
  excludeFromResolvers?: boolean;
  [key: string]: unknown;
}

function generate() {
  console.log('Starting Fabric-X configuration generation...');
  
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const config = readJsonFile(SCHEMA_PATH);
  
  const dockerComposeTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'docker-compose-fabricx.ejs'), 'utf8');
  const coreYamlTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'fsc-core-yaml.ejs'), 'utf8');
  const routingConfigTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'routing-config.ejs'), 'utf8');

  // Generate Docker Compose
  let dockerComposeContent = ejs.render(dockerComposeTemplate, config);
  dockerComposeContent = dockerComposeContent.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'docker-compose.yml'), dockerComposeContent);
  console.log(' ✓ Generated docker-compose.yml');

  const channelName = config.channels[0].name;

  // Process all FSC nodes
  let allFscNodes: FscNodeEntry[] = [];
  for (const org of config.orgs) {
    if (org.endorsers) {
      for (const end of org.endorsers) {
         allFscNodes.push({ ...end, domain: org.organization.domain });
      }
    }
    if (org.fscNodes) {
      allFscNodes = allFscNodes.concat(org.fscNodes);
    }
  }

  // Sort order must match generated/ reference for verification.
  // In production Fablo, ordering derives from schema declaration order.
  const exactOrder = ['issuer', 'auditor', 'endorser1', 'endorser2', 'owner1', 'owner2'];
  allFscNodes.sort((a, b) => {
    let ia = exactOrder.indexOf(a.name);
    let ib = exactOrder.indexOf(b.name);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    return ia - ib;
  });

  // Find committer
  let committer: Record<string, unknown> | null = null;
  for (const org of config.orgs) {
    if (org.committers && org.committers.length > 0) {
      committer = org.committers[0];
      break;
    }
  }

  for (const org of config.orgs) {
    if (!org.endorsers) continue;

    for (const endorser of org.endorsers) {
      const nodeDir = path.join(OUTPUT_DIR, 'conf', endorser.name);
      fs.mkdirSync(nodeDir, { recursive: true });

      const nodeContext = {
        node: { ...endorser, org: org.organization },
        allFscNodes,
        committer,
        channelName
      };

      const coreYamlContent = ejs.render(coreYamlTemplate, nodeContext);
      fs.writeFileSync(path.join(nodeDir, 'core.yaml'), coreYamlContent);
      console.log(` ✓ Generated conf/${endorser.name}/core.yaml`);

      const routingConfigContent = ejs.render(routingConfigTemplate, nodeContext);
      fs.writeFileSync(path.join(nodeDir, 'routing-config.yaml'), routingConfigContent);
      console.log(` ✓ Generated conf/${endorser.name}/routing-config.yaml`);
    }
  }

  console.log('Generation completed successfully!');
}

try {
  generate();
} catch (error) {
  console.error('Error generating configuration:', error);
  process.exit(1);
}
