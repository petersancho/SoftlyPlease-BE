const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const root = process.cwd();

// Define paths
const vendorDir = path.join(root, 'vendor', 'mcneel-appserver');
const examplesSrc = findDir(path.join(vendorDir, 'src'), 'examples') || findDir(vendorDir, 'examples');
const filesSrc = findDir(path.join(vendorDir, 'src'), 'files') || findDir(vendorDir, 'files');

function findDir(start, name) {
  const q = [start];
  while (q.length) {
    const dir = q.pop();
    if (!fs.existsSync(dir)) continue;

    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of list) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.toLowerCase() === name.toLowerCase()) return full;
        q.push(full);
      }
    }
  }
  return null;
}

function copyDir(src, dst) {
  if (!src || !fs.existsSync(src)) {
    console.log(`Source directory not found: ${src}`);
    return;
  }

  fse.ensureDirSync(dst);
  fse.copySync(src, dst, {
    overwrite: true,
    filter: (src, dest) => {
      // Skip node_modules and other unwanted directories
      const basename = path.basename(src);
      return !['node_modules', '.git', 'vendor'].includes(basename);
    }
  });
  console.log(`Copied ${src} -> ${dst}`);
}

(function main() {
  if (!examplesSrc || !filesSrc) {
    console.error('❌ Upstream examples/files not found in vendor directory');
    console.log('Expected vendor structure: vendor/mcneel-appserver/src/examples and vendor/mcneel-appserver/src/files');
    process.exit(1);
  }

  console.log('🔍 Found upstream directories:');
  console.log(`  Examples: ${examplesSrc}`);
  console.log(`  Files: ${filesSrc}`);

  // Copy to runtime directories
  const examplesDst = path.join(root, 'src', 'examples');
  const filesDst = path.join(root, 'src', 'files');

  copyDir(examplesSrc, examplesDst);
  copyDir(filesSrc, filesDst);

  console.log('✅ Synced examples and files from upstream.');
  console.log('💡 Run "npm run patch-examples" to update HTML files with new Three.js loading system');
})();
