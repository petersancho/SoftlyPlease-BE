const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const root = process.cwd();
const vendor = path.join(root, 'vendor', 'mcneel-appserver');

function findDir(start, name) {
  const q=[start];
  while (q.length) {
    const dir = q.pop();
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of list) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.toLowerCase()===name) return full;
        q.push(full);
      }
    }
  }
  return null;
}

function copyDir(src, dst) {
  fse.ensureDirSync(dst);
  fse.copySync(src, dst, { overwrite: true });
}

(function main(){
  const examplesSrc = findDir(path.join(vendor,'src'), 'examples') || findDir(vendor, 'examples');
  const filesSrc = findDir(path.join(vendor,'src'), 'files') || findDir(vendor, 'files');
  if (!examplesSrc || !filesSrc) {
    console.error('Upstream examples/files not found');
    process.exit(1);
  }
  copyDir(examplesSrc, path.join(root, 'examples'));
  copyDir(filesSrc, path.join(root, 'files'));
  console.log('Synced examples and files.');
})();
