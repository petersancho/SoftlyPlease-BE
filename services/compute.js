const fs = require('fs');
const path = require('path');
const { fetchRetry } = require('./http');
const { FILES_DIR } = require('./definition-resolver');

const BASE = (process.env.COMPUTE_URL || '').replace(/\/+$/,'') + '/';
const PUBLIC_BASE = (process.env.PUBLIC_APP_ORIGIN || 'https://www.softlyplease.com').replace(/\/+$/,'');

function mkHeaders() {
  const h = { 'Content-Type': 'application/json' };
  // Two header styles are seen in the wild; add both if key present.
  if (process.env.RHINO_COMPUTE_KEY) {
    h['Authorization'] = `Bearer ${process.env.RHINO_COMPUTE_KEY}`;
    h['RhinoComputeKey'] = process.env.RHINO_COMPUTE_KEY;
  }
  return h;
}

function toResthopperTrees(inputs) {
  if (!inputs || typeof inputs !== 'object') return [];
  const trees = [];
  const isInt = (n)=> Number.isInteger(n);
  for (const [param, value] of Object.entries(inputs)) {
    const tree = { ParamName: param, InnerTree: {} };
    const key = '{ 0; }';
    const dataArr = [];

    const pushVal = (v) => {
      if (typeof v === 'number') {
        const isI = isInt(v);
        dataArr.push({ type: isI ? 'System.Int32' : 'System.Double', data: v });
      } else if (typeof v === 'string') {
        dataArr.push({ type: 'System.String', data: v });
      } else if (typeof v === 'boolean') {
        dataArr.push({ type: 'System.Boolean', data: v });
      } else {
        // Fallback: stringify
        dataArr.push({ type: 'System.String', data: JSON.stringify(v) });
      }
    };

    if (Array.isArray(value)) {
      for (const v of value) pushVal(v);
    } else {
      pushVal(value);
    }

    tree.InnerTree[key] = dataArr;
    trees.push(tree);
  }
  return trees;
}

/*
  solve(defRel, inputs, defUrl)
  - defRel: relative path under ./files (e.g., "BranchNodeRnd.gh")
  - inputs: input parameters object
  - defUrl: full URL to the definition (with hash) that Compute will fetch
  - Strategy:
    1) Use the provided defUrl as pointer so compute fetches the GH/GHX directly.
    2) If pointer fails and file is readable, try base64 "algo" fallback.
*/
async function solve(defRel, inputs, defUrl) {
  const abs = path.join(FILES_DIR, defRel);
  if (!fs.existsSync(abs)) throw Object.assign(new Error(`Missing definition file: ${defRel}`), { status: 404 });

  const trees = toResthopperTrees(inputs || {});
  const endpoint = new URL('grasshopper', BASE).toString();

  // Use the provided definition URL (with hash) as pointer
  let res = await fetchRetry(endpoint, {
    method: 'POST',
    headers: mkHeaders(),
    timeout: 20000,
    body: JSON.stringify({ algo: null, pointer: defUrl, values: trees })
  });

  if (!res.ok) {
    // Fallback: embed file as base64 (works best with GHX; may work with GH)
    const fileBuf = fs.readFileSync(abs);
    const algo = fileBuf.toString('base64');
    res = await fetchRetry(endpoint, {
      method: 'POST',
      headers: mkHeaders(),
      timeout: 25000,
      body: JSON.stringify({ algo, pointer: null, values: trees })
    });
  }

  if (!res.ok) {
    const txt = await res.text().catch(()=>`HTTP ${res.status}`);
    const e = Object.assign(new Error(`Compute error ${res.status}: ${txt.slice(0,400)}`), { status: res.status });
    throw e;
  }

  return await res.json();
}

module.exports = { solve };
