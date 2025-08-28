// Compute Client for Heroku → Azure Rhino Compute communication
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const COMPUTE_URL = process.env.COMPUTE_URL;
const COMPUTE_KEY = process.env.COMPUTE_KEY;

/**
 * Check Compute server status
 * @param {AbortSignal} signal - Abort signal for timeout
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{up: boolean, code?: number, error?: string}>}
 */
async function computeStatus(signal, timeoutMs = 1500) {
  if (!COMPUTE_URL) {
    return { up: false, error: 'COMPUTE_URL not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${COMPUTE_URL}/version`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return { up: response.ok, code: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    return { up: false, error: error.message };
  }
}

/**
 * Solve with Compute server
 * @param {string} defFullPath - Full path to definition file
 * @param {object} inputs - Input parameters
 * @returns {Promise<object>} - Compute response
 */
async function solveWithCompute(defFullPath, inputs) {
  if (!COMPUTE_URL) {
    const error = new Error('COMPUTE_URL not configured');
    error.status = 503;
    throw error;
  }

  // Build payload as Compute expects
  const payload = {
    definition: defFullPath,
    inputs: inputs || {}
  };

  const response = await fetch(`${COMPUTE_URL}/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COMPUTE_KEY}`,
    },
    body: JSON.stringify(payload),
    timeout: 120000, // 2 minute timeout for compute operations
  });

  if (!response.ok) {
    let text = '';
    try {
      text = await response.text();
    } catch (e) {
      text = 'Unable to read response';
    }

    const error = new Error(text || `Compute error ${response.status}`);
    error.status = response.status || 502;
    throw error;
  }

  return response.json();
}

module.exports = {
  computeStatus,
  solveWithCompute
};
