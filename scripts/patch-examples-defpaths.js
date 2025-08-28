const fg = require('fast-glob'); const fs = require('fs'); const path = require('path');
(async function main(){
  const ROOT = path.resolve(process.cwd(), 'examples');
  const files = await fg(['**/*.{html,js}'], { cwd: ROOT });
  let count=0;
  for (const rel of files) {
    const full = path.join(ROOT, rel);
    let src = fs.readFileSync(full,'utf8');
    const orig = src;
    // Replace any absolute http(s) references ending in /files/... with local /files/...
    src = src.replace(/https?:\/\/[^"' )]+\/files\//g, '/files/');
    if (src !== orig) {
      fs.writeFileSync(full, src);
      count++;
      console.log('Rewrote file paths in', rel);
    }
  }
  console.log('Normalized file paths in', count, 'files');
})();
