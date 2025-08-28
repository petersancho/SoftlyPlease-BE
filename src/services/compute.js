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
    compute.url = process.env.COMPUTE_URL;
    compute.apiKey = process.env.RHINO_COMPUTE_KEY;

    // Build absolute URL for Rhino Compute (hotfix)
    const absoluteDefUrl = defUrl || new URL(`/files/${encodeURIComponent(defName)}`, ORIGIN).toString();

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
};
