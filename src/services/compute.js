const compute = require('compute-rhino3d');

// Hotfix: Build absolute URLs for Rhino Compute
const ORIGIN = process.env.PUBLIC_APP_ORIGIN || 'https://www.softlyplease.com';

/**
 * Solve a Grasshopper definition
 * @param {string} definition - Definition name (with or without .gh extension)
 * @param {object} inputs - Input parameters
 * @param {string} defUrl - Optional pre-built definition URL (for hash-based routing)
 * @returns {Promise<object>} - Solve result
 */
async function solve(definition, inputs = {}, defUrl) {
  try {
    // Keep explicit extension when provided; default to .gh
    const defName = (definition.endsWith('.gh') || definition.endsWith('.ghx'))
      ? definition
      : `${definition}.gh`;

    // Set compute URL from environment (fallback to RHINO_COMPUTE_URL)
    compute.url = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL;
    compute.apiKey = process.env.RHINO_COMPUTE_KEY;

    // Build absolute URL for Rhino Compute (hotfix)
    const absoluteDefUrl = defUrl || `${ORIGIN}/files/${encodeURIComponent(defName)}`;

    // Prepare inputs for compute: normalize types per IO
    // Integers for these keys
    const intKeys = new Set([
      'links','square','cubecorners','smooth',
      'RH_IN:links','RH_IN:square','RH_IN:cubecorners','RH_IN:smooth',
      'rh_in:links','rh_in:square','rh_in:cubecorners','rh_in:smooth'
    ]);
    // Doubles for these keys
    const doubleKeys = new Set([
      'minr','maxr','thickness','strutsize','strutSize','segment','nodeSize',
      'RH_IN:minR','RH_IN:maxR','RH_IN:thickness','RH_IN:strutsize','RH_IN:strutSize','RH_IN:segment',
      'rh_in:minR','rh_in:maxR','rh_in:segment','rh_in:nodeSize','rh_in:strutSize'
    ]);
    const trees = [];
    for (const [key, raw] of Object.entries(inputs)) {
      // Special-case Rhino JSON payloads (e.g., encoded Brep)
      if ((key === 'RH_IN:brep' || key === 'RH_in:Brep' || key === 'rh_in:brep') && raw && typeof raw === 'object') {
        let payload = raw
        // Normalize possible shapes: either already {type,data} or a raw CommonObject with encode()
        if (!(payload.type && payload.data !== undefined)) {
          try { if (typeof raw.encode === 'function') payload = raw.encode() } catch {}
        }
        if (!(payload.type && payload.data !== undefined)) {
          // last resort: pass raw; compute may still accept
          payload = raw
        }
        const t = new compute.Grasshopper.DataTree(key);
        t.append([0], [payload]);
        trees.push(t);
        continue;
      }
      let value = raw;
      if (intKeys.has(key)) {
        if (Array.isArray(raw)) value = raw.map(v => Number.parseInt(v, 10));
        else value = Number.parseInt(raw, 10);
      } else if (doubleKeys.has(key)) {
        if (Array.isArray(raw)) value = raw.map(v => Number.parseFloat(v));
        else value = Number.parseFloat(raw);
      }
      const param = new compute.Grasshopper.DataTree(key);
      param.append([0], Array.isArray(value) ? value : [value]);
      trees.push(param);
    }

    // Solve the definition with absolute URL
    const response = await compute.Grasshopper.evaluateDefinition(absoluteDefUrl, trees, false);
    const text = await response.text();
    if (!response.ok) {
      console.error('Compute error', { status: response.status, statusText: response.statusText, url: absoluteDefUrl, body: text });
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return JSON.parse(text);

  } catch (error) {
    console.error('Compute solve error:', error);
    throw error;
  }
}

module.exports = {
  solve
};
