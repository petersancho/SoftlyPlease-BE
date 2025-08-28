'use strict';
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const computeUrl = process.env.RHINO_COMPUTE_URL;
  const computeKey = process.env.RHINO_COMPUTE_KEY;

  let computeStatus = 'unknown';
  let computeMessage = 'Compute URL not configured';

  if (computeUrl) {
    try {
      // Test compute connectivity by making a simple request
      const https = require('https');
      const url = new URL(computeUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/health',
        method: 'GET',
        timeout: 3000, // Reduced timeout
        headers: computeKey ? { 'Authorization': `Bearer ${computeKey}` } : {}
      };

      await new Promise((resolve) => {
        const req = https.request(options, (response) => {
          computeStatus = response.statusCode === 200 ? 'up' : 'down';
          computeMessage = `Compute server responded with status ${response.statusCode}`;
          resolve();
        });

        req.on('error', (err) => {
          computeStatus = 'down';
          computeMessage = `Cannot connect to compute server: ${err.code || err.message}`;
          resolve();
        });

        req.on('timeout', () => {
          computeStatus = 'down';
          computeMessage = 'Compute server connection timeout';
          req.destroy();
          resolve();
        });

        req.end();
      });

    } catch (error) {
      computeStatus = 'error';
      computeMessage = `Error testing compute connection: ${error.message}`;
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