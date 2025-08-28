const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');

const FILES_DIR = process.env.FILES_DIR || path.join(process.cwd(), 'files');

function listDefinitions() {
  const out = [];
  const walk = (dir, base='') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else if (/\.(gh|ghx)$/i.test(entry.name)) out.push(rel.replace(/\\/g,'/'));
    }
  };
  if (fs.existsSync(FILES_DIR)) walk(FILES_DIR);
  return out.sort();
}

function resolveDefinition(nameRaw) {
  if (!nameRaw || typeof nameRaw !== 'string') return null;
  const name = nameRaw.replace(/\\/g,'/').replace(/^\/+/, '');
  if (name.includes('..')) return null;

  const hasExt = /\.(gh|ghx)$/i.test(name);
  const tryPaths = [];

  if (name.includes('/')) {
    if (hasExt) tryPaths.push(path.join(FILES_DIR, name));
    else { tryPaths.push(path.join(FILES_DIR, name + '.gh')); tryPaths.push(path.join(FILES_DIR, name + '.ghx')); }
  } else {
    tryPaths.push(path.join(FILES_DIR, hasExt ? name : name + '.gh'));
    if (!hasExt) tryPaths.push(path.join(FILES_DIR, name + '.ghx'));
  }

  for (const p of tryPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const hash = md5File.sync(p);
      const fileName = path.basename(p);
      return {
        name: fileName,
        id: hash,
        path: p,
        abs: p,
        rel: path.relative(FILES_DIR, p).replace(/\\/g,'/'),
        dir: FILES_DIR
      };
    }
  }
  return null;
}

module.exports = { FILES_DIR, resolveDefinition, listDefinitions };
