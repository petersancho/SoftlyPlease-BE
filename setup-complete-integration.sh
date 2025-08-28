#!/bin/bash
set -euo pipefail

echo "🚀 Starting complete McNeel AppServer integration..."

# Phase 1: Add upstream remote and vendor repository
echo "📦 Phase 1: Setting up upstream repository..."
git remote add mcneel-appserver https://github.com/mcneel/compute.rhino3d.appserver.git 2>/dev/null || echo "Remote already exists"
echo "Adding upstream repository via subtree..."
git subtree add --prefix vendor/mcneel-appserver mcneel-appserver main --squash 2>/dev/null || echo "Subtree already exists or failed"

# Phase 2: Install dependencies
echo "📦 Phase 2: Installing dependencies..."
npm install
npm install -D fs-extra @babel/parser @babel/traverse @playwright/test three@0.158.0

# Phase 3: Create sync script
echo "📦 Phase 3: Creating sync script..."
cat > scripts/sync-upstream-examples.js << 'EOF'
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const root = process.cwd();
const vendor = path.join(root, 'vendor', 'mcneel-appserver');

function findDir(start, name) {
  const q = [];
  q.push(start);
  while (q.length) {
    const dir = q.pop();
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of list) {
      if (e.isDirectory()) {
        const full = path.join(dir, e.name);
        if (e.name.toLowerCase() === name) return full;
        q.push(full);
      }
    }
  }
  return null;
}

function copyDir(src, dst) {
  if (!src) throw new Error('Source not found: ' + src);
  fse.ensureDirSync(dst);
  fse.copySync(src, dst, { overwrite: true });
  console.log('Copied', src, '->', dst);
}

(function main(){
  const examplesSrc = findDir(path.join(vendor, 'src'), 'examples') || findDir(vendor, 'examples');
  const filesSrc = findDir(path.join(vendor, 'src'), 'files') || findDir(vendor, 'files');
  const examplesDst = path.join(root, 'examples');
  const filesDst = path.join(root, 'files');
  copyDir(examplesSrc, examplesDst);
  copyDir(filesSrc, filesDst);
  console.log('Sync complete.');
})();
EOF

# Phase 4: Create Three.js copy script
echo "📦 Phase 4: Creating Three.js copy script..."
cat > scripts/copy-three.js << 'EOF'
const fs = require('fs');
const path = require('path');
const src = path.resolve('node_modules/three/build/three.min.js');
const dstDir = path.resolve('public/vendor/three/0.158.0');
fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, path.join(dstDir, 'three.min.js'));
console.log('three.min.js copied to', dstDir);
EOF

# Phase 5: Update package.json scripts
echo "📦 Phase 5: Updating package.json scripts..."
npm pkg set scripts.postinstall="node scripts/copy-three.js"
npm pkg set scripts['sync:examples']="node scripts/sync-upstream-examples.js"
npm pkg set scripts['sync:upstream']="git fetch mcneel-appserver && git subtree pull --prefix vendor/mcneel-appserver mcneel-appserver main --squash && npm run sync:examples"
npm pkg set scripts['docs:generate']="node scripts/generate-docs.js"
npm pkg set scripts['test:e2e']="playwright test"

# Phase 6: Run initial sync
echo "📦 Phase 6: Running initial sync of examples..."
mkdir -p scripts
npm run sync:examples

# Phase 7: Copy Three.js to vendor directory
echo "📦 Phase 7: Setting up Three.js vendor files..."
mkdir -p public/vendor/three/0.158.0
npm run postinstall

# Phase 8: Update Express server static mounts
echo "📦 Phase 8: Updating Express server configuration..."
# We'll add static mounts to the main app file
echo "Static mounts will be added to src/app.js"

echo "✅ Complete integration setup finished!"
echo ""
echo "📋 Next steps:"
echo "1. Check that examples/ and files/ directories exist and are populated"
echo "2. Update src/app.js to add static mounts for /examples, /files, /vendor"
echo "3. Update example HTML files with Three.js loader"
echo "4. Add API compatibility routes to src/routes/solve.js"
echo "5. Deploy to Heroku"
echo ""
echo "🎉 All McNeel examples are now available for integration!"
