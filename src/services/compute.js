const compute = require('compute-rhino3d');
const { PUBLIC_APP_ORIGIN, COMPUTE_URL, RHINO_COMPUTE_KEY } = require('../config');

function fileUrl(name) {
  // ensure definition name ends with .gh/.ghx
  const defName = /\.(gh|ghx)$/i.test(name) ? name : `${name}.gh`;
  // build absolute URL from public origin
  try {
    return new URL(`/files/${encodeURIComponent(defName)}`, PUBLIC_APP_ORIGIN).toString();
  } catch (e) {
    return `/files/${encodeURIComponent(defName)}`;
  }
}

/**
 * Solve a Grasshopper definition
 * @param {string} definition - Definition name (with or without .gh extension)
 * @param {object} inputs - Input parameters
 * @param {string} defUrl - Required definition URL (must be provided by caller)
 * @returns {Promise<object>} - Solve result
 */
async function solve(definition, inputs = {}, defUrl) {
  try {
    if (!defUrl) {
      throw new Error('Definition URL is required');
    }

    // Set compute URL and API key from config
    compute.url = COMPUTE_URL || process.env.RHINO_COMPUTE_URL;
    compute.apiKey = RHINO_COMPUTE_KEY || process.env.RHINO_COMPUTE_KEY;

    // Use the provided definition URL (request-sourced) or build one
    const absoluteDefUrl = defUrl || fileUrl(definition);

    // Debug logging
    if(process.env.NODE_ENV !== 'production') {
      console.log('Definition URL:', absoluteDefUrl);
      console.log('Compute URL:', process.env.RHINO_COMPUTE_URL);
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

    const body = await response.text().catch(() => '');
    if (!response.ok) {
      const err = new Error(`Compute error ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.body = body;
      throw err;
    }

    return JSON.parse(body);

  } catch (error) {
    console.error('Compute solve error:', error);
    throw error;
  }
}

module.exports = {
  solve
};
