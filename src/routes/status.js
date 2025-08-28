'use strict';
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const computeUrl = process.env.RHINO_COMPUTE_URL;
  const computeKey = process.env.RHINO_COMPUTE_KEY;

  let computeStatus = 'unknown';
  let computeMessage = 'Compute URL not configured';

  if (computeUrl) {
    // Temporarily skip health check to prevent crashes
    computeStatus = 'unknown';
    computeMessage = 'Health check disabled - compute server needs to be configured';
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