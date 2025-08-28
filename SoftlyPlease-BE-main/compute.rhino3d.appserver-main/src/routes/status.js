const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get('/', async (req, res) => {
  const base = process.env.COMPUTE_URL || process.env.RHINO_COMPUTE_URL || 'http://localhost:6500';
  let compute = 'down';
  let version = null;
  let health = null;

  try {
    // Check version endpoint
    const versionResponse = await fetch(new URL('version', base).toString(), {
      timeout: 3000,
      headers: {
        'User-Agent': 'RhinoCompute-AppServer/1.0'
      }
    });

    if (versionResponse.ok) {
      version = await versionResponse.text();
      compute = 'up';
    }
  } catch (versionError) {
    console.warn('Version check failed:', versionError.message);
  }

  try {
    // Check health endpoint
    const healthResponse = await fetch(new URL('healthcheck', base).toString(), {
      timeout: 3000,
      headers: {
        'User-Agent': 'RhinoCompute-AppServer/1.0'
      }
    });

    if (healthResponse.ok) {
      health = await healthResponse.text();
      if (compute !== 'up') compute = 'partial'; // Version failed but health works
    }
  } catch (healthError) {
    console.warn('Health check failed:', healthError.message);
  }

  res.json({
    ok: true,
    service: 'RhinoCompute-AppServer',
    compute: compute,
    version: version,
    health: health,
    time: new Date().toISOString(),
    config: {
      computeUrl: base,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;
