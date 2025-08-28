const fs = require('fs');
const path = require('path');
const defs = JSON.parse(fs.readFileSync(path.join('scripts','out','defs.json'),'utf8'));
const filesDir = path.join(process.cwd(),'files');
const missing = [];
const present = [];

for (const base of defs) {
  const gh = path.join(filesDir, base.replace(/\.ghx?$/i,'.gh'));
  const ghx = path.join(filesDir, base.replace(/\.ghx?$/i,'.ghx'));
  if (fs.existsSync(gh) || fs.existsSync(ghx)) present.push(base);
  else missing.push(base);
}

console.log('Present:', present.length);
if (missing.length) {
  console.error('Missing definitions in /files:');
  for (const m of missing) console.error(' -', m);
  process.exitCode = 2;
} else {
  console.log('All referenced definitions are present in /files.');
}
