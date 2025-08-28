'use strict';
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.get('/', async (req, res) => {
  const computeUrl = process.env.RHINO_COMPUTE_URL;
  const computeKey = process.env.RHINO_COMPUTE_KEY;

  let computeStatus = 'unknown';
  let computeMessage = 'Compute URL not configured';

  if (computeUrl) {
    try {
      // Use fetch with timeout to check compute server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const fetchOptions = {
        method: 'GET',
        signal: controller.signal,
        headers: {}
      };

      // Add authorization header if key is provided
      if (computeKey) {
        fetchOptions.headers['Authorization'] = `Bearer ${computeKey}`;
      }

      const response = await fetch(`${computeUrl}/version`, fetchOptions);
      clearTimeout(timeoutId);

      computeStatus = response.ok ? 'up' : 'down';
      computeMessage = response.ok
        ? `Compute server responded with status ${response.status}`
        : `Compute server error: ${response.status} ${response.statusText}`;

    } catch (error) {
      if (error.name === 'AbortError') {
        computeStatus = 'down';
        computeMessage = 'Compute server connection timeout';
      } else {
        computeStatus = 'error';
        computeMessage = `Compute server unreachable: ${error.message}`;
      }
    }
  }

  return res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    compute: {
      url: computeUrl || null,
      status: computeStatus,
      message: computeMessage,
      hasKey: !!computeKey
    }
  });
});

module.exports = router;