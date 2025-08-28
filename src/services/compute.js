const compute = require('compute-rhino3d');
const { PUBLIC_APP_ORIGIN, COMPUTE_URL, RHINO_COMPUTE_KEY } = require('../config');

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

    // Make sure your compute client/library is pointed at COMPUTE_URL elsewhere in this module.
    compute.url = COMPUTE_URL;
    if (RHINO_COMPUTE_KEY) compute.apiKey = RHINO_COMPUTE_KEY;

    // Build a fully-qualified, publicly reachable URL to the GH file we host.
    // definition is a filename like "BranchNodeRnd.gh"
    const defUrlFinal = defUrl || new URL(`/files/${encodeURIComponent(defName)}`, PUBLIC_APP_ORIGIN).toString();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[compute] definition:', defName, 'url:', defUrlFinal);
    }

    // Prepare inputs for compute
    const trees = [];
    for (const [key, value] of Object.entries(inputs)) {
      const param = new compute.Grasshopper.DataTree(key);
      param.append([0], Array.isArray(value) ? value : [value]);
      trees.push(param);
    }

    // Then call evaluateDefinition with the absolute URL:
    const response = await compute.Grasshopper.evaluateDefinition(defUrlFinal, trees, false);

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
};
