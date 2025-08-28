<<<<<<< HEAD
const compute = require('compute-rhino3d');

// Build absolute URLs for Rhino Compute using the current app's origin
const ORIGIN = process.env.PUBLIC_APP_ORIGIN || 'https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com';

/**
 * Solve a Grasshopper definition
 * @param {string} definition - Definition name (with or without .gh extension)
 * @param {object} inputs - Input parameters
 * @param {string} defUrl - Optional pre-built definition URL (for hash-based routing)
 * @returns {Promise<object>} - Solve result
 */
async function solve(definition, inputs = {}, defUrl) {
  try {
    // Ensure definition has .gh extension
    const defName = definition.endsWith('.gh') || definition.endsWith('.ghx')
      ? definition
      : `${definition}.gh`;

    // Set compute URL from environment
    compute.url = process.env.RHINO_RHINO_COMPUTE_URL;
    compute.apiKey = process.env.RHINO_COMPUTE_KEY;

    // Build absolute URL for Rhino Compute (hotfix)
    const absoluteDefUrl = defUrl || new URL(`/files/${encodeURIComponent(defName)}`, ORIGIN).toString();

    // Debug logging
    if(process.env.NODE_ENV !== 'production') {
      console.log('Definition URL:', absoluteDefUrl);
      console.log('Compute URL:', process.env.RHINO_RHINO_COMPUTE_URL);
      console.log('API Key present:', !!process.env.RHINO_COMPUTE_KEY);
    }

    // Prepare inputs for compute
    const trees = [];
    for (const [key, value] of Object.entries(inputs)) {
      const param = new compute.Grasshopper.DataTree(key);
      param.append([0], Array.isArray(value) ? value : [value]);
      trees.push(param);
    }

    // Solve the definition with absolute URL
    const response = await compute.Grasshopper.evaluateDefinition(absoluteDefUrl, trees, false);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const result = await response.text();
    return JSON.parse(result);

  } catch (error) {
    console.error('Compute solve error:', error);
    throw error;
  }
}

module.exports = {
  solve
=======
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function buildUrl(base, path) {
  const u = new URL(path, base);
  return u.toString();
}

exports.solve = async (definition, inputs) => {
  const base = process.env.COMPUTE_URL;
  if (!base) {
    const e = new Error('COMPUTE_URL not set');
    e.status = 503;
    throw e;
  }

  const url = buildUrl(base, './grasshopper/solve');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.RHINO_COMPUTE_KEY) headers.Authorization = `Bearer ${process.env.RHINO_COMPUTE_KEY}`;

  const payload = { definition, inputs };
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });

  if (!r.ok) {
    let detail;
    try { detail = await r.text(); } catch { detail = ''; }
    const e = new Error(`Compute ${r.status} ${r.statusText}${detail ? `: ${detail.slice(0,200)}` : ''}`);
    e.status = r.status;
    throw e;
  }

  return r.json();
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
};
