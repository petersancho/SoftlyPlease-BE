const compute = require('compute-rhino3d');

/**
 * Solve a Grasshopper definition
 * @param {string} definition - Definition name (with or without .gh extension)
 * @param {object} inputs - Input parameters
 * @returns {Promise<object>} - Solve result
 */
async function solve(definition, inputs = {}) {
  try {
    // Ensure definition has .gh extension
    const defName = definition.endsWith('.gh') || definition.endsWith('.ghx')
      ? definition
      : `${definition}.gh`;

    // Set compute URL from environment
    compute.url = process.env.COMPUTE_URL;
    compute.apiKey = process.env.RHINO_COMPUTE_KEY;

    // Get definition from our files
    const definitionPath = `/${defName}`;

    // Prepare inputs for compute
    const trees = [];
    for (const [key, value] of Object.entries(inputs)) {
      const param = new compute.Grasshopper.DataTree(key);
      param.append([0], Array.isArray(value) ? value : [value]);
      trees.push(param);
    }

    // Solve the definition
    const response = await compute.Grasshopper.evaluateDefinition(definitionPath, trees, false);

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
