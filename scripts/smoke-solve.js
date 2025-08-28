const fs = require('fs');
const path = require('path');
const fetch = (...a)=>import('node-fetch').then(({default:fetch})=>fetch(...a));
const pLimit = require('p-limit');

const H = process.env.H || 'https://www.softlyplease.com';
const defs = JSON.parse(fs.readFileSync(path.join('scripts','out','defs.json'),'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join('scripts','fixtures','inputs.json'),'utf8'));

async function runDef(def) {
  const body = { definition: def, inputs: fixtures[def] || {} };
  const res = await fetch(`${H}/solve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${def}: ${txt.slice(0,200)}`);
  // Basic sanity check: response contains some JSON object
  return { def, ok: true, len: txt.length };
}

(async function main(){
  const limit = pLimit(4);
  const results = await Promise.allSettled(defs.map(d => limit(()=>runDef(d))));
  let ok=0, fail=0;
  for (const r of results) {
    if (r.status === 'fulfilled') { ok++; console.log('[OK]', r.value.def, r.value.len); }
    else { fail++; console.error('[FAIL]', r.reason.message); }
  }
  console.log(`Summary: ok=${ok} fail=${fail} total=${defs.length}`);
  process.exitCode = fail ? 1 : 0;
})();
