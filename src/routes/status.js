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
        timeout: 5000,
        headers: computeKey ? { 'Authorization': `Bearer ${computeKey}` } : {}
      };

      const req = https.request(options, (response) => {
        computeStatus = response.statusCode === 200 ? 'up' : 'down';
        computeMessage = `Compute server responded with status ${response.statusCode}`;
      });

      req.on('error', (err) => {
        computeStatus = 'down';
        computeMessage = `Cannot connect to compute server: ${err.message}`;
      });

      req.on('timeout', () => {
        computeStatus = 'down';
        computeMessage = 'Compute server connection timeout';
        req.destroy();
      });

      req.end();

      // Wait a bit for the response
      await new Promise(resolve => setTimeout(resolve, 1000));

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