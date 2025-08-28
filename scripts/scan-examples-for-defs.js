const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

(async function main(){
  const ROOT = path.resolve(process.cwd(), 'examples');
  const files = await fg(['**/*.{html,js}'], { cwd: ROOT });
  const defs = new Set();
  const re = /([A-Za-z0-9_.-/]+\.ghx?)/gi;
  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const src = fs.readFileSync(full,'utf8');
    let m;
    while ((m = re.exec(src))) {
      const val = m[1].replace(/\\/g,'/').replace(/^\/*/, ''); // normalize
      defs.add(val.split('/').pop()); // collect basenames
    }
  }
  const list = Array.from(defs).sort();
  fs.mkdirSync(path.join('scripts','out'), { recursive: true });
  fs.writeFileSync(path.join('scripts','out','defs.json'), JSON.stringify(list, null, 2));
  console.log('Found defs:', list.length);
})();
