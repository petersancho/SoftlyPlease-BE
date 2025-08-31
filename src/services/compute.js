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
    // Ensure definition has .gh extension
    const defName = definition.endsWith('.gh') || definition.endsWith('.ghx')
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
      'links','square','segment','cubecorners','smooth',
      'RH_IN:links','RH_IN:square','RH_IN:segment','RH_IN:cubecorners','RH_IN:smooth'
    ]);
    // Doubles for these keys
    const doubleKeys = new Set([
      'minr','maxr','strutsize','strutSize',
      'RH_IN:minR','RH_IN:maxR','RH_IN:strutsize','RH_IN:strutSize'
    ]);
    const trees = [];
    for (const [key, raw] of Object.entries(inputs)) {
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
