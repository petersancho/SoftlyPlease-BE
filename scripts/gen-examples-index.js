const fs = require('fs'), path = require('path');
const root = path.join(process.cwd(),'examples');
const entries = fs.readdirSync(root, { withFileTypes: true })
  .filter(e=>e.isDirectory()).map(e=>e.name).sort();
const links = entries.map(d=>`<li><a href="${d}/">${d}</a></li>`).join('\n');
const html = `<!doctype html>
<meta charset="utf-8"><title>Examples</title>
<link rel="stylesheet" href="/styles/softly.css">
<header><h1>McNeel Examples</h1><nav><a href="/">Home</a> <a href="/my-examples/">My Examples</a></nav></header>
<main><ul>${links}</ul></main>`;
fs.writeFileSync(path.join(root,'index.html'), html);
console.log('Wrote examples/index.html with', entries.length, 'entries');
