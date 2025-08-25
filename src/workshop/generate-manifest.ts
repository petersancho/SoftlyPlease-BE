import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface DefinitionManifest {
  id: string;
  title: string;
  version: string;
  inputs: Array<{
    name: string;
    type: string;
    default?: any;
    min?: number;
    max?: number;
  }>;
  storageUri: string;
}

const GH_DEFS_DIR = path.join(__dirname, '../../gh-defs');
const MANIFEST_PATH = path.join(__dirname, '../../gh-manifest.json');

// Copy existing definitions to gh-defs directory
function copyExistingDefinitions() {
  const srcDir = path.join(__dirname, '../files');
  const destDir = GH_DEFS_DIR;

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy .gh files from src/files to gh-defs
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.gh'));
  files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`📋 Copied ${file} to gh-defs`);
  });
}

// Generate stable ID from file content and name
function generateDefinitionId(filePath: string): string {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath, '.gh');

  // Create hash from file content and name for stable ID
  const hash = crypto.createHash('sha256');
  hash.update(fileContent);
  hash.update(fileName);

  return hash.digest('hex').substring(0, 16);
}

// Extract definition metadata (simplified for now - in production you'd introspect the GH file)
function extractDefinitionMetadata(filePath: string): Omit<DefinitionManifest, 'id' | 'storageUri'> {
  const fileName = path.basename(filePath, '.gh');

  // Map common definitions to their parameters
  const definitionMap: Record<string, Omit<DefinitionManifest, 'id' | 'storageUri'>> = {
    'TopoOpt': {
      title: 'Topology Optimization',
      version: '1.0',
      inputs: [
        { name: 'height', type: 'number', default: 500, min: 100, max: 2000 },
        { name: 'width', type: 'number', default: 1000, min: 100, max: 2000 },
        { name: 'num', type: 'number', default: 3, min: 1, max: 10 }
      ]
    },
    'beam_mod': {
      title: 'Beam Modifier',
      version: '1.0',
      inputs: [
        { name: 'length', type: 'number', default: 1000, min: 100, max: 5000 },
        { name: 'width', type: 'number', default: 50, min: 10, max: 200 },
        { name: 'height', type: 'number', default: 100, min: 20, max: 500 }
      ]
    },
    'delaunay': {
      title: 'Delaunay Triangulation',
      version: '1.0',
      inputs: [
        { name: 'points', type: 'number', default: 50, min: 3, max: 1000 },
        { name: 'radius', type: 'number', default: 100, min: 10, max: 1000 }
      ]
    },
    'brep_union': {
      title: 'BREP Union',
      version: '1.0',
      inputs: [
        { name: 'size1', type: 'number', default: 100, min: 10, max: 500 },
        { name: 'size2', type: 'number', default: 80, min: 10, max: 500 },
        { name: 'offset', type: 'number', default: 20, min: 0, max: 100 }
      ]
    }
  };

  return definitionMap[fileName] || {
    title: fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    version: '1.0',
    inputs: [
      { name: 'param1', type: 'number', default: 100, min: 0, max: 1000 }
    ]
  };
}

// Generate manifest
function generateManifest() {
  console.log('🚀 Generating Grasshopper definition manifest...');

  // Copy existing definitions if not already done
  if (fs.readdirSync(GH_DEFS_DIR).length === 0) {
    copyExistingDefinitions();
  }

  const files = fs.readdirSync(GH_DEFS_DIR).filter(f => f.endsWith('.gh'));
  const manifest: DefinitionManifest[] = [];

  files.forEach(file => {
    const filePath = path.join(GH_DEFS_DIR, file);
    const id = generateDefinitionId(filePath);
    const metadata = extractDefinitionMetadata(filePath);

    const definition: DefinitionManifest = {
      id,
      ...metadata,
      storageUri: `file://${filePath}` // In production, this would be a pre-signed URL
    };

    manifest.push(definition);
    console.log(`📋 Added definition: ${definition.title} (${id})`);
  });

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`💾 Manifest saved to ${MANIFEST_PATH}`);
  console.log(`📊 Generated manifest with ${manifest.length} definitions`);
}

// Run if called directly
if (require.main === module) {
  generateManifest();
}

export { generateManifest, DefinitionManifest };
